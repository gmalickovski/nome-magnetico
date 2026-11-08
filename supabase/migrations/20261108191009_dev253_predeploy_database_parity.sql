-- DEV-253: validar em TESTE antes de aplicar em producao.
-- Corrige drift sem copiar dados, remover tabelas ou alterar regras de negocio.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- 057 deve existir antes desta migration. Backend: CRUD; cliente: leitura propria.
ALTER TABLE public.chat_checkout_choices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.chat_checkout_choices FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.chat_checkout_choices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_checkout_choices TO service_role;

-- Producao ja usa invoker; TESTE deve respeitar as mesmas policies das tabelas base.
ALTER VIEW public.user_status SET (security_invoker = true);

-- Expandir checks no TESTE para os valores ja aceitos em producao.
ALTER TABLE public.client_messages DROP CONSTRAINT IF EXISTS client_messages_status_check;
ALTER TABLE public.client_messages ADD CONSTRAINT client_messages_status_check
  CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'archived'));
ALTER TABLE public.client_messages DROP CONSTRAINT IF EXISTS client_messages_target_type_check;
ALTER TABLE public.client_messages ADD CONSTRAINT client_messages_target_type_check
  CHECK (target_type IN ('all', 'free', 'products', 'active_any', 'manual'));

DO $parity$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.baby_name_inputs'::regclass AND conname='baby_name_inputs_genero_preferido_check') THEN
    ALTER TABLE public.baby_name_inputs ADD CONSTRAINT baby_name_inputs_genero_preferido_check
      CHECK (genero_preferido IN ('masculino','feminino','neutro','surpresa')) NOT VALID;
    ALTER TABLE public.baby_name_inputs VALIDATE CONSTRAINT baby_name_inputs_genero_preferido_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.client_messages'::regclass AND conname='client_messages_template_id_fkey') THEN
    ALTER TABLE public.client_messages ADD CONSTRAINT client_messages_template_id_fkey
      FOREIGN KEY (template_id) REFERENCES public.client_message_templates(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.client_messages VALIDATE CONSTRAINT client_messages_template_id_fkey;
  END IF;
END
$parity$;

-- Mesmos indices existentes em producao; FKs preservam os indices ja presentes.
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_cover_published
  ON public.blog_posts(is_published, is_featured, published_at DESC) WHERE cover_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON public.blog_posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS client_messages_scheduled_idx ON public.client_messages(scheduled_at) WHERE status = 'scheduled';
CREATE UNIQUE INDEX IF NOT EXISTS support_tickets_gmail_message_id_idx
  ON public.support_tickets(gmail_message_id) WHERE gmail_message_id IS NOT NULL;

-- O endpoint /api/support/contact depende da numeracao gerada no banco.
-- Criar somente o que esta ausente: nunca reiniciar sequencia de producao.
DO $support$
DECLARE
  existing_ticket_max bigint;
BEGIN
  IF to_regclass('public.support_ticket_seq') IS NULL THEN
    CREATE SEQUENCE public.support_ticket_seq;
    SELECT coalesce(max(substring(ticket_number FROM '^TKT-([0-9]+)$')::bigint),0)
      INTO existing_ticket_max FROM public.support_tickets;
    PERFORM setval('public.support_ticket_seq', greatest(existing_ticket_max,1), existing_ticket_max > 0);
    REVOKE ALL ON SEQUENCE public.support_ticket_seq FROM PUBLIC, anon, authenticated;
    GRANT USAGE, SELECT ON SEQUENCE public.support_ticket_seq TO service_role;
  END IF;
  IF to_regprocedure('public.set_ticket_number()') IS NULL THEN
    EXECUTE $create_function$
      CREATE FUNCTION public.set_ticket_number() RETURNS trigger
      LANGUAGE plpgsql SET search_path TO public, pg_temp
      AS $body$
      BEGIN
        IF NEW.ticket_number IS NULL THEN
          NEW.ticket_number := 'TKT-' || LPAD(nextval('support_ticket_seq')::text,4,'0');
        END IF;
        RETURN NEW;
      END;
      $body$
    $create_function$;
    REVOKE ALL ON FUNCTION public.set_ticket_number() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.set_ticket_number() TO postgres, service_role;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.support_tickets'::regclass AND tgname='tr_set_ticket_number' AND NOT tgisinternal) THEN
    CREATE TRIGGER tr_set_ticket_number BEFORE INSERT ON public.support_tickets
      FOR EACH ROW EXECUTE FUNCTION public.set_ticket_number();
  END IF;
END
$support$;

