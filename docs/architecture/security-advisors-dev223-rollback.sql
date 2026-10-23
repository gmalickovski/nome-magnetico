-- Rollback DEV-223 — reversão da migration 055_security_advisors_dev223.sql

-- 3. Remover policies service_role adicionadas pela 055
DROP POLICY IF EXISTS "error_logs_service_all" ON public.error_logs;
DROP POLICY IF EXISTS "analise_leads_service_all" ON public.analise_leads;
DROP POLICY IF EXISTS "access_lifecycle_sends_service_all" ON public.access_lifecycle_sends;

-- 2. Extensão vector de volta ao public
ALTER EXTENSION vector SET SCHEMA public;

-- 1. Restaurar public.is_admin() e políticas (estado pós-050 / pré-055)
CREATE OR REPLACE FUNCTION public.is_admin()
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

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Leitura pública unificada (com is_admin para authenticated via mesma policy — estado legado)
DROP POLICY IF EXISTS "ai_config_select_anon" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_select_authenticated" ON public.ai_config;
CREATE POLICY "ai_config_read" ON public.ai_config
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

ALTER POLICY "ai_config_admin_insert" ON public.ai_config WITH CHECK (public.is_admin());
ALTER POLICY "ai_config_admin_update" ON public.ai_config
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "ai_config_admin_delete" ON public.ai_config USING (public.is_admin());

DROP POLICY IF EXISTS "blog_posts_select_anon" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_authenticated" ON public.blog_posts;
CREATE POLICY "blog_posts_select" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.is_admin());

ALTER POLICY "blog_posts_admin_insert" ON public.blog_posts WITH CHECK (public.is_admin());
ALTER POLICY "blog_posts_admin_update" ON public.blog_posts
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "blog_posts_admin_delete" ON public.blog_posts USING (public.is_admin());

DROP POLICY IF EXISTS "faq_categories_select_anon" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_select_authenticated" ON public.faq_categories;
CREATE POLICY "faq_categories_select" ON public.faq_categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

ALTER POLICY "faq_categories_admin_insert" ON public.faq_categories WITH CHECK (public.is_admin());
ALTER POLICY "faq_categories_admin_update" ON public.faq_categories
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "faq_categories_admin_delete" ON public.faq_categories USING (public.is_admin());

DROP POLICY IF EXISTS "faq_items_select_anon" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_select_authenticated" ON public.faq_items;
CREATE POLICY "faq_items_select" ON public.faq_items
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

ALTER POLICY "faq_items_admin_insert" ON public.faq_items WITH CHECK (public.is_admin());
ALTER POLICY "faq_items_admin_update" ON public.faq_items
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "faq_items_admin_delete" ON public.faq_items USING (public.is_admin());

DROP POLICY IF EXISTS "glossary_terms_select_anon" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms_select_authenticated" ON public.glossary_terms;
CREATE POLICY "glossary_terms_select" ON public.glossary_terms
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.is_admin());

ALTER POLICY "glossary_terms_admin_insert" ON public.glossary_terms WITH CHECK (public.is_admin());
ALTER POLICY "glossary_terms_admin_update" ON public.glossary_terms
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "glossary_terms_admin_delete" ON public.glossary_terms USING (public.is_admin());

ALTER POLICY "analyses_select" ON public.analyses
  USING (public.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "analyses_insert" ON public.analyses
  WITH CHECK (public.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "analyses_update" ON public.analyses
  USING (public.is_admin() OR (SELECT auth.uid()) = user_id)
  WITH CHECK (public.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "analyses_delete_admin" ON public.analyses USING (public.is_admin());

ALTER POLICY "profiles_select" ON public.profiles
  USING (public.is_admin() OR (SELECT auth.uid()) = id);
ALTER POLICY "profiles_update" ON public.profiles
  USING (public.is_admin() OR (SELECT auth.uid()) = id)
  WITH CHECK (public.is_admin() OR (SELECT auth.uid()) = id);
ALTER POLICY "profiles_admin_insert" ON public.profiles WITH CHECK (public.is_admin());
ALTER POLICY "profiles_admin_delete" ON public.profiles USING (public.is_admin());

ALTER POLICY "subscriptions_select" ON public.subscriptions
  USING (public.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "subscriptions_admin_insert" ON public.subscriptions WITH CHECK (public.is_admin());
ALTER POLICY "subscriptions_admin_update" ON public.subscriptions
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "subscriptions_admin_delete" ON public.subscriptions USING (public.is_admin());

ALTER POLICY "messages_select" ON public.support_messages
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id AND t.user_id = (SELECT auth.uid())
    )
  );
ALTER POLICY "messages_insert" ON public.support_messages
  WITH CHECK (
    public.is_admin()
    OR (
      ((SELECT auth.uid()) = author_id)
      AND EXISTS (
        SELECT 1 FROM public.support_tickets t
        WHERE t.id = support_messages.ticket_id AND t.user_id = (SELECT auth.uid())
      )
    )
  );
ALTER POLICY "messages_admin_update" ON public.support_messages
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "messages_admin_delete" ON public.support_messages USING (public.is_admin());

ALTER POLICY "tickets_select" ON public.support_tickets
  USING (public.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "tickets_insert" ON public.support_tickets
  WITH CHECK (public.is_admin() OR (SELECT auth.uid()) = user_id);
ALTER POLICY "tickets_admin_update" ON public.support_tickets
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "tickets_admin_delete" ON public.support_tickets USING (public.is_admin());

DROP FUNCTION IF EXISTS private.is_admin();
REVOKE ALL ON SCHEMA private FROM authenticated, service_role;
