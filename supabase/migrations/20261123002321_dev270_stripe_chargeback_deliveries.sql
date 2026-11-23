CREATE TABLE public.stripe_chargeback_deliveries (
  dispute_id text PRIMARY KEY,
  lease_token uuid NOT NULL,
  lease_expires_at timestamptz NOT NULL,
  sent_at timestamptz
);

ALTER TABLE public.stripe_chargeback_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_chargeback_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stripe_chargeback_deliveries TO service_role;

CREATE POLICY stripe_chargeback_deliveries_service
  ON public.stripe_chargeback_deliveries FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE FUNCTION public.claim_stripe_chargeback_delivery(p_dispute_id text, p_lease_token uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  delivery_status text;
BEGIN
  INSERT INTO public.stripe_chargeback_deliveries AS delivery (dispute_id, lease_token, lease_expires_at)
  VALUES (p_dispute_id, p_lease_token, clock_timestamp() + interval '2 minutes')
  ON CONFLICT (dispute_id) DO UPDATE
    SET lease_token = EXCLUDED.lease_token,
        lease_expires_at = clock_timestamp() + interval '2 minutes'
    WHERE delivery.sent_at IS NULL AND delivery.lease_expires_at <= clock_timestamp();

  IF FOUND THEN
    RETURN 'claimed';
  END IF;

  SELECT CASE WHEN sent_at IS NULL THEN 'busy' ELSE 'sent' END
    INTO delivery_status
    FROM public.stripe_chargeback_deliveries
    WHERE dispute_id = p_dispute_id;

  RETURN coalesce(delivery_status, 'busy');
END;
$$;

REVOKE ALL ON FUNCTION public.claim_stripe_chargeback_delivery(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_stripe_chargeback_delivery(text, uuid) TO service_role;
