-- TESTE SOMENTE (kbqrkkltjvmxomrgsrbc). Fixtures e triggers revertidos por ROLLBACK.
BEGIN;
SET LOCAL statement_timeout = '30s';
CREATE FUNCTION pg_temp.dev121_fail_fixture() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('dev121.fail_inserts', true) = 'on' AND ((TG_TABLE_NAME = 'subscriptions' AND to_jsonb(NEW)->'metadata'->>'code' = 'DEV121_FAIL_SUB' AND to_jsonb(NEW)->>'product_type' = 'nome_social')
     OR (TG_TABLE_NAME = 'trial_redemptions' AND to_jsonb(NEW)->>'trial_code' = 'DEV121_FAIL_AUDIT')) THEN
    RAISE EXCEPTION 'synthetic DEV121 failure' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER dev121_failure_fixture BEFORE INSERT ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION pg_temp.dev121_fail_fixture();
CREATE TRIGGER dev121_failure_fixture BEFORE INSERT ON public.trial_redemptions
FOR EACH ROW EXECUTE FUNCTION pg_temp.dev121_fail_fixture();

DO $verify$
DECLARE
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  fixture_code_id uuid;
  r jsonb;
  flag boolean;
  n integer;
  code_text text;
BEGIN
  IF has_function_privilege('anon','public.redeem_access_trial(text,uuid,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.redeem_access_trial(text,uuid,text)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.redeem_access_trial(text,uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'RPC grant regression';
  END IF;
  INSERT INTO auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
  VALUES (a,'dev121-'||a::text||'@example.invalid','{"nome":"Synthetic DEV121"}','{"apps":["nome_magnetico"]}'),
         (b,'dev121-'||b::text||'@example.invalid','{"nome":"Synthetic DEV121"}','{"apps":["nome_magnetico"]}'),
         (c,'dev121-'||c::text||'@example.invalid','{"nome":"Synthetic DEV121"}','{"apps":["nome_magnetico"]}');
  INSERT INTO public.access_codes(code,kind,product_types,trial_days,max_uses)
  VALUES ('DEV121_ALL','trial',ARRAY['nome_social','nome_bebe','nome_empresa'],7,2),
         ('DEV121_EMPTY','trial','{}',7,null),
         ('DEV121_SUBSET','gift',ARRAY['nome_bebe','nome_empresa'],5,null),
         ('DEV121_FAIL_SUB','trial',ARRAY['nome_social','nome_bebe','nome_empresa'],7,1),
         ('DEV121_FAIL_AUDIT','trial',ARRAY['nome_social','nome_bebe','nome_empresa'],7,1),
         ('DEV121_ACTIVE','trial',ARRAY['nome_social'],7,1),
         ('DEV121_PARTIAL','trial',ARRAY['nome_social','nome_bebe','nome_empresa'],7,null),
         ('DEV121_LEGACY','trial',ARRAY['nome_social'],7,null),
         ('DEV121_EXPIRED','trial',ARRAY['nome_social'],7,null),
         ('DEV121_DISABLED','trial',ARRAY['nome_social'],7,null);
  UPDATE public.access_codes SET expires_at=now()-interval '1 hour' WHERE code='DEV121_EXPIRED';
  UPDATE public.access_codes SET is_active=false WHERE code='DEV121_DISABLED';
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  SET LOCAL ROLE service_role;

  r := public.redeem_access_trial(' dev121_all ',a,'dev121-'||a::text||'@example.invalid');
  IF r->>'ok' <> 'true' OR (SELECT count(*) FROM public.subscriptions WHERE user_id=a) <> 3 THEN
    RAISE EXCEPTION 'multi-product grant failed: %',r;
  END IF;
  IF (SELECT count(*) FROM public.access_code_uses WHERE user_id=a) <> 1
    OR (SELECT product_type FROM public.access_code_uses WHERE user_id=a) <> 'all' THEN
    RAISE EXCEPTION 'multi-product must count one all';
  END IF;
  r := public.redeem_access_trial('DEV121_ALL',a,null);
  IF r->>'alreadyRedeemed' <> 'true' THEN RAISE EXCEPTION 'repeat not rejected'; END IF;
  r := public.redeem_access_trial('DEV121_ALL',b,null);
  IF r->>'ok' <> 'true' OR (SELECT count(*) FROM public.subscriptions WHERE user_id=b) <> 3 THEN
    RAISE EXCEPTION 'second holder/session uniqueness failed';
  END IF;
  r := public.redeem_access_trial('DEV121_ALL',c,null);
  IF r->>'status' <> '400' OR r->>'error' <> 'Este código atingiu o limite de usos' THEN
    RAISE EXCEPTION 'max uses exceeded';
  END IF;
  DELETE FROM public.subscriptions WHERE user_id IN (a,b);
  UPDATE public.profiles SET is_test=false,test_ends_at=null WHERE id IN (a,b);

  r := public.redeem_access_trial('DEV121_EMPTY',c,null);
  IF r->>'ok' <> 'true' OR (SELECT array_agg(product_type) FROM public.subscriptions WHERE user_id=c) <> ARRAY['nome_social']
    OR (SELECT product_type FROM public.access_code_uses WHERE user_id=c) <> 'nome_social' THEN
    RAISE EXCEPTION 'empty configuration must grant sellable social only';
  END IF;
  r := public.redeem_access_trial('DEV121_ACTIVE',c,null);
  IF r->>'alreadyActive' <> 'true'
    OR EXISTS(SELECT 1 FROM public.access_code_uses u JOIN public.access_codes ac ON ac.id=u.code_id WHERE ac.code='DEV121_ACTIVE') THEN
    RAISE EXCEPTION 'active product consumed use';
  END IF;
  r := public.redeem_access_trial('DEV121_PARTIAL',c,null);
  IF r->>'ok' <> 'true' OR r->'skippedActiveProducts' <> '["nome_social"]'::jsonb
    OR (SELECT count(*) FROM public.subscriptions WHERE user_id=c) <> 3 THEN
    RAISE EXCEPTION 'partial active grant failed';
  END IF;
  r := public.redeem_access_trial('DEV121_SUBSET',a,null);
  IF r->>'ok' <> 'true' OR (SELECT count(*) FROM public.subscriptions WHERE user_id=a) <> 2
    OR NOT EXISTS(SELECT 1 FROM public.trial_redemptions WHERE user_id=a AND trial_code='DEV121_SUBSET' AND source='gift') THEN
    RAISE EXCEPTION 'gift subset failed';
  END IF;
  DELETE FROM public.subscriptions WHERE user_id=a;

  FOREACH code_text IN ARRAY ARRAY['DEV121_FAIL_SUB','DEV121_FAIL_AUDIT'] LOOP
    flag := false;
    PERFORM set_config('dev121.fail_inserts','on',true);
    BEGIN
      PERFORM public.redeem_access_trial(code_text,a,null);
    EXCEPTION WHEN check_violation THEN flag := true;
    END;
    IF NOT flag THEN RAISE EXCEPTION 'synthetic failure not reached: %',code_text; END IF;
    SELECT id INTO fixture_code_id FROM public.access_codes WHERE code=code_text;
    IF EXISTS(SELECT 1 FROM public.access_code_uses WHERE code_id=fixture_code_id AND user_id=a) THEN
      RAISE EXCEPTION 'use persisted after failure';
    END IF;
    IF EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=a)
       OR EXISTS(SELECT 1 FROM public.trial_redemptions WHERE user_id=a AND trial_code=code_text)
       OR EXISTS(SELECT 1 FROM public.profiles WHERE id=a AND is_test) THEN
      RAISE EXCEPTION 'partial writes persisted after failure: %',code_text;
    END IF;
    PERFORM set_config('dev121.fail_inserts','off',true);
    r := public.redeem_access_trial(code_text,a,null);
    IF r->>'ok' <> 'true' OR (SELECT count(*) FROM public.subscriptions WHERE user_id=a) <> 3
      OR (SELECT count(*) FROM public.access_code_uses WHERE code_id=fixture_code_id) <> 1 THEN
      RAISE EXCEPTION 'retry after failure failed: %',code_text;
    END IF;
    DELETE FROM public.subscriptions WHERE user_id=a;
    DELETE FROM public.trial_redemptions WHERE user_id=a AND trial_code=code_text;
    DELETE FROM public.access_code_uses WHERE code_id=fixture_code_id AND user_id=a;
    UPDATE public.profiles SET is_test=false,test_ends_at=null WHERE id=a;
  END LOOP;

  INSERT INTO public.trial_redemptions(user_id,trial_code,trial_days,product_type)
  VALUES(a,'dev121_legacy',7,'nome_social');
  r := public.redeem_access_trial('DEV121_LEGACY',a,null);
  IF r->>'alreadyRedeemed' <> 'true' THEN RAISE EXCEPTION 'legacy redemption not detected'; END IF;
  FOREACH code_text IN ARRAY ARRAY['DEV121_EXPIRED','DEV121_DISABLED','DEV121_UNKNOWN'] LOOP
    r := public.redeem_access_trial(code_text,a,null);
    IF r->>'ok' <> 'false' OR r->>'status' <> '400' THEN RAISE EXCEPTION 'invalid code granted'; END IF;
  END LOOP;
  RESET ROLE;
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM public.redeem_access_trial('DEV121_ALL',a,null);
    RAISE EXCEPTION 'anon could invoke trial RPC';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM public.redeem_access_trial('DEV121_ALL',a,null);
    RAISE EXCEPTION 'browser could invoke trial RPC';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
END;
$verify$;
ROLLBACK;
SELECT true AS rollback_complete, 'DEV121: product scope, max uses, repeated/legacy, active/partial, rollback subscription/audit/profile and grants passed' AS validation;
