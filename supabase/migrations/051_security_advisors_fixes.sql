-- Migration 051: Correções dos Security Advisors do Supabase (DEV-216)
-- 1. View crm_funil_leads: habilitar security_invoker e restringir acesso a service_role
-- 2. Revogar privilégios EXECUTE desnecessários em funções SECURITY DEFINER de anon/authenticated
-- 3. Fixar search_path nas 9 funções para mitigar risco de search_path mutável

-- 1. View crm_funil_leads
ALTER VIEW public.crm_funil_leads SET (security_invoker = true);
REVOKE ALL ON public.crm_funil_leads FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.crm_funil_leads TO service_role;

-- 2. Revoke execute em funções SECURITY DEFINER
-- handle_new_user é chamada pelo trigger interno no schema auth
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- check_rate_limit_ip: uso exclusivo backend
REVOKE ALL ON FUNCTION public.check_rate_limit_ip(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit_ip(text, integer, integer) TO service_role;

-- increment_product_vote: rota /api/product-vote usa service_role
REVOKE ALL ON FUNCTION public.increment_product_vote(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_product_vote(text) TO service_role;

-- ensure_profile: rotas de auth no backend usam service_role
REVOKE ALL ON FUNCTION public.ensure_profile(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile(uuid, text, text) TO service_role;

-- match_faq_embeddings: busca semântica chamada no backend via service_role
REVOKE ALL ON FUNCTION public.match_faq_embeddings(vector, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_faq_embeddings(vector, integer, jsonb) TO service_role;

-- is_admin: executada em RLS para authenticated e service_role, revogada de anon e PUBLIC
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 3. search_path seguro nas 9 funções
ALTER FUNCTION public.check_rate_limit_ip(text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.ensure_profile(uuid, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.faq_embeddings_set_faq_item_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.match_documents(vector, integer, jsonb) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.match_faq_embeddings(vector, integer, jsonb) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.set_ticket_number() SET search_path = public, pg_temp;
ALTER FUNCTION suporte.set_updated_at() SET search_path = suporte, pg_temp;
ALTER FUNCTION public.subscription_is_active(subscriptions) SET search_path = public, pg_temp;
