import type { ProductType } from '../payments/stripe';
import { captureServerEvent, posthogEventUuid } from './posthog-server';

function centsToUnit(cents?: number | null) {
  if (!cents || cents <= 0) return 0;
  return Number((cents / 100).toFixed(2));
}

/**
 * Compatibilidade. O purchase canônico sai do webhook Stripe via posthog-server,
 * com ph_distinct_id e payment_method. O uuid é o mesmo (purchase + session id),
 * então uma segunda chamada para a mesma sessão não duplica a receita.
 */
export async function capturePostHogPurchase(params: {
  userId: string;
  productType: ProductType;
  transactionId: string;
  amountCents?: number | null;
  currency?: string | null;
  paymentProvider: 'stripe' | 'asaas';
  couponCode?: string | null;
}): Promise<void> {
  const distinctId = params.userId?.trim();
  const sessionId = params.transactionId?.trim();
  if (!distinctId || !sessionId) return;

  const coupon = params.couponCode?.trim() || undefined;
  await captureServerEvent({
    distinctId,
    event: 'purchase',
    uuid: posthogEventUuid('purchase', sessionId),
    properties: {
      product: params.productType,
      product_type: params.productType,
      value: centsToUnit(params.amountCents),
      currency: (params.currency || 'brl').toUpperCase(),
      payment_provider: params.paymentProvider,
      session_id: sessionId,
      transaction_id: sessionId,
      ...(coupon ? { coupon } : {}),
    },
  });
}
