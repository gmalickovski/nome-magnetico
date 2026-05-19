import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createCheckoutSession, stripe, type ProductType } from '../../backend/payments/stripe';
import { supabase } from '../../backend/db/supabase';
import {
  getHqPricesAndPromo,
  promotionAppliesToProduct,
  resolveHqCouponDiscount,
  validateHqAccessCoupon,
} from '../../backend/payments/prices';
import { getGaClientIdFromRequest } from '../../backend/analytics/ga4';
import { logError } from '../../backend/utils/error-logger';

const schema = z.object({
  product_type: z.enum(['nome_social', 'nome_bebe', 'nome_empresa']),
  couponCode: z.string().optional(),
});

export const POST: APIRoute = async ({ request, locals, url }) => {
  const user = locals.user;
  const accessToken = locals.accessToken;

  if (!user || !accessToken) {
    return new Response(
      JSON.stringify({ error: 'Autenticação necessária' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Produto inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { product_type, couponCode } = parsed.data;
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
    const endsAt = new Date(Date.now() + 30 * 86400000).toISOString();
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      product_type,
      starts_at: new Date().toISOString(),
      ends_at: endsAt,
      stripe_session_id: `bypass_${isAdmin ? 'admin' : 'test'}_${Date.now()}`,
      amount_paid: 0,
    });

    return new Response(
      JSON.stringify({ bypass: true, redirectUrl: '/app?acesso=liberado' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // ── Busca preço canônico do HQ (fonte de verdade)
    let unitAmount: number;
    let couponId: string | undefined;
    let promotionCodeId: string | undefined;
    let couponHandled = false;
    const PRICE_FALLBACK: Record<string, number> = { nome_social: 9800, nome_bebe: 8000, nome_empresa: 12500 };

    try {
      const { prices, promotion } = await getHqPricesAndPromo();
      const priceInfo = prices[product_type];
      unitAmount = priceInfo?.cents ?? PRICE_FALLBACK[product_type] ?? 9800;

      if (couponCode) {
        const hqCoupon = await validateHqAccessCoupon({
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
          return new Response(
            JSON.stringify({ error: hqCoupon.error ?? 'Cupom inválido ou expirado' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      if (!couponCode && promotion?.stripeCouponId) {
        const appliesToThis = promotionAppliesToProduct(promotion, product_type);
        if (appliesToThis) couponId = promotion.stripeCouponId;
      }
    } catch {
      // HQ indisponível — fallback para preços hardcoded
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
      return new Response(
        JSON.stringify({ error: 'Cupom inválido ou expirado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email ?? '',
      productType: product_type as ProductType,
      unitAmount,
      successUrl: `${baseUrl}/app?checkout=success&produto=${product_type}`,
      cancelUrl: `${baseUrl}/comprar?checkout=cancel`,
      couponId,
      promotionCodeId,
      couponCode: couponCode?.trim(),
      gaClientId: getGaClientIdFromRequest(request),
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
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
        return new Response(
          JSON.stringify({ error: 'Cupom inválido ou incompatível com este produto. Tente outro código.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
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

    return new Response(
      JSON.stringify({ error: 'Erro ao criar sessão de pagamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
