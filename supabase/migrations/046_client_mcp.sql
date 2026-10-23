-- Migration 046: Client MCP Schema, Tokens, Quota e Auditoria (DEV-208 Fase A)
--
-- Servidor MCP isolado para clientes com compras ativas e agentes de atendimento.
-- Totalmente separado do MCP admin (nm-mcp).
--
-- Modelo:
--   schema client_mcp                     -- isolado fora dos schemas expostos do Data API
--   role nm_client_mcp_bot                -- NOLOGIN, NOINHERIT, com permissões restritas
--   client_mcp.client_tokens              -- tokens de clientes/suporte vinculados a compras ativas
--   client_mcp.verify_client_access(...)  -- RPC atômica que valida subscription ativa e debita cotas
--   client_mcp.mcp_client_audit           -- auditoria append-only de chamadas (zero PII)
--
-- Regras de Segurança:
--   - Role nm_client_mcp_bot NUNCA tem acesso direto ao schema public ou auth.users.
--   - Nenhuma ferramenta admin exposta.
--   - Sem dados de outros usuários ou métricas de negócio.

-- ================================================================
-- 1. Role Postgres Mínima
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nm_client_mcp_bot') THEN
    CREATE ROLE nm_client_mcp_bot NOLOGIN NOINHERIT;
  END IF;
END
$$;

ALTER ROLE nm_client_mcp_bot NOINHERIT;
ALTER ROLE nm_client_mcp_bot SET search_path = client_mcp;

COMMENT ON ROLE nm_client_mcp_bot IS
  'Bot/Serviço MCP do Cliente (DEV-208): Apenas verificação de token/cota e auditoria. Sem permissões em public nem admin.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    GRANT nm_client_mcp_bot TO authenticator;
  END IF;
END
$$;

-- ================================================================
-- 2. Schema client_mcp
-- ================================================================

CREATE SCHEMA IF NOT EXISTS client_mcp;

REVOKE ALL ON SCHEMA client_mcp FROM PUBLIC;
GRANT USAGE ON SCHEMA client_mcp TO nm_client_mcp_bot;

COMMENT ON SCHEMA client_mcp IS
  'Superfície do MCP voltado para clientes pagantes e parceiros. Isolado de operações admin.';

-- ================================================================
-- 3. Tabela de Tokens de Clientes e Cotas
-- ================================================================

CREATE TABLE IF NOT EXISTS client_mcp.client_tokens (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID        REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  token_hash      TEXT        NOT NULL UNIQUE, -- SHA-256 do token em minúsculas
  quota_limit     INTEGER     NOT NULL DEFAULT 50 CHECK (quota_limit > 0),
  used_count      INTEGER     NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_tokens_quota_check CHECK (used_count <= quota_limit)
);

COMMENT ON TABLE client_mcp.client_tokens IS
  'Tokens de acesso para o MCP de clientes e suporte, vinculados a assinaturas ativas com cota de uso.';

CREATE INDEX IF NOT EXISTS idx_client_tokens_token_hash ON client_mcp.client_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_client_tokens_user_id ON client_mcp.client_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_client_tokens_subscription_id ON client_mcp.client_tokens (subscription_id);

ALTER TABLE client_mcp.client_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_tokens_bot_all" ON client_mcp.client_tokens;
CREATE POLICY "client_tokens_bot_all" ON client_mcp.client_tokens
  FOR ALL TO nm_client_mcp_bot USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "client_tokens_service_all" ON client_mcp.client_tokens;
CREATE POLICY "client_tokens_service_all" ON client_mcp.client_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON client_mcp.client_tokens TO nm_client_mcp_bot;

-- ================================================================
-- 4. Função Atômica: verify_client_access(p_token_hash, p_cost)
-- ================================================================

CREATE OR REPLACE FUNCTION client_mcp.verify_client_access(
  p_token_hash TEXT,
  p_cost INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, client_mcp
AS $$
DECLARE
  v_token RECORD;
  v_sub RECORD;
  v_new_used INTEGER;
BEGIN
  -- 1. Localizar o token ativo
  SELECT id, user_id, subscription_id, quota_limit, used_count, is_active, expires_at
  INTO v_token
  FROM client_mcp.client_tokens
  WHERE token_hash = lower(btrim(p_token_hash));

  IF v_token.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Token não encontrado ou inválido');
  END IF;

  IF NOT v_token.is_active THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Token desativado');
  END IF;

  IF v_token.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Token expirado');
  END IF;

  -- 2. Verificar se a assinatura vinculada ainda é válida (se houver subscription vinculada)
  IF v_token.subscription_id IS NOT NULL THEN
    SELECT id, ends_at, refunded_at, product_type
    INTO v_sub
    FROM public.subscriptions
    WHERE id = v_token.subscription_id;

    IF v_sub.id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Assinatura vinculada não encontrada');
    END IF;

    IF v_sub.refunded_at IS NOT NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Compra cancelada por reembolso');
    END IF;

    IF v_sub.ends_at IS NOT NULL AND v_sub.ends_at <= now() THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Acesso da assinatura expirado');
    END IF;
  END IF;

  -- 3. Verificar cota disponível
  v_new_used := v_token.used_count + p_cost;
  IF v_new_used > v_token.quota_limit THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Cota de uso excedida para este plano',
      'quota_limit', v_token.quota_limit,
      'used_count', v_token.used_count
    );
  END IF;

  -- 4. Debitar cota atomicamente
  UPDATE client_mcp.client_tokens
  SET used_count = v_new_used
  WHERE id = v_token.id;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', v_token.user_id,
    'subscription_id', v_token.subscription_id,
    'quota_limit', v_token.quota_limit,
    'used_count', v_new_used,
    'remaining_quota', (v_token.quota_limit - v_new_used)
  );
END;
$$;

COMMENT ON FUNCTION client_mcp.verify_client_access(TEXT, INTEGER) IS
  'Valida autenticação, status da assinatura paga e debita cota de forma atômica para o client MCP.';

REVOKE ALL ON FUNCTION client_mcp.verify_client_access(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION client_mcp.verify_client_access(TEXT, INTEGER) TO nm_client_mcp_bot;

-- ================================================================
-- 5. Tabela de Auditoria Append-Only (Zero PII)
-- ================================================================

CREATE TABLE IF NOT EXISTS client_mcp.mcp_client_audit (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash     TEXT        NOT NULL,
  tool           TEXT        NOT NULL,
  parameters     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  status         TEXT        NOT NULL CHECK (status IN ('success', 'error', 'rejected')),
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE client_mcp.mcp_client_audit IS
  'Registro append-only de consultas dos clientes. Zero dados pessoais ou senhas são gravados.';

CREATE INDEX IF NOT EXISTS idx_mcp_client_audit_created_at ON client_mcp.mcp_client_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_client_audit_token_hash ON client_mcp.mcp_client_audit (token_hash);

ALTER TABLE client_mcp.mcp_client_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mcp_client_audit_bot_insert" ON client_mcp.mcp_client_audit;
CREATE POLICY "mcp_client_audit_bot_insert" ON client_mcp.mcp_client_audit
  FOR INSERT TO nm_client_mcp_bot WITH CHECK (true);

DROP POLICY IF EXISTS "mcp_client_audit_bot_select" ON client_mcp.mcp_client_audit;
CREATE POLICY "mcp_client_audit_bot_select" ON client_mcp.mcp_client_audit
  FOR SELECT TO nm_client_mcp_bot USING (true);

DROP POLICY IF EXISTS "mcp_client_audit_service_all" ON client_mcp.mcp_client_audit;
CREATE POLICY "mcp_client_audit_service_all" ON client_mcp.mcp_client_audit
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT INSERT, SELECT ON client_mcp.mcp_client_audit TO nm_client_mcp_bot;

-- Revoga qualquer grant acidental em public para a role do client bot
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM nm_client_mcp_bot;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM nm_client_mcp_bot;
REVOKE ALL ON SCHEMA public FROM nm_client_mcp_bot;
