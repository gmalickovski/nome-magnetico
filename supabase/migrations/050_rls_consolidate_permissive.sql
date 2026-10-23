-- Migration 050: RLS — consolidação de políticas permissivas sobrepostas e especificação de TO <role> (DEV-213)
-- Aditiva e idempotente. NÃO aplicar da máquina do agente: o Dev aplica depois do ok.
-- Elimina os 112 avisos de multiple_permissive_policies unificando regras de admin e own por ação (SELECT, INSERT, UPDATE, DELETE).

-- ==============================================================================
-- 1. AI_CONFIG
-- ==============================================================================
DROP POLICY IF EXISTS "ai_config_admin_all" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_select_service" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_read" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_admin_insert" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_admin_update" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_admin_delete" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_service_all" ON public.ai_config;

CREATE POLICY "ai_config_read" ON public.ai_config
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY "ai_config_admin_insert" ON public.ai_config
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "ai_config_admin_update" ON public.ai_config
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ai_config_admin_delete" ON public.ai_config
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "ai_config_service_all" ON public.ai_config
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 2. ANALYSES
-- ==============================================================================
DROP POLICY IF EXISTS "analyses_admin_all" ON public.analyses;
DROP POLICY IF EXISTS "analyses_select_own" ON public.analyses;
DROP POLICY IF EXISTS "analyses_insert_own" ON public.analyses;
DROP POLICY IF EXISTS "analyses_update_own" ON public.analyses;
DROP POLICY IF EXISTS "analyses_select" ON public.analyses;
DROP POLICY IF EXISTS "analyses_insert" ON public.analyses;
DROP POLICY IF EXISTS "analyses_update" ON public.analyses;
DROP POLICY IF EXISTS "analyses_delete_admin" ON public.analyses;
DROP POLICY IF EXISTS "analyses_service_all" ON public.analyses;

CREATE POLICY "analyses_select" ON public.analyses
  FOR SELECT TO authenticated
  USING (public.is_admin() OR (SELECT auth.uid()) = user_id);

CREATE POLICY "analyses_insert" ON public.analyses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (SELECT auth.uid()) = user_id);

CREATE POLICY "analyses_update" ON public.analyses
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR (SELECT auth.uid()) = user_id)
  WITH CHECK (public.is_admin() OR (SELECT auth.uid()) = user_id);

CREATE POLICY "analyses_delete_admin" ON public.analyses
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "analyses_service_all" ON public.analyses
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 3. BLOG_POSTS (Remove duplicata blog_posts public read)
-- ==============================================================================
DROP POLICY IF EXISTS "blog_posts public read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_public_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_service_all" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_update" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_delete" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_service_all" ON public.blog_posts;

CREATE POLICY "blog_posts_select" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.is_admin());

CREATE POLICY "blog_posts_admin_insert" ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "blog_posts_admin_update" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "blog_posts_admin_delete" ON public.blog_posts
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "blog_posts_service_all" ON public.blog_posts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 4. FAQ_CATEGORIES
-- ==============================================================================
DROP POLICY IF EXISTS "faq_categories_admin_all" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_public_select" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_select" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_admin_insert" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_admin_update" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_admin_delete" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_service_all" ON public.faq_categories;

CREATE POLICY "faq_categories_select" ON public.faq_categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY "faq_categories_admin_insert" ON public.faq_categories
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "faq_categories_admin_update" ON public.faq_categories
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "faq_categories_admin_delete" ON public.faq_categories
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "faq_categories_service_all" ON public.faq_categories
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 5. FAQ_ITEMS
-- ==============================================================================
DROP POLICY IF EXISTS "faq_items_admin_all" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_public_select" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_select" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_admin_insert" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_admin_update" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_admin_delete" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_service_all" ON public.faq_items;

CREATE POLICY "faq_items_select" ON public.faq_items
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY "faq_items_admin_insert" ON public.faq_items
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "faq_items_admin_update" ON public.faq_items
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "faq_items_admin_delete" ON public.faq_items
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "faq_items_service_all" ON public.faq_items
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 6. GLOSSARY_TERMS (Remove duplicata glossary_terms public read)
-- ==============================================================================
DROP POLICY IF EXISTS "glossary_terms public read" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_public_read" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_service_all" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms_select" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms_admin_insert" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms_admin_update" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms_admin_delete" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms_service_all" ON public.glossary_terms;

CREATE POLICY "glossary_terms_select" ON public.glossary_terms
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.is_admin());

CREATE POLICY "glossary_terms_admin_insert" ON public.glossary_terms
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "glossary_terms_admin_update" ON public.glossary_terms
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "glossary_terms_admin_delete" ON public.glossary_terms
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "glossary_terms_service_all" ON public.glossary_terms
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 7. PROFILES
-- ==============================================================================
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin() OR (SELECT auth.uid()) = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR (SELECT auth.uid()) = id)
  WITH CHECK (public.is_admin() OR (SELECT auth.uid()) = id);

CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "profiles_service_all" ON public.profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 8. SUBSCRIPTIONS
-- ==============================================================================
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_service_insert" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_insert" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_update" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_delete" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_service_all" ON public.subscriptions;

CREATE POLICY "subscriptions_select" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.is_admin() OR (SELECT auth.uid()) = user_id);

CREATE POLICY "subscriptions_admin_insert" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "subscriptions_admin_update" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "subscriptions_admin_delete" ON public.subscriptions
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "subscriptions_service_all" ON public.subscriptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 9. SUPPORT_MESSAGES
-- ==============================================================================
DROP POLICY IF EXISTS "messages_admin_all" ON public.support_messages;
DROP POLICY IF EXISTS "messages_select_ticket_owner" ON public.support_messages;
DROP POLICY IF EXISTS "messages_insert_ticket_owner" ON public.support_messages;
DROP POLICY IF EXISTS "messages_select" ON public.support_messages;
DROP POLICY IF EXISTS "messages_insert" ON public.support_messages;
DROP POLICY IF EXISTS "messages_admin_update" ON public.support_messages;
DROP POLICY IF EXISTS "messages_admin_delete" ON public.support_messages;
DROP POLICY IF EXISTS "messages_service_all" ON public.support_messages;

CREATE POLICY "messages_select" ON public.support_messages
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id AND t.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "messages_insert" ON public.support_messages
  FOR INSERT TO authenticated
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

CREATE POLICY "messages_admin_update" ON public.support_messages
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "messages_admin_delete" ON public.support_messages
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "messages_service_all" ON public.support_messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 10. SUPPORT_TICKETS
-- ==============================================================================
DROP POLICY IF EXISTS "tickets_admin_all" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_select_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_insert_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_select" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_insert" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_admin_update" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_admin_delete" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_service_all" ON public.support_tickets;

CREATE POLICY "tickets_select" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (public.is_admin() OR (SELECT auth.uid()) = user_id);

CREATE POLICY "tickets_insert" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (SELECT auth.uid()) = user_id);

CREATE POLICY "tickets_admin_update" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "tickets_admin_delete" ON public.support_tickets
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "tickets_service_all" ON public.support_tickets
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 11. TABELAS DE SUPORTE/SISTEMA COM TO service_role EXPLÍCITO
-- ==============================================================================
DROP POLICY IF EXISTS "client_messages_service_all" ON public.client_messages;
CREATE POLICY "client_messages_service_all" ON public.client_messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "client_message_deliveries_service_all" ON public.client_message_deliveries;
CREATE POLICY "client_message_deliveries_service_all" ON public.client_message_deliveries
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "client_message_templates_service_all" ON public.client_message_templates;
CREATE POLICY "client_message_templates_service_all" ON public.client_message_templates
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "trial_redemptions_service_all" ON public.trial_redemptions;
DROP POLICY IF EXISTS "service_role_only" ON public.trial_redemptions;
CREATE POLICY "trial_redemptions_service_all" ON public.trial_redemptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
