-- Migration 054: Advisors residuais (DEV-216) — idempotente
-- is_admin(): EXECUTE só authenticated + service_role; search_path fixo
-- Tabelas só service_role: REVOKE explícito + comentário (RLS sem policy intencional)
-- Extensão vector em public: documentada (não mover — quebra RAG)

-- ================================================================
-- 1. is_admin()
-- ================================================================

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;

-- ================================================================
-- 2. Tabelas backend-only (RLS ativo, sem policy = deny para anon/authenticated)
-- ================================================================

DO $$
BEGIN
  IF to_regclass('public.access_lifecycle_sends') IS NOT NULL THEN
    REVOKE ALL ON public.access_lifecycle_sends FROM PUBLIC, anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_lifecycle_sends TO service_role;
    COMMENT ON TABLE public.access_lifecycle_sends IS
      'Idempotência de e-mails do lifecycle de acesso. Apenas service_role (backend). RLS sem policy intencional.';
  END IF;

  IF to_regclass('public.analise_leads') IS NOT NULL THEN
    REVOKE ALL ON public.analise_leads FROM PUBLIC, anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.analise_leads TO service_role;
    COMMENT ON TABLE public.analise_leads IS
      'Leads da landing /api/save-lead. Apenas service_role (backend). RLS sem policy intencional.';
  END IF;

  IF to_regclass('public.error_logs') IS NOT NULL THEN
    REVOKE ALL ON public.error_logs FROM PUBLIC, anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_logs TO service_role;
    COMMENT ON TABLE public.error_logs IS
      'Logs operacionais do app (error-logger). Apenas service_role. RLS sem policy intencional.';
  END IF;
END $$;

-- ================================================================
-- 3. Extensão vector (schema public)
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    COMMENT ON EXTENSION vector IS
      'pgvector no schema public (legado RAG FAQ). Não mover para extensions sem migration dedicada e reteste de match_faq_embeddings.';
  END IF;
END $$;
