import type { ProductType } from '../payments/stripe';
import { capturePostHogPurchase } from './posthog';

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
 * PostHog purchase no webhook. O purchase do GA4 sai por sendGa4Purchase
 * (ga4-mp.ts), chamado no mesmo webhook, para não duplicar a receita.
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
  try {
    await capturePostHogPurchase(params);
  } catch (err) {
    console.error('[posthog] Erro ao enviar purchase:', err);
  }
}
