-- Migration 044: MCP Admin Schema, Views, Audit e Role Minima (DEV-207)
--
-- Servidor MCP admin para operacoes de agentes e Guilherme sem SQL manual.
-- Nao utiliza service_role do Supabase para leitura.
--
-- Modelo:
--   schema mcp_admin                        -- isolado fora dos schemas expostos do Data API
--   mcp_admin.analises_gratis_v             -- view read-only com status de analises gratis (sem payload pdf_base64)
--   mcp_admin.get_lead_status(email)        -- funcao consolidada de status do lead e assinaturas
--   mcp_admin.mcp_audit                     -- tabela append-only para auditoria de chamadas de agentes
--   role nm_mcp_bot                         -- NOLOGIN, NOINHERIT
--                                              SELECT na view, EXECUTE na funcao, INSERT/SELECT em mcp_audit
--                                              sem GRANT nas tabelas base de public nem auth

-- ================================================================
-- Role
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nm_mcp_bot') THEN
    CREATE ROLE nm_mcp_bot NOLOGIN NOINHERIT;
  END IF;
END
$$;

ALTER ROLE nm_mcp_bot NOINHERIT;
ALTER ROLE nm_mcp_bot SET search_path = mcp_admin;

COMMENT ON ROLE nm_mcp_bot IS
  'Bot/Servico MCP Admin (DEV-207): SELECT em mcp_admin.analises_gratis_v, EXECUTE em mcp_admin.get_lead_status(text), INSERT em mcp_admin.mcp_audit. Sem LOGIN. Nao herda outros papeis. Sem GRANT nas tabelas base.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    GRANT nm_mcp_bot TO authenticator;
  END IF;
END
$$;

-- ================================================================
-- Schema
-- ================================================================

CREATE SCHEMA IF NOT EXISTS mcp_admin;

REVOKE ALL ON SCHEMA mcp_admin FROM PUBLIC;
GRANT USAGE ON SCHEMA mcp_admin TO nm_mcp_bot;

COMMENT ON SCHEMA mcp_admin IS
  'Superficie administrativa do servidor MCP. Nao adicionar aos Exposed schemas do Data API sem autorizacao.';

-- ================================================================
-- View de Analises Gratis (Read-Only)
-- ================================================================

CREATE OR REPLACE VIEW mcp_admin.analises_gratis_v
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  l.id,
  l.email,
  l.nome_completo,
  l.data_nascimento,
  l.status,
  l.error_message,
  (l.pdf_base64 IS NOT NULL) AS has_pdf,
  l.created_at,
  l.completed_at
FROM public.free_analyses_leads l;

COMMENT ON VIEW mcp_admin.analises_gratis_v IS
  'Lista e status de analises gratis para o MCP admin. Omite o payload bruto pdf_base64 por seguranca e performance.';

REVOKE ALL ON mcp_admin.analises_gratis_v FROM PUBLIC;
GRANT SELECT ON mcp_admin.analises_gratis_v TO nm_mcp_bot;

-- ================================================================
-- Funcao get_lead_status(email)
-- ================================================================

CREATE OR REPLACE FUNCTION mcp_admin.get_lead_status(email text)
RETURNS TABLE (
  email text,
  is_registered boolean,
  is_subscriber boolean,
  profile_id uuid,
  profile_nome text,
  profile_created_at timestamptz,
  product_types text[],
  subscription_ends_at timestamptz,
  total_free_analyses bigint,
  last_free_analysis_id uuid,
  last_free_analysis_status text,
  last_free_analysis_created_at timestamptz,
  last_free_analysis_has_pdf boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH input AS (
    SELECT NULLIF(lower(btrim(get_lead_status.email)), '') AS normalized
  ),
  matched_profiles AS (
    SELECT p.id, p.email, p.nome, p.created_at
    FROM public.profiles p
    CROSS JOIN input i
    WHERE i.normalized IS NOT NULL
      AND lower(btrim(p.email)) = i.normalized
  ),
  canonical_profile AS (
    SELECT mp.id, mp.email, mp.nome, mp.created_at
    FROM matched_profiles mp
    ORDER BY mp.created_at ASC, mp.id ASC
    LIMIT 1
  ),
  active_subs AS (
    SELECT s.product_type, s.ends_at
    FROM public.subscriptions s
    JOIN matched_profiles mp ON mp.id = s.user_id
    WHERE s.refunded_at IS NULL
      AND (s.ends_at IS NULL OR s.ends_at > now())
  ),
  subs_agg AS (
    SELECT
      count(*) > 0 AS is_subscriber,
      array_agg(DISTINCT product_type ORDER BY product_type) AS product_types,
      max(ends_at) AS subscription_ends_at
    FROM active_subs
  ),
  lead_analyses AS (
    SELECT
      fal.id,
      fal.status,
      fal.created_at,
      (fal.pdf_base64 IS NOT NULL) AS has_pdf,
      row_number() OVER (ORDER BY fal.created_at DESC, fal.id DESC) AS rn,
      count(*) OVER () AS total_count
    FROM public.free_analyses_leads fal
    CROSS JOIN input i
    WHERE i.normalized IS NOT NULL
      AND lower(btrim(fal.email)) = i.normalized
  ),
  latest_analysis AS (
    SELECT id, status, created_at, has_pdf, total_count
    FROM lead_analyses
    WHERE rn = 1
  )
  SELECT
    i.normalized AS email,
    (cp.id IS NOT NULL) AS is_registered,
    coalesce(sa.is_subscriber, false) AS is_subscriber,
    cp.id AS profile_id,
    cp.nome AS profile_nome,
    cp.created_at AS profile_created_at,
    sa.product_types,
    sa.subscription_ends_at,
    coalesce(la.total_count, 0) AS total_free_analyses,
    la.id AS last_free_analysis_id,
    la.status AS last_free_analysis_status,
    la.created_at AS last_free_analysis_created_at,
    coalesce(la.has_pdf, false) AS last_free_analysis_has_pdf
  FROM input i
  LEFT JOIN canonical_profile cp ON true
  LEFT JOIN subs_agg sa ON true
  LEFT JOIN latest_analysis la ON true
  WHERE i.normalized IS NOT NULL;
$$;

COMMENT ON FUNCTION mcp_admin.get_lead_status(text) IS
  'Status consolidado de lead/cliente para o MCP admin. Nao vaza senhas, tokens de pagamento ou payloads brutos.';

REVOKE ALL ON FUNCTION mcp_admin.get_lead_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mcp_admin.get_lead_status(text) TO nm_mcp_bot;

-- ================================================================
-- Tabela de Auditoria (Append-Only)
-- ================================================================

CREATE TABLE IF NOT EXISTS mcp_admin.mcp_audit (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent          TEXT        NOT NULL,
  tool           TEXT        NOT NULL,
  parameters     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  result_summary JSONB,
  dry_run        BOOLEAN     NOT NULL DEFAULT true,
  status         TEXT        NOT NULL CHECK (status IN ('success', 'error', 'rejected')),
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE mcp_admin.mcp_audit IS
  'Registro append-only de acoes e consultas executadas pelo MCP admin. PII e mascarada antes da gravacao.';

CREATE INDEX IF NOT EXISTS idx_mcp_audit_created_at ON mcp_admin.mcp_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_audit_agent ON mcp_admin.mcp_audit (agent);
CREATE INDEX IF NOT EXISTS idx_mcp_audit_tool ON mcp_admin.mcp_audit (tool);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE mcp_admin.mcp_audit ENABLE ROW LEVEL SECURITY;

-- nm_mcp_bot pode apenas inserir e consultar registros de auditoria (nunca alterar ou apagar)
DROP POLICY IF EXISTS "mcp_audit_insert" ON mcp_admin.mcp_audit;
CREATE POLICY "mcp_audit_insert" ON mcp_admin.mcp_audit
  FOR INSERT TO nm_mcp_bot WITH CHECK (true);

DROP POLICY IF EXISTS "mcp_audit_select" ON mcp_admin.mcp_audit;
CREATE POLICY "mcp_audit_select" ON mcp_admin.mcp_audit
  FOR SELECT TO nm_mcp_bot USING (true);

-- service_role tem acesso administrativo total
DROP POLICY IF EXISTS "mcp_audit_service_all" ON mcp_admin.mcp_audit;
CREATE POLICY "mcp_audit_service_all" ON mcp_admin.mcp_audit
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT INSERT, SELECT ON mcp_admin.mcp_audit TO nm_mcp_bot;

-- Revogar qualquer grant residual em public para a role nm_mcp_bot
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM nm_mcp_bot;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM nm_mcp_bot;
REVOKE ALL ON SCHEMA public FROM nm_mcp_bot;
