import { createHash } from 'node:crypto';

const GA4_COLLECT_URL = 'https://www.google-analytics.com/mp/collect';

export type Ga4PurchaseItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  price?: number;
  quantity?: number;
  coupon?: string;
};

export type SendGa4PurchaseParams = {
  clientId: string;
  transactionId: string;
  value: number;
  currency: string;
  items: Ga4PurchaseItem[];
  userId?: string;
  coupon?: string;
  paymentProvider?: string;
  productType?: string;
};

/** client_id estável quando a sessão Stripe não traz metadata.ga_client_id. */
export function resolveGaClientId(sessionId: string, metadataClientId?: string | null): string {
  const fromMeta = metadataClientId?.trim();
  if (fromMeta) return fromMeta;

  const hex = createHash('sha256').update(sessionId).digest('hex');
  const left = Number.parseInt(hex.slice(0, 8), 16);
  const right = Number.parseInt(hex.slice(8, 16), 16);
  return `${left}.${right}`;
}

/**
 * Purchase via GA4 Measurement Protocol.
 * Sem GA4_MEASUREMENT_ID ou GA4_API_SECRET, não envia. Nunca lança.
 * transactionId é o id da Checkout Session do Stripe.
 */
export async function sendGa4Purchase(params: SendGa4PurchaseParams): Promise<void> {
  try {
    const measurementId = process.env.GA4_MEASUREMENT_ID?.trim();
    const apiSecret = process.env.GA4_API_SECRET?.trim();

    if (!measurementId || !apiSecret) {
      if (process.env.APP_ENV !== 'production') {
        console.warn('[ga4-mp] GA4_MEASUREMENT_ID ou GA4_API_SECRET ausente; purchase não enviado.');
      }
      return;
    }

    const clientId = params.clientId.trim() || resolveGaClientId(params.transactionId, null);
    const currency = (params.currency || 'BRL').toUpperCase();
    const coupon = params.coupon?.trim() || undefined;

    const body = {
      client_id: clientId,
      ...(params.userId ? { user_id: params.userId } : {}),
      non_personalized_ads: false,
      events: [
        {
          name: 'purchase',
          params: {
            transaction_id: params.transactionId,
            affiliation: 'Nome Magnetico',
            value: params.value,
            currency,
            ...(coupon ? { coupon } : {}),
            ...(params.paymentProvider ? { payment_provider: params.paymentProvider } : {}),
            ...(params.productType ? { product_type: params.productType } : {}),
            items: params.items.map((item) => ({
              item_id: item.item_id,
              item_name: item.item_name,
              ...(item.item_brand ? { item_brand: item.item_brand } : {}),
              ...(item.item_category ? { item_category: item.item_category } : {}),
              ...(typeof item.price === 'number' ? { price: item.price } : {}),
              quantity: item.quantity ?? 1,
              ...(item.coupon || coupon ? { coupon: item.coupon || coupon } : {}),
            })),
          },
        },
      ],
    };

    const url = new URL(GA4_COLLECT_URL);
    url.searchParams.set('measurement_id', measurementId);
    url.searchParams.set('api_secret', apiSecret);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[ga4-mp] Falha ao enviar purchase:', res.status, await res.text());
    }
  } catch (err) {
    console.error('[ga4-mp] Erro ao enviar purchase:', err);
  }
}
