-- Migration 039: remove a sincronização legada de suporte, FAQ e mídia.
-- Idempotente. A 038 está reservada para o PR #40. Não aplicar da máquina do agente.
--
-- Não remove supabase_functions.http_request, a tabela public.faq_embeddings
-- nem a trigger faq_embeddings_before_insert.
-- Não apaga linhas de ticket, mensagem ou FAQ. Só tira colunas de integração
-- cujo nome começa com chatwoot.

-- ================================================================
-- Triggers
-- ================================================================

DO $$
BEGIN
  IF to_regclass('public.support_messages') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "suporte-mensagens-to-chatwoot" ON public.support_messages';
  END IF;

  IF to_regclass('public.faq_items') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS sync_faq_to_n8n ON public.faq_items';
    EXECUTE 'DROP TRIGGER IF EXISTS "sync-faq-rag" ON public.faq_items';
  END IF;

  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_storage_notify_n8n ON storage.objects';
  END IF;

  IF to_regclass('public.blog_posts') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_notify_n8n_image ON public.blog_posts';
  END IF;
END
$$;

-- ================================================================
-- Funções usadas só por essas triggers
-- ================================================================

DO $$
DECLARE
  fn record;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'supabase_functions') THEN
    FOR fn IN
      SELECT p.proname AS name,
             pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'supabase_functions'
        AND p.proname IN ('notify_n8n_convert_webp', 'notify_n8n_image_generation')
    LOOP
      EXECUTE format(
        'DROP FUNCTION IF EXISTS supabase_functions.%I(%s)',
        fn.name,
        fn.args
      );
    END LOOP;
  END IF;
END
$$;

-- ================================================================
-- Índices e colunas chatwoot*
-- ================================================================

DROP INDEX IF EXISTS public.idx_support_tickets_chatwoot;
DROP INDEX IF EXISTS public.faq_items_chatwoot_id_idx;

DO $$
DECLARE
  idx record;
BEGIN
  FOR idx IN
    SELECT schemaname, indexname
    FROM pg_indexes
    WHERE indexname ILIKE '%chatwoot%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', idx.schemaname, idx.indexname);
  END LOOP;
END
$$;

ALTER TABLE public.support_tickets
  DROP COLUMN IF EXISTS chatwoot_conversation_id;

ALTER TABLE public.faq_items
  DROP COLUMN IF EXISTS chatwoot_article_id,
  DROP COLUMN IF EXISTS chatwoot_category_id;

DO $$
DECLARE
  col record;
BEGIN
  FOR col IN
    SELECT n.nspname AS schema_name,
           c.relname AS table_name,
           a.attname AS column_name
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE a.attnum > 0
      AND NOT a.attisdropped
      AND c.relkind IN ('r', 'p')
      AND a.attname ILIKE 'chatwoot%'
      AND n.nspname IN ('public', 'storage')
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP COLUMN IF EXISTS %I',
      col.schema_name,
      col.table_name,
      col.column_name
    );
  END LOOP;
END
$$;

-- ================================================================
-- Formulário de contato
-- source pode já existir no banco e não estar nas migrations anteriores.
-- ticket_number continua com a trigger tr_set_ticket_number; não recriar aqui.
-- ================================================================

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS source TEXT;

CREATE TABLE IF NOT EXISTS public.support_contact_rate_limits (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.support_contact_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_contact_rate_limits_service_all" ON public.support_contact_rate_limits;
CREATE POLICY "support_contact_rate_limits_service_all" ON public.support_contact_rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_support_contact_rate_limits_ip_created
  ON public.support_contact_rate_limits (ip_hash, created_at DESC);
