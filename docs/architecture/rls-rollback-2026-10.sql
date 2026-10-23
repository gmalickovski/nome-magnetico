-- ==============================================================================
-- Rollback RLS para o baseline de 23/10/2026 (DEV-213)
-- Reverte as migrations 049_rls_initplan.sql e 050_rls_consolidate_permissive.sql
-- ==============================================================================

-- 1. AI CONFIG
DROP POLICY IF EXISTS "ai_config_read" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_admin_write" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_service_all" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_admin_all" ON public.ai_config;
DROP POLICY IF EXISTS "ai_config_select_service" ON public.ai_config;

CREATE POLICY "ai_config_admin_all" ON public.ai_config FOR ALL USING (is_admin());
CREATE POLICY "ai_config_select_service" ON public.ai_config FOR SELECT USING (is_active = true);

-- 2. AI USAGE
DROP POLICY IF EXISTS "ai_usage_service_all" ON public.ai_usage;
CREATE POLICY "ai_usage_service_all" ON public.ai_usage FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- 3. ANALYSES
DROP POLICY IF EXISTS "analyses_select" ON public.analyses;
DROP POLICY IF EXISTS "analyses_insert" ON public.analyses;
DROP POLICY IF EXISTS "analyses_update" ON public.analyses;
DROP POLICY IF EXISTS "analyses_delete_admin" ON public.analyses;
DROP POLICY IF EXISTS "analyses_service_all" ON public.analyses;
DROP POLICY IF EXISTS "analyses_admin_all" ON public.analyses;
DROP POLICY IF EXISTS "analyses_select_own" ON public.analyses;
DROP POLICY IF EXISTS "analyses_insert_own" ON public.analyses;
DROP POLICY IF EXISTS "analyses_update_own" ON public.analyses;

CREATE POLICY "analyses_admin_all" ON public.analyses FOR ALL USING (is_admin());
CREATE POLICY "analyses_select_own" ON public.analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "analyses_insert_own" ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "analyses_update_own" ON public.analyses FOR UPDATE USING (auth.uid() = user_id);

-- 4. ANALYSIS FEEDBACK
DROP POLICY IF EXISTS "insert_own_feedback" ON public.analysis_feedback;
DROP POLICY IF EXISTS "admin_read_feedback" ON public.analysis_feedback;

CREATE POLICY "insert_own_feedback" ON public.analysis_feedback FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "admin_read_feedback" ON public.analysis_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5. PRODUCT INPUTS
DROP POLICY IF EXISTS "baby_inputs_own" ON public.baby_name_inputs;
CREATE POLICY "baby_inputs_own" ON public.baby_name_inputs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "company_inputs_own" ON public.company_name_inputs;
CREATE POLICY "company_inputs_own" ON public.company_name_inputs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "social_inputs_own" ON public.social_name_inputs;
CREATE POLICY "social_inputs_own" ON public.social_name_inputs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "magnetic_names_select_own" ON public.magnetic_names;
CREATE POLICY "magnetic_names_select_own" ON public.magnetic_names FOR SELECT USING (auth.uid() = user_id);

-- 6. BLOG POSTS
DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_service_all" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_all" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts public read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_public_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_service_all" ON public.blog_posts;

CREATE POLICY "blog_posts public read" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "blog_public_read" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "blog_service_all" ON public.blog_posts FOR ALL USING (auth.role() = 'service_role');

-- 7. CLIENT MESSAGES
DROP POLICY IF EXISTS "client_messages_service_all" ON public.client_messages;
CREATE POLICY "client_messages_service_all" ON public.client_messages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "client_message_deliveries_service_all" ON public.client_message_deliveries;
CREATE POLICY "client_message_deliveries_service_all" ON public.client_message_deliveries FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "client_message_templates_service_all" ON public.client_message_templates;
CREATE POLICY "client_message_templates_service_all" ON public.client_message_templates FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 8. FAQ CATEGORIES & ITEMS
DROP POLICY IF EXISTS "faq_categories_select" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_admin_write" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_service_all" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_admin_all" ON public.faq_categories;
DROP POLICY IF EXISTS "faq_categories_public_select" ON public.faq_categories;

CREATE POLICY "faq_categories_admin_all" ON public.faq_categories FOR ALL USING (is_admin());
CREATE POLICY "faq_categories_public_select" ON public.faq_categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "faq_items_select" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_admin_write" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_service_all" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_admin_all" ON public.faq_items;
DROP POLICY IF EXISTS "faq_items_public_select" ON public.faq_items;

CREATE POLICY "faq_items_admin_all" ON public.faq_items FOR ALL USING (is_admin());
CREATE POLICY "faq_items_public_select" ON public.faq_items FOR SELECT USING (is_active = true);

-- 9. GLOSSARY TERMS
DROP POLICY IF EXISTS "glossary_terms_public_read" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms_service_all" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms_admin_all" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_public_read" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_service_all" ON public.glossary_terms;
DROP POLICY IF EXISTS "glossary_terms public read" ON public.glossary_terms;

CREATE POLICY "glossary_terms public read" ON public.glossary_terms FOR SELECT USING (is_published = true);
CREATE POLICY "glossary_public_read" ON public.glossary_terms FOR SELECT USING (is_published = true);
CREATE POLICY "glossary_service_all" ON public.glossary_terms FOR ALL USING (auth.role() = 'service_role');

-- 10. PROFILES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_write" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (is_admin());
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 11. SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_write" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_service_all" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;

CREATE POLICY "subscriptions_admin_all" ON public.subscriptions FOR ALL USING (is_admin());
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- 12. SUPPORT TICKETS & MESSAGES
DROP POLICY IF EXISTS "tickets_select" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_insert" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_admin_write" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_service_all" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_admin_all" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_select_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_insert_own" ON public.support_tickets;

CREATE POLICY "tickets_admin_all" ON public.support_tickets FOR ALL USING (is_admin());
CREATE POLICY "tickets_select_own" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tickets_insert_own" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_select" ON public.support_messages;
DROP POLICY IF EXISTS "messages_insert" ON public.support_messages;
DROP POLICY IF EXISTS "messages_admin_write" ON public.support_messages;
DROP POLICY IF EXISTS "messages_service_all" ON public.support_messages;
DROP POLICY IF EXISTS "messages_admin_all" ON public.support_messages;
DROP POLICY IF EXISTS "messages_select_ticket_owner" ON public.support_messages;
DROP POLICY IF EXISTS "messages_insert_ticket_owner" ON public.support_messages;

CREATE POLICY "messages_admin_all" ON public.support_messages FOR ALL USING (is_admin());
CREATE POLICY "messages_select_ticket_owner" ON public.support_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid())
);
CREATE POLICY "messages_insert_ticket_owner" ON public.support_messages FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid())
);

-- 13. TRIAL REDEMPTIONS
DROP POLICY IF EXISTS "service_role_only" ON public.trial_redemptions;
CREATE POLICY "service_role_only" ON public.trial_redemptions FOR ALL USING (auth.role() = 'service_role');
