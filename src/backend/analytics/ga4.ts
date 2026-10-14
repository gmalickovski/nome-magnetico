import type { ProductType } from '../payments/stripe';

export function getGaClientIdFromRequest(request: Request): string | undefined {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
  if (!match) return undefined;

  const decoded = decodeURIComponent(match[1]);
  const parts = decoded.split('.');
  if (parts.length >= 4 && parts[0] === 'GA1') {
    return `${parts[2]}.${parts[3]}`;
  }

  return decoded || undefined;
}

/**
 * Não envia purchase.
 *
 * O GA4 sai uma vez por sendGa4Purchase (ga4-mp.ts) no webhook Stripe.
 * O PostHog sai uma vez por captureCheckoutPostHog no mesmo webhook
 * (uuid v5 + $insert_id, com ph_distinct_id). Não chamar capturePostHogPurchase
 * daqui: o uuid seria o mesmo, mas o distinct_id cairia no user id e
 * disputaria o evento canônico. A assinatura fica para o webhook não mudar
 * o fluxo de pagamento.
 */
export async function trackPurchaseConfirmed(params: {
  userId: string;
  productType: ProductType;
  transactionId: string;
  amountCents?: number | null;
  currency?: string | null;
  paymentProvider: 'stripe' | 'asaas';
  couponCode?: string | null;
  gaClientId?: string | null;
}): Promise<void> {
  void params;
}
