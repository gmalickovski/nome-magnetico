import type { ProductType } from '../payments/stripe';

const DEFAULT_HOST = 'https://us.i.posthog.com';

function posthogCaptureUrl(): string | null {
  const apiKey = process.env.PUBLIC_POSTHOG_KEY?.trim();
  if (!apiKey) return null;

  const host = (process.env.PUBLIC_POSTHOG_HOST?.trim() || DEFAULT_HOST).replace(/\/$/, '');
  if (!host.startsWith('https://')) return null;
  return `${host}/i/v0/e/`;
}

function centsToUnit(cents?: number | null) {
  if (!cents || cents <= 0) return 0;
  return Number((cents / 100).toFixed(2));
}

/**
 * Receita confirmada no PostHog. Mesmo momento do GA4 Measurement Protocol:
 * webhook Stripe/Asaas, depois da subscription criada.
 * Sem chave, não envia (local e VPS antes do env ficam seguros).
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
  const apiKey = process.env.PUBLIC_POSTHOG_KEY?.trim();
  const url = posthogCaptureUrl();

  if (!apiKey || !url) return;

  const coupon = params.couponCode?.trim() || undefined;
  const body = {
    api_key: apiKey,
    event: 'purchase',
    distinct_id: params.userId,
    timestamp: new Date().toISOString(),
    properties: {
      product_type: params.productType,
      value: centsToUnit(params.amountCents),
      currency: 'BRL',
      transaction_id: params.transactionId,
      payment_provider: params.paymentProvider,
      ...(coupon ? { coupon } : {}),
      $insert_id: params.transactionId,
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[posthog] Falha ao enviar purchase:', res.status);
    }
  } catch (err) {
    console.error('[posthog] Erro ao enviar purchase:', err);
  }
}
