-- DEV-236: assinaturas liberadas pelo atalho admin/teste (bypass checkout)
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_payment_provider_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_payment_provider_check
  CHECK (payment_provider IN ('stripe', 'asaas', 'test'));

COMMENT ON COLUMN public.subscriptions.payment_provider IS
  'Provedor de pagamento: stripe, asaas ou test (acesso simulado admin/teste)';
