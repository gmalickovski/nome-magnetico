ALTER TABLE public.access_code_uses
  ADD COLUMN stripe_session_id text,
  DROP CONSTRAINT access_code_uses_source_check,
  ADD CONSTRAINT access_code_uses_source_check
    CHECK (source IN ('redeem', 'webhook', 'import', 'ops', 'reserved'));

CREATE UNIQUE INDEX idx_access_code_uses_stripe_session_id
  ON public.access_code_uses (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_code_uses TO service_role;

CREATE FUNCTION public.reserve_access_coupon(
  p_reservation_id uuid,
  p_code_id uuid,
  p_user_id uuid,
  p_user_email text,
  p_product_type text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_coupon public.access_codes%ROWTYPE;
  v_email text := nullif(lower(btrim(p_user_email)), '');
  v_products text[];
  v_reservation_id uuid;
BEGIN
  IF p_reservation_id IS NULL OR p_user_id IS NULL OR p_product_type IS NULL
     OR p_product_type NOT IN ('nome_social', 'nome_bebe', 'nome_empresa') THEN
    RETURN NULL;
  END IF;

  -- Quem chegar depois espera o commit e conta a reserva do primeiro checkout.
  SELECT * INTO v_coupon
    FROM public.access_codes
    WHERE id = p_code_id AND kind = 'coupon'
    FOR UPDATE;

  IF NOT FOUND OR NOT v_coupon.is_active OR v_coupon.expires_at <= clock_timestamp() THEN
    RETURN NULL;
  END IF;

  v_products := ARRAY(
    SELECT product
    FROM unnest(v_coupon.product_types) AS product
    WHERE product IN ('nome_social', 'nome_bebe', 'nome_empresa')
  );
  IF cardinality(v_products) > 0 AND NOT (p_product_type = ANY(v_products)) THEN
    RETURN NULL;
  END IF;

  IF p_user_id = ANY(v_coupon.excluded_user_ids) OR (
    v_coupon.new_customers_only AND EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = p_user_id AND refunded_at IS NULL
    )
  ) THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.access_code_uses
    WHERE code_id = v_coupon.id
      AND (user_id = p_user_id OR (v_email IS NOT NULL AND lower(btrim(user_email)) = v_email))
  ) OR (
    v_coupon.max_uses IS NOT NULL AND (
      SELECT count(*) FROM public.access_code_uses WHERE code_id = v_coupon.id
    ) >= v_coupon.max_uses
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.access_code_uses (id, code_id, user_id, user_email, product_type, source)
  VALUES (p_reservation_id, v_coupon.id, p_user_id, v_email, p_product_type, 'reserved')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_access_coupon(uuid, uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_access_coupon(uuid, uuid, uuid, text, text)
  TO service_role;
