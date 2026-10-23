-- Migration 045: MCP Admin Fase 2 - Growth & Finanças (DEV-207)
--
-- Extensões no schema mcp_admin para o servidor MCP:
--   1. mcp_admin.promotions_v: view read-only das promoções com status computado
--   2. mcp_admin.product_votes_v: view read-only dos votos F6 (sem PII)
--   3. mcp_admin.get_funil_metrics(periodo): função de métricas do funil (dia/semana)
--   4. mcp_admin.get_lead_360(email): visão 360° unificada do lead/cliente
--
-- Acesso:
--   Role nm_mcp_bot recebe apenas SELECT nas views e EXECUTE nas funções.
--   Sem GRANT direto nas tabelas de public.

-- ================================================================
-- 1. View de Promoções (Read-Only)
-- ================================================================

CREATE OR REPLACE VIEW mcp_admin.promotions_v
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  p.id,
  p.name,
  p.product_types,
  p.discount_type,
  p.discount_value,
  p.starts_at,
  p.ends_at,
  p.is_active,
  p.banner_text,
  p.created_at,
  CASE
    WHEN NOT p.is_active THEN 'inactive'
    WHEN p.starts_at > now() THEN 'scheduled'
    WHEN p.ends_at <= now() THEN 'expired'
    ELSE 'active'
  END AS state
FROM public.promotions p;

COMMENT ON VIEW mcp_admin.promotions_v IS
  'Visualização de promoções e cupons com estado computado para o MCP admin.';

REVOKE ALL ON mcp_admin.promotions_v FROM PUBLIC;
GRANT SELECT ON mcp_admin.promotions_v TO nm_mcp_bot;

-- ================================================================
-- 2. View de Votos F6 (Read-Only, Zero PII)
-- ================================================================

CREATE OR REPLACE VIEW mcp_admin.product_votes_v
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  pv.option,
  pv.votes_count,
  pv.updated_at
FROM public.product_votes pv;

COMMENT ON VIEW mcp_admin.product_votes_v IS
  'Contagem agregada dos votos do próximo produto (F6) para o MCP admin.';

REVOKE ALL ON mcp_admin.product_votes_v FROM PUBLIC;
GRANT SELECT ON mcp_admin.product_votes_v TO nm_mcp_bot;

-- ================================================================
-- 3. Função get_funil_metrics(periodo)
-- ================================================================

CREATE OR REPLACE FUNCTION mcp_admin.get_funil_metrics(periodo text DEFAULT 'dia')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date timestamptz;
  v_periodo_clean text;
  v_leads bigint := 0;
  v_completed_analyses bigint := 0;
  v_purchases bigint := 0;
  v_refunds bigint := 0;
  v_revenue_cents bigint := 0;
  v_lead_to_sale_pct numeric := 0;
  v_analysis_to_sale_pct numeric := 0;
BEGIN
  v_periodo_clean := lower(coalesce(nullif(btrim(periodo), ''), 'dia'));

  IF v_periodo_clean = 'dia' THEN
    v_start_date := date_trunc('day', now());
  ELSE
    -- padrão 'semana' (últimos 7 dias)
    v_periodo_clean := 'semana';
    v_start_date := now() - interval '7 days';
  END IF;

  -- Leads gerados
  SELECT count(*)
  INTO v_leads
  FROM public.free_analyses_leads
  WHERE created_at >= v_start_date;

  -- Análises grátis completadas com sucesso
  SELECT count(*)
  INTO v_completed_analyses
  FROM public.free_analyses_leads
  WHERE created_at >= v_start_date
    AND status = 'completed';

  -- Vendas / assinaturas ativas criadas no período
  SELECT
    count(*),
    coalesce(sum(amount_paid), 0)
  INTO v_purchases, v_revenue_cents
  FROM public.subscriptions
  WHERE created_at >= v_start_date
    AND refunded_at IS NULL;

  -- Reembolsos ocorridos no período
  SELECT count(*)
  INTO v_refunds
  FROM public.subscriptions
  WHERE refunded_at >= v_start_date;

  -- Taxas de conversão (%)
  IF v_leads > 0 THEN
    v_lead_to_sale_pct := round((v_purchases * 100.0) / v_leads, 2);
  END IF;

  IF v_completed_analyses > 0 THEN
    v_analysis_to_sale_pct := round((v_purchases * 100.0) / v_completed_analyses, 2);
  END IF;

  RETURN jsonb_build_object(
    'periodo', v_periodo_clean,
    'since', v_start_date,
    'leads_total', v_leads,
    'analises_gratis_concluidas', v_completed_analyses,
    'vendas_confirmadas', v_purchases,
    'reembolsos', v_refunds,
    'receita_centavos', v_revenue_cents,
    'conversao_lead_venda_pct', v_lead_to_sale_pct,
    'conversao_analise_venda_pct', v_analysis_to_sale_pct
  );
END;
$$;

COMMENT ON FUNCTION mcp_admin.get_funil_metrics(text) IS
  'Agregação de métricas do funil (leads, análises grátis, vendas e conversões) para o MCP admin.';

REVOKE ALL ON FUNCTION mcp_admin.get_funil_metrics(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mcp_admin.get_funil_metrics(text) TO nm_mcp_bot;

-- ================================================================
-- 4. Função get_lead_360(email)
-- ================================================================

CREATE OR REPLACE FUNCTION mcp_admin.get_lead_360(email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm_email text;
  v_profile record;
  v_subs jsonb := '[]'::jsonb;
  v_analyses jsonb := '[]'::jsonb;
  v_free_analyses jsonb := '[]'::jsonb;
  v_opt_in boolean := false;
  v_opt_in_date timestamptz := null;
  v_total_paid bigint := 0;
  v_active_subs_count int := 0;
BEGIN
  v_norm_email := lower(nullif(btrim(email), ''));
  IF v_norm_email IS NULL THEN
    RETURN jsonb_build_object('error', 'email inválido');
  END IF;

  -- Perfil principal do usuário
  SELECT p.id, p.email, p.nome, p.role, p.is_test, p.created_at
  INTO v_profile
  FROM public.profiles p
  WHERE lower(btrim(p.email)) = v_norm_email
  ORDER BY p.created_at ASC
  LIMIT 1;

  -- Assinaturas / compras pagas
  IF v_profile.id IS NOT NULL THEN
    SELECT
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'product_type', s.product_type,
            'amount_paid', s.amount_paid,
            'currency', s.currency,
            'starts_at', s.starts_at,
            'ends_at', s.ends_at,
            'is_active', (s.ends_at > now() AND s.refunded_at IS NULL),
            'refunded_at', s.refunded_at,
            'refund_reason', s.refund_reason,
            'payment_provider', s.payment_provider,
            'created_at', s.created_at
          ) ORDER BY s.created_at DESC
        ),
        '[]'::jsonb
      ),
      coalesce(sum(CASE WHEN s.refunded_at IS NULL THEN s.amount_paid ELSE 0 END), 0),
      count(CASE WHEN s.ends_at > now() AND s.refunded_at IS NULL THEN 1 END)
    INTO v_subs, v_total_paid, v_active_subs_count
    FROM public.subscriptions s
    WHERE s.user_id = v_profile.id;

    -- Análises pagas do usuário (incluindo versionamento v3 e opt_in)
    SELECT
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'product_type', a.product_type,
            'nome_completo', a.nome_completo,
            'score', a.score,
            'score_v3', a.score_v3,
            'score_version', a.score_version,
            'parent_analysis_id', a.parent_analysis_id,
            'opt_in', a.opt_in,
            'opt_in_data', a.opt_in_data,
            'created_at', a.created_at
          ) ORDER BY a.created_at DESC
        ),
        '[]'::jsonb
      )
    INTO v_analyses
    FROM public.analyses a
    WHERE a.user_id = v_profile.id;

    -- Marketing opt-in da análise mais recente com opt-in
    SELECT a.opt_in, a.opt_in_data
    INTO v_opt_in, v_opt_in_date
    FROM public.analyses a
    WHERE a.user_id = v_profile.id
      AND a.opt_in = true
    ORDER BY a.opt_in_data DESC NULLS LAST
    LIMIT 1;
  END IF;

  -- Análises gratuitas solicitadas pelo lead
  SELECT
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', fal.id,
          'nome_completo', fal.nome_completo,
          'status', fal.status,
          'has_pdf', (fal.pdf_base64 IS NOT NULL),
          'created_at', fal.created_at,
          'completed_at', fal.completed_at
        ) ORDER BY fal.created_at DESC
      ),
      '[]'::jsonb
    )
  INTO v_free_analyses
  FROM public.free_analyses_leads fal
  WHERE lower(btrim(fal.email)) = v_norm_email;

  RETURN jsonb_build_object(
    'email', v_norm_email,
    'is_registered', (v_profile.id IS NOT NULL),
    'is_subscriber', (v_active_subs_count > 0),
    'profile', CASE
      WHEN v_profile.id IS NOT NULL THEN
        jsonb_build_object(
          'id', v_profile.id,
          'nome', v_profile.nome,
          'role', v_profile.role,
          'is_test', coalesce(v_profile.is_test, false),
          'created_at', v_profile.created_at
        )
      ELSE NULL
    END,
    'subscriptions', v_subs,
    'analyses', v_analyses,
    'free_analyses', v_free_analyses,
    'marketing_opt_in', jsonb_build_object(
      'opted_in', coalesce(v_opt_in, false),
      'opt_in_date', v_opt_in_date
    ),
    'summary', jsonb_build_object(
      'total_paid_cents', v_total_paid,
      'active_subscriptions_count', v_active_subs_count,
      'paid_analyses_count', jsonb_array_length(v_analyses),
      'free_analyses_count', jsonb_array_length(v_free_analyses)
    )
  );
END;
$$;

COMMENT ON FUNCTION mcp_admin.get_lead_360(text) IS
  'Visão 360° unificada do lead/cliente (perfil, compras, análises v3, análises gratuitas e marketing).';

REVOKE ALL ON FUNCTION mcp_admin.get_lead_360(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mcp_admin.get_lead_360(text) TO nm_mcp_bot;
