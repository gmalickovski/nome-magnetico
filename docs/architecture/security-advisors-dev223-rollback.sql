-- Rollback DEV-223 — reversão da migration 055_security_advisors_dev223.sql
-- Aplicar manualmente no Supabase se necessário reverter.

-- 3. Remover policies service_role
DROP POLICY IF EXISTS "error_logs_service_all" ON public.error_logs;
DROP POLICY IF EXISTS "analise_leads_service_all" ON public.analise_leads;
DROP POLICY IF EXISTS "access_lifecycle_sends_service_all" ON public.access_lifecycle_sends;

-- 2. Extensão vector de volta ao public
ALTER EXTENSION vector SET SCHEMA public;

-- 1. Restaurar public.is_admin() e políticas
CREATE OR REPLACE FUNCTION public.is_admin()
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

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

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
        pg_get_expr(p.polqual, p.polrelid) LIKE '%private.is_admin()%'
        OR pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%private.is_admin()%'
      )
  LOOP
    new_qual := pol.qual;
    new_check := pol.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, 'private.is_admin()', 'is_admin()');
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := replace(new_check, 'private.is_admin()', 'is_admin()');
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

DROP FUNCTION IF EXISTS private.is_admin();

REVOKE ALL ON SCHEMA private FROM authenticated, service_role;
-- Mantém o schema private vazio (não remove o schema para evitar efeitos colaterais).
