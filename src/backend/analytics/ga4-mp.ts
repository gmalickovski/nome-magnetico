const GA4_COLLECT_URL = 'https://www.google-analytics.com/mp/collect';
const HOUR_MS = 60 * 60 * 1000;

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
  purchaseKind?: 'new' | 'renewal';
  sessionId?: number;
  paidAt?: Date;
  adsConsent?: boolean;
};

export function gaSessionForPurchase(sessionId: number | undefined, paidAt: number, sentAt: number) {
  if (!sessionId) return undefined;
  const start = sessionId * 1000;
  // Janela conservadora do piloto para evitar atribuir Pix tardio a uma sessão encerrada.
  if (paidAt < start || paidAt > start + HOUR_MS / 2 || sentAt > start + 24 * HOUR_MS) return undefined;
  return sessionId;
}

export async function sendGa4Purchase(params: SendGa4PurchaseParams): Promise<'sent' | 'skipped' | 'retry'> {
  try {
    const measurementId = process.env.GA4_MEASUREMENT_ID?.trim();
    const apiSecret = process.env.GA4_API_SECRET?.trim();

    if (!measurementId || !apiSecret) {
      if (process.env.APP_ENV !== 'production') {
        console.warn('[ga4-mp] GA4_MEASUREMENT_ID ou GA4_API_SECRET ausente; purchase não enviado.');
      }
      return 'skipped';
    }

    const clientId = params.clientId.trim();
    if (!/^\d{1,20}\.\d{1,20}$/.test(clientId)) return 'skipped';
    const sentAt = Date.now();
    const paidAt = params.paidAt?.getTime() ?? sentAt;
    if (!Number.isFinite(paidAt) || paidAt > sentAt || sentAt - paidAt > 72 * HOUR_MS) return 'skipped';
    const sessionId = gaSessionForPurchase(params.sessionId, paidAt, sentAt);
    const currency = (params.currency || 'BRL').toUpperCase();
    const coupon = params.coupon?.trim() || undefined;

    const body = {
      client_id: clientId,
      timestamp_micros: paidAt * 1000,
      consent: { ad_user_data: params.adsConsent ? 'GRANTED' : 'DENIED', ad_personalization: 'DENIED' },
      events: [
        {
          name: 'purchase',
          params: {
            transaction_id: params.transactionId,
            affiliation: 'Nome Magnetico',
            value: params.value,
            currency,
            ...(sessionId ? { session_id: sessionId, engagement_time_msec: 1 } : {}),
            ...(coupon ? { coupon } : {}),
            ...(params.paymentProvider ? { payment_provider: params.paymentProvider } : {}),
            ...(params.productType ? { product_type: params.productType } : {}),
            ...(params.purchaseKind ? { purchase_kind: params.purchaseKind } : {}),
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
      signal: AbortSignal.timeout(4500),
    });

    if (!res.ok) {
      console.error('[ga4-mp] Falha ao enviar purchase:', res.status);
      return 'retry';
    }
    return 'sent';
  } catch {
    console.error('[ga4-mp] Erro ao enviar purchase');
    return 'retry';
  }
}
