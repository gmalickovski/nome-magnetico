import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY é obrigatório');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
});

export type ProductType = 'nome_social' | 'nome_bebe' | 'nome_empresa';

const PRODUCT_IDS: Record<ProductType, string> = {
  nome_social: process.env.STRIPE_PRODUCT_NOME_SOCIAL ?? '',
  nome_bebe:   process.env.STRIPE_PRODUCT_NOME_BEBE   ?? '',
  nome_empresa: process.env.STRIPE_PRODUCT_NOME_EMPRESA ?? '',
};

const PRODUCT_NAMES: Record<ProductType, string> = {
  nome_social: 'Nome Social',
  nome_bebe: 'Nome de Bebê',
  nome_empresa: 'Nome Empresarial',
};

const PRODUCT_CUSTOM_TEXT: Record<ProductType, { submit: { message: string } }> = {
  nome_social: { submit: { message: 'Você receberá acesso por 30 dias após o pagamento.' } },
  nome_bebe: { submit: { message: 'Acesso por 30 dias. Analise quantos nomes candidatos quiser.' } },
  nome_empresa: { submit: { message: 'Acesso por 30 dias. Avalie nomes de empresa sem limite.' } },
};

export interface CreateCheckoutParams {
  userId: string;
  userEmail: string;
  productType: ProductType;
  /** Preço final em centavos (recalculado no servidor) */
  unitAmount: number;
  baseCents?: number;
  promoId?: string | null;
  discountSource?: 'none' | 'promotion' | 'coupon';
  successUrl: string;
  cancelUrl: string;
  /** Cupom sazonal automático (ID do coupon Stripe, se a promoção local tiver) */
  couponId?: string;
  /** Código de promoção manual do usuário (promotion_code ID do Stripe) */
  promotionCodeId?: string;
  /** Código digitado para registrar uso após o pagamento. */
  couponCode?: string;
  /** Client ID do GA4 capturado do cookie _ga para atribuição server-side. */
  gaClientId?: string;
  /** distinct_id do PostHog no browser, para o purchase server-side. */
  phDistinctId?: string;
  /** 'renewal' estende o acesso; omissão grava 'new'. product_type não muda. */
  purchaseKind?: 'new' | 'renewal';
  /** Campanha Brevo da etapa (nmrenovd7, nmrenovdp7, ...). */
  utmCampaign?: string;
  utmSource?: string;
  utmMedium?: string;
}

/**
 * Cria uma sessão de Checkout hospedado no Stripe.
 * Cartão e PIX vêm do Dashboard (dynamic payment methods) — sem listar
 * payment_method_types manualmente.
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const productId = PRODUCT_IDS[params.productType];

  if (!productId) {
    throw new Error(`Product ID não configurado para o produto: ${params.productType}`);
  }

  // ── Desconto: cupom sazonal local > código manual no modal.
  // O campo nativo de cupom do Stripe fica oculto para evitar duplicidade no checkout.
  let discountOptions: Record<string, unknown> = {};

  if (params.couponId) {
    discountOptions = { discounts: [{ coupon: params.couponId }] };
  } else if (params.promotionCodeId) {
    discountOptions = { discounts: [{ promotion_code: params.promotionCodeId }] };
  }

  if (!params.unitAmount || params.unitAmount <= 0) {
    throw new Error(`unit_amount inválido para ${params.productType}: ${params.unitAmount}`);
  }

  const metadata: Record<string, string> = {
    user_id: params.userId,
    product_type: params.productType,
    access_duration_days: '30',
    coupon_code: params.couponCode ?? '',
    base_cents: String(params.baseCents ?? params.unitAmount),
    final_cents: String(params.unitAmount),
    promo_id: params.promoId ?? '',
    discount_source: params.discountSource ?? 'none',
    ga_client_id: params.gaClientId ?? '',
    ph_distinct_id: params.phDistinctId ?? '',
    purchase_kind: params.purchaseKind === 'renewal' ? 'renewal' : 'new',
  };
  if (params.utmCampaign) {
    metadata.utm_campaign = params.utmCampaign;
    metadata.utm_source = params.utmSource || 'brevo';
    metadata.utm_medium = params.utmMedium || 'email';
  }

  return stripe.checkout.sessions.create({
    mode: 'payment',
    // Sem payment_method_types: Stripe usa o Dashboard (card + PIX já habilitados).
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product: productId,
          unit_amount: params.unitAmount,
        },
        quantity: 1,
      },
    ],
    customer_email: params.userEmail,
    metadata,
    custom_text: PRODUCT_CUSTOM_TEXT[params.productType],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    locale: 'pt-BR',
    payment_method_options: {
      pix: {
        // 30 minutos — alinhado à expectativa de pagamento imediato do produto
        expires_after_seconds: 1800,
      },
    },
    ...discountOptions,
    payment_intent_data: {
      metadata,
    },
  });
}

/**
 * Verifica e constrói o evento do webhook Stripe.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET é obrigatório');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Cria um reembolso total no Stripe para o payment_intent informado.
 */
export async function createRefund(paymentIntentId: string): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: 'requested_by_customer',
  });
}

export { PRODUCT_NAMES };
