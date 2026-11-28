/**
 * DEV-356: método real de um Checkout pago.
 *
 * O Pix pago com o cliente ainda na página chega como `checkout.session.completed`
 * já com `payment_status=paid`, sem `async_payment_succeeded`. Nessa sessão
 * `payment_method_types` lista cartão e Pix, então o tipo usado vem do PaymentIntent.
 */
type PaidCheckoutSession = {
  payment_intent?: string | { id: string } | null;
  payment_method_types?: string[] | null;
};

type RetrievePaymentIntent = (
  id: string,
) => Promise<{ payment_method?: string | { type?: string | null } | null }>;

export async function resolvePaidCheckoutMethod(
  session: PaidCheckoutSession,
  retrieve: RetrievePaymentIntent,
): Promise<'card' | 'pix'> {
  if (!session.payment_method_types?.includes('pix')) return 'card';
  const intentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;
  if (!intentId) return 'card';
  try {
    const intent = await retrieve(intentId);
    const method = intent.payment_method;
    return typeof method === 'object' && method?.type === 'pix' ? 'pix' : 'card';
  } catch {
    console.warn('[stripe-webhook] Método de pagamento indisponível; mantendo cartão');
    return 'card';
  }
}
