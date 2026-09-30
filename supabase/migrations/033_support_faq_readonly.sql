-- Migration 033: acesso read-only da FAQ para o bot Suporte (DEV-96)
--
-- Nao recria faq_categories, faq_items nem faq_embeddings.
-- Nao cria senha, JWT nem altera grants existentes de service_role.
-- Aplicar em producao somente apos ok do Guilherme.
--
-- Modelo:
--   schema support_faq        — fora do Data API (nao esta em Exposed schemas)
--   support_faq.support_faq_v — categorias + itens com is_active; sem embeddings
--   role support_bot          — NOLOGIN, NOINHERIT, SELECT apenas nessa view
--
-- security_invoker = false de proposito: a role nao recebe GRANT nas tabelas
-- base. A view roda como o dono (postgres), que ja e owner de faq_* e portanto
-- atravessa a RLS. O filtro is_active na propria view e o que publica o conteudo.
--
-- PUBLIC tem USAGE em public e EXECUTE nas funcoes SECURITY DEFINER do app.
-- Sem o REVOKE abaixo, support_bot chamaria ensure_profile / match_faq_embeddings
-- mesmo sem GRANT nas tabelas. O EXECUTE explicito de anon, authenticated e
-- service_role permanece.

-- ================================================================
-- Role
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'support_bot') THEN
    CREATE ROLE support_bot NOLOGIN NOINHERIT;
  END IF;
END
$$;

ALTER ROLE support_bot NOINHERIT;
ALTER ROLE support_bot SET search_path = support_faq;

COMMENT ON ROLE support_bot IS
  'Bot Suporte (DEV-96): SELECT apenas em support_faq.support_faq_v. Sem LOGIN nesta migration. Nao herda outros papeis. Nao conceder GRANT em nenhuma outra tabela.';

-- PostgREST so assume a role se o JWT trouxer role=support_bot.
-- authenticator e NOINHERIT: o GRANT nao vaza o SELECT para anon/authenticated.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    GRANT support_bot TO authenticator;
  END IF;
END
$$;

-- ================================================================
-- Schema e view
-- ================================================================

CREATE SCHEMA IF NOT EXISTS support_faq;

REVOKE ALL ON SCHEMA support_faq FROM PUBLIC;
GRANT USAGE ON SCHEMA support_faq TO support_bot;

COMMENT ON SCHEMA support_faq IS
  'Superficie read-only do bot Suporte. Nao adicionar aos Exposed schemas do Data API sem ok do Guilherme.';

CREATE OR REPLACE VIEW support_faq.support_faq_v
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  c.id          AS category_id,
  c.title       AS category_title,
  c.slug        AS category_slug,
  c.order_index AS category_order,
  i.id          AS item_id,
  i.slug        AS item_slug,
  i.question,
  i.answer_markdown,
  i.order_index AS item_order,
  i.is_featured,
  i.updated_at
FROM public.faq_items i
INNER JOIN public.faq_categories c ON c.id = i.category_id
WHERE i.is_active IS TRUE
  AND c.is_active IS TRUE;

COMMENT ON VIEW support_faq.support_faq_v IS
  'FAQ ativa para o bot Suporte. Sem faq_embeddings, sem ids do Chatwoot, sem meta SEO.';

REVOKE ALL ON support_faq.support_faq_v FROM PUBLIC;
GRANT SELECT ON support_faq.support_faq_v TO support_bot;

-- Cura drift: a role nova nao herda GRANT de tabela, mas uma reexecucao
-- remove qualquer GRANT explicito que tenham dado em public.
-- So objetos do proprio postgres: funcoes do pgvector sao do supabase_admin
-- e um REVOKE ALL ON ALL ROUTINES falharia na migration.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM support_bot;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM support_bot;
REVOKE ALL ON SCHEMA public FROM support_bot;

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name,
           p.proname AS fn_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proowner = (SELECT oid FROM pg_roles WHERE rolname = current_user)
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM support_bot',
      fn.schema_name,
      fn.fn_name,
      fn.args
    );
  END LOOP;
END
$$;

-- O REVOKE em public tambem nao atinge a view (outro schema). Reafirma o SELECT.
GRANT USAGE ON SCHEMA support_faq TO support_bot;
GRANT SELECT ON support_faq.support_faq_v TO support_bot;

-- ================================================================
-- Fecha funcoes SECURITY DEFINER que PUBLIC ainda executa
-- Grants explicitos de anon / authenticated / service_role ficam.
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
  END IF;
END
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_profile(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit_ip(text, integer, integer) FROM PUBLIC;

DO $$
DECLARE
  fn_args text;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid)
    INTO fn_args
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'match_faq_embeddings'
  LIMIT 1;

  IF fn_args IS NOT NULL THEN
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION public.match_faq_embeddings(%s) FROM PUBLIC',
      fn_args
    );
  END IF;
END
$$;

-- O EXECUTE de PUBLIC e um default global, nao o default do schema.
-- Revogar so IN SCHEMA public nao tira esse default: a funcao nova ainda nasce com =X.
-- Este REVOKE e global para funcoes criadas por postgres. Os grants de
-- anon / authenticated / service_role no schema public continuam no default ja existente.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
