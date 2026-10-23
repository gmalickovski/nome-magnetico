-- Migration 055: Advisors de segurança restantes (DEV-223)
-- 1. private.is_admin() — só policies TO authenticated/service_role (anon não precisa de EXECUTE)
-- 2. Extensão vector → schema extensions
-- 3. Policies explícitas service_role em tabelas com RLS sem policy
-- Rollback: docs/architecture/security-advisors-dev223-rollback.sql

-- =============================================================================
-- 1. private.is_admin()
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO postgres, service_role, authenticated;

CREATE OR REPLACE FUNCTION private.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$function$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, service_role;

-- =============================================================================
-- 1b. RLS — recria policies da 050 com private.is_admin() e leitura anon sem is_admin
-- =============================================================================

-- AI_CONFIG
DROP POLICY IF EXISTS "ai_config_read" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_select_anon" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_select_authenticated" ON public.ai_config;

CREATE POLICY "ai_config_select_anon" ON public.ai_config
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "ai_config_select_authenticated" ON public.ai_config
  FOR SELECT TO authenticated
  USING (is_active = true OR private.is_admin());

ALTER POLICY "ai_config_admin_insert" ON public.ai_config
  WITH CHECK (private.is_admin());
ALTER POLICY "ai_config_admin_update" ON public.ai_config
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "ai_config_admin_delete" ON public.ai_config
  USING (private.is_admin());

-- ANALYSES (só authenticated — sem anon)
ALTER POLICY "analyses_select" ON public.analyses
  USING (private.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "analyses_insert" ON public.analyses
  WITH CHECK (private.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "analyses_update" ON public.analyses
  USING (private.is_admin() OR (SELECT auth.uid()) = user_id)
  WITH CHECK (private.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "analyses_delete_admin" ON public.analyses
  USING (private.is_admin());

-- BLOG_POSTS
DROP POLICY IF EXISTS "blog_posts_select" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_anon" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_authenticated" ON public.blog_posts;

CREATE POLICY "blog_posts_select_anon" ON public.blog_posts
  FOR SELECT TO anon
  USING (is_published = true);

CREATE POLICY "blog_posts_select_authenticated" ON public.blog_posts
  FOR SELECT TO authenticated
  USING (is_published = true OR private.is_admin());

ALTER POLICY "blog_posts_admin_insert" ON public.blog_posts
  WITH CHECK (private.is_admin());
ALTER POLICY "blog_posts_admin_update" ON public.blog_posts
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "blog_posts_admin_delete" ON public.blog_posts
  USING (private.is_admin());

-- FAQ_CATEGORIES
DROP POLICY IF EXISTS "faq_categories_select" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_select_anon" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_select_authenticated" ON public.faq_categories;

CREATE POLICY "faq_categories_select_anon" ON public.faq_categories
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "faq_categories_select_authenticated" ON public.faq_categories
  FOR SELECT TO authenticated
  USING (is_active = true OR private.is_admin());

ALTER POLICY "faq_categories_admin_insert" ON public.faq_categories
  WITH CHECK (private.is_admin());
ALTER POLICY "faq_categories_admin_update" ON public.faq_categories
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "faq_categories_admin_delete" ON public.faq_categories
  USING (private.is_admin());

-- FAQ_ITEMS
DROP POLICY IF EXISTS "faq_items_select" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_select_anon" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_select_authenticated" ON public.faq_items;

CREATE POLICY "faq_items_select_anon" ON public.faq_items
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "faq_items_select_authenticated" ON public.faq_items
  FOR SELECT TO authenticated
  USING (is_active = true OR private.is_admin());

ALTER POLICY "faq_items_admin_insert" ON public.faq_items
  WITH CHECK (private.is_admin());
ALTER POLICY "faq_items_admin_update" ON public.faq_items
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "faq_items_admin_delete" ON public.faq_items
  USING (private.is_admin());

-- GLOSSARY_TERMS
DROP POLICY IF EXISTS "glossary_terms_select" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms_select_anon" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms_select_authenticated" ON public.glossary_terms;

CREATE POLICY "glossary_terms_select_anon" ON public.glossary_terms
  FOR SELECT TO anon
  USING (is_published = true);

CREATE POLICY "glossary_terms_select_authenticated" ON public.glossary_terms
  FOR SELECT TO authenticated
  USING (is_published = true OR private.is_admin());

ALTER POLICY "glossary_terms_admin_insert" ON public.glossary_terms
  WITH CHECK (private.is_admin());
ALTER POLICY "glossary_terms_admin_update" ON public.glossary_terms
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "glossary_terms_admin_delete" ON public.glossary_terms
  USING (private.is_admin());

-- PROFILES
ALTER POLICY "profiles_select" ON public.profiles
  USING (private.is_admin() OR (SELECT auth.uid()) = id);
ALTER POLICY "profiles_update" ON public.profiles
  USING (private.is_admin() OR (SELECT auth.uid()) = id)
  WITH CHECK (private.is_admin() OR (SELECT auth.uid()) = id);
ALTER POLICY "profiles_admin_insert" ON public.profiles
  WITH CHECK (private.is_admin());
ALTER POLICY "profiles_admin_delete" ON public.profiles
  USING (private.is_admin());

-- SUBSCRIPTIONS
ALTER POLICY "subscriptions_select" ON public.subscriptions
  USING (private.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "subscriptions_admin_insert" ON public.subscriptions
  WITH CHECK (private.is_admin());
ALTER POLICY "subscriptions_admin_update" ON public.subscriptions
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "subscriptions_admin_delete" ON public.subscriptions
  USING (private.is_admin());

-- SUPPORT_MESSAGES
ALTER POLICY "messages_select" ON public.support_messages
  USING (
    private.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id AND t.user_id = (SELECT auth.uid())
    )
  );
ALTER POLICY "messages_insert" ON public.support_messages
  WITH CHECK (
    private.is_admin()
    OR (
      ((SELECT auth.uid()) = author_id)
      AND EXISTS (
        SELECT 1 FROM public.support_tickets t
        WHERE t.id = support_messages.ticket_id AND t.user_id = (SELECT auth.uid())
      )
    )
  );
ALTER POLICY "messages_admin_update" ON public.support_messages
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "messages_admin_delete" ON public.support_messages
  USING (private.is_admin());

-- SUPPORT_TICKETS
ALTER POLICY "tickets_select" ON public.support_tickets
  USING (private.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "tickets_insert" ON public.support_tickets
  WITH CHECK (private.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "tickets_admin_update" ON public.support_tickets
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "tickets_admin_delete" ON public.support_tickets
  USING (private.is_admin());

DROP FUNCTION IF EXISTS public.is_admin();

-- =============================================================================
-- 2. pgvector no schema extensions
-- =============================================================================

ALTER EXTENSION vector SET SCHEMA extensions;

-- =============================================================================
-- 3. RLS com policy explícita para service_role
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
