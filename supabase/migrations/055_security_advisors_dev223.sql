-- Migration 055: Advisors de segurança restantes (DEV-223)
-- 1. is_admin() em schema private (fora da REST API) — policies continuam usando a função
-- 2. Extensão vector → schema extensions (Supabase advisor)
-- 3. Policies explícitas service_role em tabelas com RLS sem policy
-- NÃO aplicar em produção sem OK do Guilherme. Rollback: docs/architecture/security-advisors-dev223-rollback.sql

-- =============================================================================
-- 1. private.is_admin() (substitui public.is_admin nas políticas RLS)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO postgres, service_role, authenticated;

CREATE OR REPLACE FUNCTION private.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$function$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, service_role;

-- Reescreve expressões das políticas que referenciam is_admin()
DO $$
DECLARE
  pol record;
  new_qual text;
  new_check text;
  cmd text;
BEGIN
  FOR pol IN
    SELECT
      n.nspname AS schemaname,
      c.relname AS tablename,
      p.polname AS policyname,
      pg_get_expr(p.polqual, p.polrelid) AS qual,
      pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND (
        pg_get_expr(p.polqual, p.polrelid) LIKE '%is_admin()%'
        OR pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%is_admin()%'
      )
  LOOP
    new_qual := pol.qual;
    new_check := pol.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, 'private.is_admin()', '<<<PRIVATE_IS_ADMIN>>>');
      new_qual := replace(new_qual, 'public.is_admin()', 'private.is_admin()');
      new_qual := replace(new_qual, 'is_admin()', 'private.is_admin()');
      new_qual := replace(new_qual, '<<<PRIVATE_IS_ADMIN>>>', 'private.is_admin()');
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := replace(new_check, 'private.is_admin()', '<<<PRIVATE_IS_ADMIN>>>');
      new_check := replace(new_check, 'public.is_admin()', 'private.is_admin()');
      new_check := replace(new_check, 'is_admin()', 'private.is_admin()');
      new_check := replace(new_check, '<<<PRIVATE_IS_ADMIN>>>', 'private.is_admin()');
    END IF;

    IF new_qual IS NOT NULL AND new_check IS NOT NULL THEN
      cmd := format(
        'ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename, new_qual, new_check
      );
    ELSIF new_qual IS NOT NULL THEN
      cmd := format(
        'ALTER POLICY %I ON %I.%I USING (%s)',
        pol.policyname, pol.schemaname, pol.tablename, new_qual
      );
    ELSIF new_check IS NOT NULL THEN
      cmd := format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename, new_check
      );
    ELSE
      CONTINUE;
    END IF;

    EXECUTE cmd;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.is_admin();

-- =============================================================================
-- 2. pgvector no schema extensions (coluna faq_embeddings.embedding + índice HNSW)
-- =============================================================================

ALTER EXTENSION vector SET SCHEMA extensions;

-- =============================================================================
-- 3. RLS com policy explícita para service_role (backend / BYPASSRLS)
-- =============================================================================

DO $$
BEGIN
  IF to_regclass('public.access_lifecycle_sends') IS NOT NULL THEN
    DROP POLICY IF EXISTS "access_lifecycle_sends_service_all" ON public.access_lifecycle_sends;
    CREATE POLICY "access_lifecycle_sends_service_all" ON public.access_lifecycle_sends
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_lifecycle_sends TO service_role;
  END IF;

  IF to_regclass('public.analise_leads') IS NOT NULL THEN
    DROP POLICY IF EXISTS "analise_leads_service_all" ON public.analise_leads;
    CREATE POLICY "analise_leads_service_all" ON public.analise_leads
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.analise_leads TO service_role;
  END IF;

  IF to_regclass('public.error_logs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "error_logs_service_all" ON public.error_logs;
    CREATE POLICY "error_logs_service_all" ON public.error_logs
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_logs TO service_role;
  END IF;
END $$;
