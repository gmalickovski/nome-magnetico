-- Migration 053: DEV-211 Fase 3 — remover coluna pdf_base64 de free_analyses_leads
-- Pré-requisitos: todos os PDFs em Storage (pdf_path preenchido onde havia pdf_base64).
-- Após aplicar: VACUUM FULL public.free_analyses_leads (ou aguardar autovacuum) para liberar TOAST/disco.

-- ================================================================
-- 1. Atualizar superfícies MCP que referenciam pdf_base64 (antes do DROP)
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
  (l.pdf_path IS NOT NULL AND btrim(l.pdf_path) <> '') AS has_pdf,
  l.created_at,
  l.completed_at
FROM public.free_analyses_leads l;

COMMENT ON VIEW mcp_admin.analises_gratis_v IS
  'Lista e status de analises gratis para o MCP admin. has_pdf via pdf_path (Storage).';

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
      (fal.pdf_path IS NOT NULL AND btrim(fal.pdf_path) <> '') AS has_pdf,
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

-- get_lead_360: copia de 045 com has_pdf via pdf_path
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

  SELECT p.id, p.email, p.nome, p.role, p.is_test, p.created_at
  INTO v_profile
  FROM public.profiles p
  WHERE lower(btrim(p.email)) = v_norm_email
  ORDER BY p.created_at ASC
  LIMIT 1;

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

    SELECT a.opt_in, a.opt_in_data
    INTO v_opt_in, v_opt_in_date
    FROM public.analyses a
    WHERE a.user_id = v_profile.id
      AND a.opt_in = true
    ORDER BY a.opt_in_data DESC NULLS LAST
    LIMIT 1;
  END IF;

  SELECT
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', fal.id,
          'nome_completo', fal.nome_completo,
          'status', fal.status,
          'has_pdf', (fal.pdf_path IS NOT NULL AND btrim(fal.pdf_path) <> ''),
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

-- ================================================================
-- 2. Guard: abortar se ainda houver pdf_base64 sem pdf_path
-- ================================================================

DO $$
DECLARE
  orphan_count bigint;
BEGIN
  SELECT count(*) INTO orphan_count
  FROM public.free_analyses_leads
  WHERE pdf_base64 IS NOT NULL
    AND (pdf_path IS NULL OR btrim(pdf_path) = '');

  IF orphan_count > 0 THEN
    RAISE EXCEPTION
      'DEV-211: % linha(s) com pdf_base64 preenchido e sem pdf_path. Migre para Storage antes de aplicar 053.',
      orphan_count;
  END IF;
END $$;

-- ================================================================
-- 3. Liberar TOAST e remover coluna
-- ================================================================

UPDATE public.free_analyses_leads
SET pdf_base64 = NULL
WHERE pdf_base64 IS NOT NULL;

ALTER TABLE public.free_analyses_leads
  DROP COLUMN IF EXISTS pdf_base64;

COMMENT ON COLUMN public.free_analyses_leads.pdf_path IS
  'Caminho relativo no bucket privado free-pdfs (ex.: <lead_uuid>.pdf). Única fonte do PDF após migration 053.';
