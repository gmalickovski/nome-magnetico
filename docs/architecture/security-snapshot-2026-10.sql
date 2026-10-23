-- Snapshot de Segurança - Baseline antes da aplicação da DEV-216
-- Data: 2026-10-23
-- Projeto: Nome Magnético (Supabase bhxneaeuhybtucmbmpvg)

-- 1. View crm_funil_leads (security_invoker = false por padrão)
CREATE OR REPLACE VIEW public.crm_funil_leads AS
 WITH base AS (
         SELECT lower(analise_leads.email) AS email,
            analise_leads.nome_completo AS nome,
            analise_leads.data_nascimento,
            'analise_gratuita'::text AS origem,
            analise_leads.created_at AS first_seen_at,
            NULL::uuid AS user_id,
            'lead_frio'::text AS funnel_stage
           FROM analise_leads
          WHERE analise_leads.converted_user_id IS NULL
        UNION ALL
         SELECT lower(f.email) AS email,
            f.nome_completo AS nome,
            f.data_nascimento::text AS data_nascimento,
            'pdf_gratuito'::text AS origem,
            f.created_at AS first_seen_at,
            NULL::uuid AS user_id,
            'lead_frio'::text AS funnel_stage
           FROM free_analyses_leads f
          WHERE NOT (EXISTS ( SELECT 1
                   FROM profiles p
                  WHERE p.email = f.email))
        UNION ALL
         SELECT lower(p.email) AS email,
            p.nome,
            p.birth_date::text AS data_nascimento,
            COALESCE(p.app_source, 'nome_magnetico'::text) AS origem,
            p.created_at AS first_seen_at,
            p.id AS user_id,
                CASE
                    WHEN (EXISTS ( SELECT 1
                       FROM subscriptions s
                      WHERE s.user_id = p.id)) THEN 'cliente'::text
                    ELSE 'cadastrado_sem_compra'::text
                END AS funnel_stage
           FROM profiles p
          WHERE p.is_test IS NOT TRUE
        )
 SELECT DISTINCT ON (email) email,
    nome,
    data_nascimento,
    origem,
    first_seen_at,
    user_id,
    funnel_stage
   FROM base
  ORDER BY email, (
        CASE funnel_stage
            WHEN 'cliente'::text THEN 0
            WHEN 'cadastrado_sem_compra'::text THEN 1
            ELSE 2
        END), first_seen_at;

-- 2. Privilégios originais das rotinas (PUBLIC / anon / authenticated possuíam EXECUTE)
-- anon e authenticated tinham EXECUTE em todas as funções:
-- check_rate_limit_ip(text, integer, integer)
-- ensure_profile(uuid, text, text)
-- faq_embeddings_set_faq_item_id()
-- handle_new_user()
-- increment_product_vote(text)
-- is_admin()
-- match_documents(vector, integer, jsonb)
-- match_faq_embeddings(vector, integer, jsonb)
-- set_ticket_number()
-- subscription_is_active(subscriptions)

-- 3. Definições de Funções (antes de search_path explícito)
CREATE OR REPLACE FUNCTION public.check_rate_limit_ip(p_ip text, p_limit integer DEFAULT 3, p_window_hours integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_profile(p_user_id uuid, p_email text, p_nome text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role, app_source, last_login_at)
  VALUES (
    p_user_id,
    p_email,
    COALESCE(p_nome, split_part(p_email, '@', 1)),
    'user',
    'nome_magnetico',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET last_login_at = NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.faq_embeddings_set_faq_item_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.faq_item_id IS NULL AND NEW.metadata IS NOT NULL THEN
    NEW.faq_item_id := (NEW.metadata->>'faq_item_id')::uuid;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nome, app_source)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'nome_magnetico'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_count integer DEFAULT NULL::integer, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
#variable_conflict use_column
BEGIN
  RETURN query
  SELECT
    id,
    content,
    metadata,
    1 - (faq_embeddings.embedding <=> query_embedding) AS similarity
  FROM faq_embeddings
  WHERE metadata @> filter
  ORDER BY faq_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_faq_embeddings(query_embedding vector, match_count integer DEFAULT 5, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.faq_embeddings e
  INNER JOIN public.faq_items i ON i.id = e.faq_item_id AND i.is_active = true
  WHERE e.metadata @> filter
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_ticket_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TKT-' || LPAD(nextval('support_ticket_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION suporte.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.subscription_is_active(sub subscriptions)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN sub.ends_at > NOW();
END;
$function$;
