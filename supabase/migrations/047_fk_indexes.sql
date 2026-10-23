-- Migration 047: criação de índices para 21 Foreign Keys não indexadas (DEV-214)
-- Aditiva e idempotente. NÃO aplicar da máquina do agente: o Dev aplica depois do ok.
-- Resolve os alertas do index advisor de unindexed foreign keys no Supabase.

-- 1. Tabelas de produtos e inputs de análises (alta prioridade para RLS e consultas por usuário/análise)
CREATE INDEX IF NOT EXISTS idx_baby_name_inputs_analysis_id ON public.baby_name_inputs (analysis_id);
CREATE INDEX IF NOT EXISTS idx_baby_name_inputs_user_id ON public.baby_name_inputs (user_id);

CREATE INDEX IF NOT EXISTS idx_company_name_inputs_analysis_id ON public.company_name_inputs (analysis_id);
CREATE INDEX IF NOT EXISTS idx_company_name_inputs_user_id ON public.company_name_inputs (user_id);

CREATE INDEX IF NOT EXISTS idx_social_name_inputs_user_id ON public.social_name_inputs (user_id);

CREATE INDEX IF NOT EXISTS idx_magnetic_names_analysis_id ON public.magnetic_names (analysis_id);
CREATE INDEX IF NOT EXISTS idx_magnetic_names_user_id ON public.magnetic_names (user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_feedback_analysis_id ON public.analysis_feedback (analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_feedback_user_id ON public.analysis_feedback (user_id);

-- 2. Suporte e tickets
CREATE INDEX IF NOT EXISTS idx_support_messages_author_id ON public.support_messages (author_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages (ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets (user_id);

-- 3. Assinaturas e campanhas
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewed_from ON public.subscriptions (renewed_from);
CREATE INDEX IF NOT EXISTS idx_client_messages_template_id ON public.client_messages (template_id);

-- 4. Conteúdo e FAQs
CREATE INDEX IF NOT EXISTS idx_faq_items_category_id ON public.faq_items (category_id);

-- 5. Códigos de acesso e promoções
CREATE INDEX IF NOT EXISTS idx_access_code_uses_user_id ON public.access_code_uses (user_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_created_by ON public.access_codes (created_by);
CREATE INDEX IF NOT EXISTS idx_promotions_created_by ON public.promotions (created_by);

-- 6. Auditoria e tabelas de configuração/preços
CREATE INDEX IF NOT EXISTS idx_ai_config_updated_by ON public.ai_config (updated_by);
CREATE INDEX IF NOT EXISTS idx_product_prices_updated_by ON public.product_prices (updated_by);
CREATE INDEX IF NOT EXISTS idx_product_price_history_changed_by ON public.product_price_history (changed_by);
