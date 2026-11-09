-- DEV-121: uso e acesso confirmados na mesma transação.
-- Invoker: somente backend service_role; nunca executar no navegador.
CREATE OR REPLACE FUNCTION public.redeem_access_trial(
  p_trial_code text,
  p_user_id uuid,
  p_user_email text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_code public.access_codes%ROWTYPE;
  v_products text[];
  v_pending text[];
  v_active text[];
  v_product text;
  v_email text := nullif(lower(btrim(p_user_email)), '');
  v_now timestamptz;
  v_end timestamptz;
  v_use_product text;
BEGIN
  IF p_user_id IS NULL OR nullif(btrim(p_trial_code), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'status', 400, 'error', 'Este código de acesso não é válido ou já expirou.');
  END IF;

  -- Mesma pessoa, códigos distintos: serializar a decisão de acesso ativo.
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trial profile unavailable' USING ERRCODE = 'P0001';
  END IF;

  -- Exato tem precedência sobre o alias sem hífen, como findAccessCode.
  SELECT * INTO v_code FROM public.access_codes
  WHERE code = upper(btrim(p_trial_code))
     OR code_normalized = upper(replace(btrim(p_trial_code), '-', ''))
  ORDER BY (code = upper(btrim(p_trial_code))) DESC, created_at DESC, id
  LIMIT 1 FOR UPDATE;

  v_now := clock_timestamp();
  IF NOT FOUND OR v_code.kind NOT IN ('trial', 'gift') OR NOT v_code.is_active
     OR v_code.trial_days IS NULL OR v_code.trial_days < 1
     OR (v_code.expires_at IS NOT NULL AND v_code.expires_at < v_now) THEN
    RETURN jsonb_build_object('ok', false, 'status', 400, 'error', 'Este código de acesso não é válido ou já expirou.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.access_code_uses
    WHERE code_id = v_code.id AND (user_id = p_user_id OR (v_email IS NOT NULL AND lower(user_email) = v_email))
  ) OR EXISTS (
    SELECT 1 FROM public.trial_redemptions
    WHERE user_id = p_user_id
      AND upper(replace(btrim(trial_code), '-', '')) = v_code.code_normalized
  ) THEN
    RETURN jsonb_build_object('ok', false, 'status', 409, 'alreadyRedeemed', true, 'error', 'Código já resgatado por este usuário');
  END IF;

  -- O lock do código impede dois resgates de ultrapassarem max_uses.
  IF v_code.max_uses IS NOT NULL AND
     (SELECT count(*) FROM public.access_code_uses WHERE code_id = v_code.id) >= v_code.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'status', 400, 'error', 'Este código atingiu o limite de usos');
  END IF;

  -- Configuração vazia acompanha os produtos vendáveis atuais (nome_social).
  SELECT array_agg(DISTINCT product ORDER BY product) INTO v_products
  FROM unnest(CASE WHEN coalesce(cardinality(v_code.product_types), 0) = 0
    THEN ARRAY['nome_social']::text[] ELSE v_code.product_types END) AS product
  WHERE product IN ('nome_social', 'nome_bebe', 'nome_empresa');
  IF coalesce(cardinality(v_products), 0) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'status', 400, 'error', 'Este código de acesso não é válido ou já expirou.');
  END IF;

  SELECT coalesce(array_agg(DISTINCT product_type ORDER BY product_type), ARRAY[]::text[]) INTO v_active
  FROM public.subscriptions
  WHERE user_id = p_user_id AND product_type = ANY(v_products) AND ends_at > v_now;
  SELECT coalesce(array_agg(product ORDER BY product), ARRAY[]::text[]) INTO v_pending
  FROM unnest(v_products) AS product WHERE NOT product = ANY(v_active);
  IF cardinality(v_pending) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'status', 409, 'alreadyActive', true, 'error', 'Você já possui acesso ativo para este produto.');
  END IF;

  -- Um uso por pessoa; all agrega produtos, sem multiplicar a contagem.
  v_use_product := CASE WHEN cardinality(v_products) > 1 THEN 'all' ELSE v_products[1] END;
  INSERT INTO public.access_code_uses(code_id, user_id, user_email, product_type, source)
  VALUES (v_code.id, p_user_id, v_email, v_use_product, 'redeem');

  v_end := v_now + make_interval(days => v_code.trial_days);
  FOREACH v_product IN ARRAY v_pending LOOP
    INSERT INTO public.subscriptions(user_id, product_type, starts_at, ends_at, stripe_session_id, amount_paid, metadata)
    VALUES (p_user_id, v_product, v_now, v_end,
      'trial_' || v_code.id::text || '_' || p_user_id::text || '_' || v_product, 0,
      jsonb_build_object('source', CASE WHEN v_code.kind = 'gift' THEN 'gift_access_link' ELSE 'access_code' END, 'code', v_code.code));
  END LOOP;

  -- Mantém compatibilidade com o perfil teste para cobertura vendável completa.
  IF 'nome_social' = ANY(v_pending) THEN
    UPDATE public.profiles SET is_test = true, test_ends_at = v_end WHERE id = p_user_id;
  END IF;

  INSERT INTO public.trial_redemptions(user_id, trial_code, trial_days, product_type, source)
  VALUES (p_user_id, v_code.code, v_code.trial_days, v_use_product,
    CASE WHEN v_code.kind = 'gift' THEN 'gift' ELSE 'link' END);

  -- Qualquer erro acima aborta a chamada inteira, inclusive uso e perfil.
  RETURN jsonb_build_object('ok', true, 'status', 200, 'endsAt', v_end, 'skippedActiveProducts', to_jsonb(v_active));
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_access_trial(text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_access_trial(text, uuid, text) TO service_role;
COMMENT ON FUNCTION public.redeem_access_trial(text, uuid, text) IS
  'DEV-121: backend-only atomic trial redemption; no Stripe calls; one use per holder.';
NOTIFY pgrst, 'reload schema';
