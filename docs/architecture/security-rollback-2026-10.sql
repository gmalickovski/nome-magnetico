-- Rollback de Segurança - Reversão das alterações da DEV-216
-- Data: 2026-10-23
-- Projeto: Nome Magnético (Supabase bhxneaeuhybtucmbmpvg)

-- 1. Reverter security_invoker na view crm_funil_leads
ALTER VIEW public.crm_funil_leads SET (security_invoker = false);
GRANT SELECT ON public.crm_funil_leads TO anon, authenticated;

-- 2. Restaurar privilégios originais de EXECUTE para anon, authenticated e PUBLIC
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit_ip(text, integer, integer) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_product_vote(text) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile(uuid, text, text) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_faq_embeddings(vector, integer, jsonb) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO PUBLIC, anon;

-- 3. Resetar search_path nas 9 funções
ALTER FUNCTION public.check_rate_limit_ip(text, integer, integer) RESET search_path;
ALTER FUNCTION public.ensure_profile(uuid, text, text) RESET search_path;
ALTER FUNCTION public.faq_embeddings_set_faq_item_id() RESET search_path;
ALTER FUNCTION public.handle_new_user() RESET search_path;
ALTER FUNCTION public.match_documents(vector, integer, jsonb) RESET search_path;
ALTER FUNCTION public.match_faq_embeddings(vector, integer, jsonb) RESET search_path;
ALTER FUNCTION public.set_ticket_number() RESET search_path;
ALTER FUNCTION suporte.set_updated_at() RESET search_path;
ALTER FUNCTION public.subscription_is_active(subscriptions) RESET search_path;
