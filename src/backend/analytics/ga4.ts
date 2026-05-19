import { createHmac } from 'node:crypto';
import type { ProductType } from '../payments/stripe';

const GA4_COLLECT_URL = 'https://www.google-analytics.com/mp/collect';

const PRODUCT_NAMES: Record<ProductType, string> = {
  nome_social: 'Nome Social',
  nome_bebe: 'Nome de Bebê',
  nome_empresa: 'Nome Empresarial',
};

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

function fallbackClientId(userId: string) {
  const secret =
    process.env.GA4_CLIENT_ID_HASH_SECRET ||
    process.env.INTERNAL_API_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'nome-magnetico';

  return createHmac('sha256', secret).update(userId).digest('hex').slice(0, 32);
}

function centsToUnit(cents?: number | null) {
  if (!cents || cents <= 0) return 0;
  return Number((cents / 100).toFixed(2));
}

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
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    if (process.env.APP_ENV !== 'production') {
      console.warn('[ga4] GA4_MEASUREMENT_ID ou GA4_API_SECRET ausente; purchase não enviado.');
    }
    return;
  }

  const value = centsToUnit(params.amountCents);
  const currency = (params.currency || 'brl').toUpperCase();
  const itemName = PRODUCT_NAMES[params.productType];
  const coupon = params.couponCode?.trim() || undefined;

  const body = {
    client_id: params.gaClientId || fallbackClientId(params.userId),
    user_id: params.userId,
    non_personalized_ads: false,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: params.transactionId,
          affiliation: 'Nome Magnetico',
          value,
          currency,
          coupon,
          payment_provider: params.paymentProvider,
          product_type: params.productType,
          items: [
            {
              item_id: params.productType,
              item_name: itemName,
              item_brand: 'Nome Magnetico',
              item_category: 'Numerologia cabalistica',
              price: value,
              quantity: 1,
              coupon,
            },
          ],
        },
      },
    ],
  };

  const url = new URL(GA4_COLLECT_URL);
  url.searchParams.set('measurement_id', measurementId);
  url.searchParams.set('api_secret', apiSecret);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[ga4] Falha ao enviar purchase:', res.status, await res.text());
    }
  } catch (err) {
    console.error('[ga4] Erro ao enviar purchase:', err);
  }
}
