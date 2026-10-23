-- Migration 049: RLS InitPlan — auth.uid() e auth.role() com (select ...) em 23 políticas (DEV-213)
-- Não destrutiva. NÃO aplicar da máquina do agente: o Dev aplica depois do ok.
-- Troca a avaliação linha a linha por InitPlan (uma única avaliação por consulta).

-- 0. Otimização da função is_admin() para uso de InitPlan
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

-- 1. analyses (3 políticas)
ALTER POLICY "analyses_select_own" ON public.analyses
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "analyses_insert_own" ON public.analyses
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "analyses_update_own" ON public.analyses
  USING ((SELECT auth.uid()) = user_id);

-- 2. profiles (2 políticas)
ALTER POLICY "profiles_select_own" ON public.profiles
  USING ((SELECT auth.uid()) = id);

ALTER POLICY "profiles_update_own" ON public.profiles
  USING ((SELECT auth.uid()) = id);

-- 3. subscriptions (1 política)
ALTER POLICY "subscriptions_select_own" ON public.subscriptions
  USING ((SELECT auth.uid()) = user_id);

-- 4. magnetic_names (1 política)
ALTER POLICY "magnetic_names_select_own" ON public.magnetic_names
  USING ((SELECT auth.uid()) = user_id);

-- 5. support_tickets (2 políticas)
ALTER POLICY "tickets_select_own" ON public.support_tickets
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "tickets_insert_own" ON public.support_tickets
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 6. support_messages (2 políticas)
ALTER POLICY "messages_select_ticket_owner" ON public.support_messages
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id AND t.user_id = (SELECT auth.uid())
  ));

ALTER POLICY "messages_insert_ticket_owner" ON public.support_messages
  WITH CHECK (
    ((SELECT auth.uid()) = author_id)
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id AND t.user_id = (SELECT auth.uid())
    )
  );

-- 7. baby_name_inputs (1 política)
ALTER POLICY "baby_inputs_own" ON public.baby_name_inputs
  USING ((SELECT auth.uid()) = user_id);

-- 8. company_name_inputs (1 política)
ALTER POLICY "company_inputs_own" ON public.company_name_inputs
  USING ((SELECT auth.uid()) = user_id);

-- 9. social_name_inputs (1 política)
ALTER POLICY "social_inputs_own" ON public.social_name_inputs
  USING ((SELECT auth.uid()) = user_id);

-- 10. analysis_feedback (2 políticas)
ALTER POLICY "insert_own_feedback" ON public.analysis_feedback
  WITH CHECK (((SELECT auth.uid()) = user_id) OR user_id IS NULL);

ALTER POLICY "admin_read_feedback" ON public.analysis_feedback
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'::text
  ));

-- 11. client_messages (1 política)
ALTER POLICY "client_messages_service_all" ON public.client_messages
  USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);

-- 12. client_message_deliveries (1 política)
ALTER POLICY "client_message_deliveries_service_all" ON public.client_message_deliveries
  USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);

-- 13. client_message_templates (1 política)
ALTER POLICY "client_message_templates_service_all" ON public.client_message_templates
  USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);

-- 14. ai_usage (1 política)
ALTER POLICY "ai_usage_service_all" ON public.ai_usage
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::text
  ));

-- 15. trial_redemptions (1 política)
ALTER POLICY "service_role_only" ON public.trial_redemptions
  USING ((SELECT auth.role()) = 'service_role'::text);

-- 16. blog_posts (1 política)
ALTER POLICY "blog_service_all" ON public.blog_posts
  USING ((SELECT auth.role()) = 'service_role'::text);

-- 17. glossary_terms (1 política)
ALTER POLICY "glossary_service_all" ON public.glossary_terms
  USING ((SELECT auth.role()) = 'service_role'::text);
