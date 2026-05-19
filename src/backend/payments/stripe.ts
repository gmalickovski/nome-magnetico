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
  /** Preço em centavos (vem do HQ em tempo real) */
  unitAmount: number;
  successUrl: string;
  cancelUrl: string;
  /** Cupom sazonal automático (ID do coupon Stripe, vindo do HQ) */
  couponId?: string;
  /** Código de promoção manual do usuário (promotion_code ID do Stripe) */
  promotionCodeId?: string;
  /** Código digitado para registrar uso no HQ após o pagamento. */
  couponCode?: string;
  /** Client ID do GA4 capturado do cookie _ga para atribuição server-side. */
  gaClientId?: string;
}

/**
 * Cria uma sessão de checkout no Stripe.
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const productId = PRODUCT_IDS[params.productType];

  if (!productId) {
    throw new Error(`Product ID não configurado para o produto: ${params.productType}`);
  }

  // ── Desconto: coupon sazonal (HQ) > código manual no modal.
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

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
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
    metadata: {
      user_id: params.userId,
      product_type: params.productType,
      access_duration_days: '30',
      coupon_code: params.couponCode ?? '',
      ga_client_id: params.gaClientId ?? '',
    },
    custom_text: PRODUCT_CUSTOM_TEXT[params.productType],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    locale: 'pt-BR',
    ...discountOptions,
    payment_intent_data: {
      metadata: {
        user_id: params.userId,
        product_type: params.productType,
        coupon_code: params.couponCode ?? '',
        ga_client_id: params.gaClientId ?? '',
      },
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
