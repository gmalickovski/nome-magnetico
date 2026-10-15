import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createCheckoutSession, stripe, type ProductType } from '../../backend/payments/stripe';
import { supabase } from '../../backend/db/supabase';
import { createSubscription } from '../../backend/db/subscriptions';
import {
  applyPromotionDiscount,
  getPricesAndPromo,
  promotionAppliesToProduct,
  resolveHqCouponDiscount,
  validateAccessCoupon,
} from '../../backend/payments/prices';
import {
  parseRenewalEtapa,
  RENEWAL_ETAPAS,
  renewalUtmCampaign,
} from '../../backend/payments/renewal';
import { getGaClientIdFromRequest } from '../../backend/analytics/ga4';
import {
  readPostHogDistinctIdFromCookie,
  sanitizeDistinctId,
} from '../../backend/analytics/posthog-server';
import { PRODUCT_TYPES, SELLABLE_PRODUCT_TYPES } from '../../shared/product-labels';
import { logError } from '../../backend/utils/error-logger';

const PRICE_FALLBACK: Record<string, number> = { nome_social: 9800, nome_bebe: 8000, nome_empresa: 12500 };

const schema = z.object({
  product_type: z.enum(PRODUCT_TYPES),
  couponCode: z.string().optional(),
  ph_distinct_id: z.string().optional(),
  renewal: z.union([z.literal(1), z.literal('1'), z.literal(true)]).optional(),
  etapa: z.string().max(32).optional(),
});

const jsonHeaders = { 'Content-Type': 'application/json' };

function json(body: object, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export async function createCheckoutResponse(args: {
  request: Request;
  user: { id: string; email?: string | null } | null;
  url: URL;
  /** Atalho da página /app/renovar. O POST também aceita ?renewal=1&etapa=. */
  renewal?: boolean;
  etapa?: string | null;
  productType?: ProductType;
  phDistinctId?: string;
}): Promise<Response> {
  const { request, url } = args;
  const user = args.user;

  if (!user) {
    return json({ error: 'Autenticação necessária' }, 401);
  }

  let payload: unknown = {};
  // A página /app/renovar chama com productType e o request GET original (cookies).
  // O POST público continua exigindo JSON, como antes.
  if (!args.productType) {
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Body inválido' }, 400);
    }
  }

  const payloadObject =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const queryEtapa = url.searchParams.get('etapa');
  const queryRenewal = url.searchParams.get('renewal') === '1';
  const merged = {
    ...payloadObject,
    ...(queryEtapa && queryEtapa.trim() ? { etapa: queryEtapa } : {}),
    ...(queryRenewal ? { renewal: '1' as const } : {}),
    ...(args.productType ? { product_type: args.productType } : {}),
    ...(args.phDistinctId ? { ph_distinct_id: args.phDistinctId } : {}),
    ...(args.renewal ? { renewal: '1' as const } : {}),
    ...(args.etapa && args.etapa.trim() ? { etapa: args.etapa } : {}),
  };

  const parsed = schema.safeParse(merged);
  if (!parsed.success) {
    return json({ error: 'Produto inválido' }, 400);
  }

  const { product_type, couponCode } = parsed.data;
  const isRenewal =
    args.renewal === true ||
    queryRenewal ||
    parsed.data.renewal === 1 ||
    parsed.data.renewal === '1' ||
    parsed.data.renewal === true;

  if (!isRenewal && !(SELLABLE_PRODUCT_TYPES as readonly string[]).includes(product_type)) {
    return json({ error: 'Produto inválido' }, 400);
  }

  const etapaInput = parsed.data.etapa?.trim() ?? '';
  const etapa = etapaInput ? parseRenewalEtapa(etapaInput) : null;
  if (isRenewal && etapaInput && !etapa) {
    console.error('[create-checkout] Etapa de renovação inválida:', {
      etapa: etapaInput,
      allowed: RENEWAL_ETAPAS,
      userId: user.id,
    });
    return json(
      {
        error:
          'Este link de renovação expirou ou não é válido. Você pode renovar seu acesso direto pela página de compra.',
      },
      400,
    );
  }

  // Renovação cobra o preço de tabela (nome_social = R$ 98) e não aceita cupom nem promoção.
  if (isRenewal && couponCode?.trim()) {
    return json({ error: 'Cupom não se aplica à renovação.' }, 400);
  }

  const phDistinctId =
    sanitizeDistinctId(parsed.data.ph_distinct_id) ??
    readPostHogDistinctIdFromCookie(request.headers.get('cookie'));
  const baseUrl = process.env.APP_URL || url.origin;

  // Verificar se é admin ou usuário teste → bypass do Stripe
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_test, test_ends_at')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isTest =
    profile?.is_test === true &&
    (profile.test_ends_at === null ||
      new Date(profile.test_ends_at) > new Date());

  if (isAdmin || isTest) {
    await createSubscription({
      userId: user.id,
      productType: product_type,
      stripeSessionId: `bypass_${isAdmin ? 'admin' : 'test'}_${Date.now()}`,
      amountPaid: 0,
      purchaseKind: isRenewal ? 'renewal' : 'new',
    });

    return json({ bypass: true, redirectUrl: '/app?acesso=liberado' }, 200);
  }

  try {
    // ── Preço canônico do Stripe + promoção/cupom do banco local
    let unitAmount: number = PRICE_FALLBACK[product_type] ?? 9800;
    let couponId: string | undefined;
    let promotionCodeId: string | undefined;
    let couponHandled = false;

    if (isRenewal) {
      try {
        const { prices } = await getPricesAndPromo();
        const cents = prices[product_type]?.cents;
        if (cents && cents > 0) unitAmount = cents;
      } catch {
        unitAmount = PRICE_FALLBACK[product_type] ?? 9800;
      }
    } else {
      try {
        const { prices, promotion } = await getPricesAndPromo();
        const priceInfo = prices[product_type];
        unitAmount = priceInfo?.cents ?? PRICE_FALLBACK[product_type] ?? 9800;

        if (couponCode) {
          const hqCoupon = await validateAccessCoupon({
            couponCode,
            productType: product_type,
            userId: user.id,
            userEmail: user.email,
            originalCents: unitAmount,
          });

          if (hqCoupon?.valid) {
            const discountedCents = resolveHqCouponDiscount(hqCoupon, unitAmount);
            if (discountedCents !== null) {
              unitAmount = discountedCents;
              couponHandled = true;
            } else if (hqCoupon.stripePromoCodeId) {
              promotionCodeId = hqCoupon.stripePromoCodeId;
              couponHandled = true;
            } else if (hqCoupon.stripeCouponId) {
              couponId = hqCoupon.stripeCouponId;
              couponHandled = true;
            }
          } else if (hqCoupon && hqCoupon.error !== 'Cupom inválido ou expirado') {
            return json({ error: hqCoupon.error ?? 'Cupom inválido ou expirado' }, 400);
          }
        }

        if (!couponCode && promotion && promotionAppliesToProduct(promotion, product_type)) {
          if (promotion.stripeCouponId) {
            couponId = promotion.stripeCouponId;
          } else {
            unitAmount = applyPromotionDiscount(unitAmount, promotion);
          }
        }
      } catch {
        unitAmount = PRICE_FALLBACK[product_type] ?? 9800;
      }

      // ── Código de promoção manual (só usado se não há cupom sazonal ativo)
      if (!couponHandled && !couponId && !promotionCodeId && couponCode) {
        try {
          const promos = await stripe.promotionCodes.list({ code: couponCode, active: true, limit: 1 });
          if (promos.data.length > 0) {
            const promo = promos.data[0];
            const appliesToProducts = promo.coupon.applies_to?.products ?? [];
            const productId = process.env[`STRIPE_PRODUCT_${product_type.toUpperCase()}`];
            if (appliesToProducts.length === 0 || (productId && appliesToProducts.includes(productId))) {
              promotionCodeId = promo.id;
              couponHandled = true;
            }
          }
        } catch {
          // Falha silenciosa ao resolver código manual
        }
      }

      if (couponCode && !couponHandled && !couponId && !promotionCodeId) {
        return json({ error: 'Cupom inválido ou expirado' }, 400);
      }
    }

    const campaign = isRenewal && etapa ? renewalUtmCampaign(etapa) : undefined;
    const renewalQuery = etapa ? `?etapa=${encodeURIComponent(etapa)}` : '';

    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email ?? '',
      productType: product_type,
      unitAmount,
      successUrl: `${baseUrl}/app?checkout=success&produto=${product_type}`,
      cancelUrl: isRenewal
        ? `${baseUrl}/app/renovar${renewalQuery}`
        : `${baseUrl}/comprar?checkout=cancel`,
      couponId,
      promotionCodeId,
      couponCode: isRenewal ? undefined : couponCode?.trim(),
      // Cookie _ga vira metadata.ga_client_id (client_id do Measurement Protocol).
      gaClientId: getGaClientIdFromRequest(request),
      phDistinctId,
      purchaseKind: isRenewal ? 'renewal' : 'new',
      utmCampaign: campaign,
      utmSource: campaign ? 'brevo' : undefined,
      utmMedium: campaign ? 'email' : undefined,
    });

    return json({ url: session.url }, 200);
  } catch (err: unknown) {
    const stripeErr = err as { statusCode?: number; code?: string; type?: string; message?: string; param?: string };
    console.error('[create-checkout] Erro:', {
      statusCode: stripeErr.statusCode,
      type: stripeErr.type,
      code: stripeErr.code,
      param: stripeErr.param,
      message: stripeErr.message,
    });

    if (stripeErr.statusCode === 400) {
      const couponCodes = ['coupon_not_applicable', 'promotion_code_minimum_amount_not_met', 'resource_missing'];
      const isCouponError =
        couponCodes.includes(stripeErr.code ?? '') ||
        stripeErr.param === 'discounts' ||
        stripeErr.param === 'coupon' ||
        stripeErr.param === 'promotion_code';

      if (isCouponError) {
        return json(
          { error: 'Cupom inválido ou incompatível com este produto. Tente outro código.' },
          400,
        );
      }
    }

    // Registra erro crítico de checkout Stripe no monitor
    await logError({
      type: 'checkout_stripe',
      severity: 'critical',
      userId: user.id,
      message: stripeErr.message ?? 'Erro desconhecido ao criar sessão Stripe',
      details: {
        statusCode: stripeErr.statusCode,
        stripeType: stripeErr.type,
        stripeCode: stripeErr.code,
        param: stripeErr.param,
      },
    });

    return json({ error: 'Erro ao criar sessão de pagamento' }, 500);
  }
}

export const POST: APIRoute = async ({ request, locals, url }) => {
  return createCheckoutResponse({
    request,
    user: locals.user,
    url,
  });
};
