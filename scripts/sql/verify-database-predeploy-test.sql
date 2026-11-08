-- TESTE SOMENTE: executar no projeto kbqrkkltjvmxomrgsrbc.
-- Fixtures sinteticas, nenhuma chamada externa. Tudo e revertido por ROLLBACK.
-- A sequencia de tickets de TESTE pode avancar um numero (nextval nao e transacional).
BEGIN;
SET LOCAL statement_timeout = '30s';
DO $verify$
DECLARE
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  audit_session text := 'db-audit-' || gen_random_uuid()::text;
  result_count integer;
  ticket_number_generated text;
BEGIN
  INSERT INTO auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
    VALUES (user_a,'db-audit-'||user_a::text||'@example.invalid','{"nome":"DB Audit A"}','{"apps":["nome_magnetico"]}'),
           (user_b,'db-audit-'||user_b::text||'@example.invalid','{"nome":"DB Audit B"}','{"apps":["nome_magnetico"]}');
  SET LOCAL ROLE service_role;
  INSERT INTO public.chat_checkout_choices(user_id,chosen_signature,source,stripe_session_id)
    VALUES(user_a,'Pessoa Exemplo','card_pdf',audit_session);
  INSERT INTO public.chat_checkout_choices(user_id,chosen_signature,source,stripe_session_id)
    VALUES(user_a,'Pessoa Exemplo B','card_pdf',audit_session)
    ON CONFLICT(stripe_session_id) DO UPDATE SET chosen_signature=excluded.chosen_signature;
  SELECT count(*) INTO result_count FROM public.chat_checkout_choices WHERE stripe_session_id=audit_session;
  IF result_count <> 1 THEN RAISE EXCEPTION 'upsert nao idempotente'; END IF;
  UPDATE public.chat_checkout_choices SET pdf_generated_at=now() WHERE stripe_session_id=audit_session;
  BEGIN
    INSERT INTO public.chat_checkout_choices(user_id,chosen_signature,source,stripe_session_id)
      VALUES(user_a,repeat('X',81),'card_pdf',audit_session||'-invalid');
    RAISE EXCEPTION 'assinatura longa nao rejeitada';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.chat_checkout_choices(user_id,analysis_id,stripe_session_id)
      VALUES(user_a,gen_random_uuid(),audit_session||'-invalid-fk');
    RAISE EXCEPTION 'FK de analise nao rejeitada';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  INSERT INTO public.client_messages(title,public_title,body_markdown,channels,target_type,status,created_by)
    VALUES('DB AUDIT SYNTHETIC','DB AUDIT SYNTHETIC','synthetic',ARRAY['popup'],'manual','scheduled','db-audit');
  INSERT INTO public.support_tickets(subject,contact_email)
    VALUES('DB AUDIT SYNTHETIC','db-audit@example.invalid') RETURNING ticket_number INTO ticket_number_generated;
  IF ticket_number_generated IS NULL OR ticket_number_generated !~ '^TKT-[0-9]+$' THEN
    RAISE EXCEPTION 'numeracao automatica de ticket falhou';
  END IF;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub',user_a::text,true);
  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO result_count FROM public.chat_checkout_choices WHERE stripe_session_id=audit_session;
  IF result_count <> 1 THEN RAISE EXCEPTION 'dono nao le a propria escolha'; END IF;
  SELECT count(*) INTO result_count FROM public.user_status WHERE id=user_a;
  IF result_count <> 1 THEN RAISE EXCEPTION 'user_status nao le proprio perfil'; END IF;
  PERFORM set_config('request.jwt.claim.sub',user_b::text,true);
  SELECT count(*) INTO result_count FROM public.chat_checkout_choices WHERE stripe_session_id=audit_session;
  IF result_count <> 0 THEN RAISE EXCEPTION 'usuario B le escolha de A'; END IF;
  SELECT count(*) INTO result_count FROM public.user_status WHERE id=user_a;
  IF result_count <> 0 THEN RAISE EXCEPTION 'user_status expoe perfil de A para B'; END IF;
  BEGIN
    INSERT INTO public.chat_checkout_choices(user_id,stripe_session_id) VALUES(user_b,audit_session||'-browser');
    RAISE EXCEPTION 'cliente conseguiu mutar escolha';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM 1 FROM public.chat_checkout_choices LIMIT 1;
    RAISE EXCEPTION 'anon conseguiu ler escolhas';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
END
$verify$;
ROLLBACK;
SELECT true AS test_fixtures_rolled_back, 'RLS, insert/update servidor, idempotencia, constraints, FK, view, scheduled e ticket: aprovados' AS validation;

