import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createCheckoutSession, stripe, type ProductType } from '../../backend/payments/stripe';
import { supabase } from '../../backend/db/supabase';
import { createSubscription } from '../../backend/db/subscriptions';
import { effectiveResultToPriceInfo, validateAccessCoupon } from '../../backend/payments/prices';
import { getEffectivePriceCore } from '../../backend/pricing/service';
import { effectiveFinalBelowFloor } from '../../backend/pricing/effective-price';
import {
  parseRenewalEtapa,
  RENEWAL_ETAPAS,
  renewalUtmCampaign,
} from '../../backend/payments/renewal';
import { getGaClientIdFromRequest } from '../../backend/analytics/ga4';
import {
  captureServerEvent,
  readPostHogDistinctIdFromCookie,
  sanitizeDistinctId,
} from '../../backend/analytics/posthog-server';
import { PRODUCT_TYPES, SELLABLE_PRODUCT_TYPES } from '../../shared/product-labels';
import { logError } from '../../backend/utils/error-logger';
import { captureFluxoException } from '../../sentry/fluxo';
import { getPublicBaseUrl } from '../../utils/public-url';
import { hasActiveSubscription } from '../../backend/db/subscriptions';
import {
  CHECKOUT_ALREADY_ACTIVE_CODE,
  checkoutAlreadyActiveMessage,
  productAnalysisAppPath,
  shouldBlockCheckoutForActiveProduct,
} from '../../backend/payments/checkout-access';

const schema = z.object({
  product_type: z.enum(PRODUCT_TYPES),
  couponCode: z.string().optional(),
  ph_distinct_id: z.string().optional(),
  renewal: z.union([z.literal(1), z.literal('1'), z.literal(true)]).optional(),
  etapa: z.string().max(32).optional(),
  /** Centavos exibidos na página — se divergir, devolve price_changed antes do Stripe */
  expected_final_cents: z.number().int().positive().optional(),
});

const jsonHeaders = { 'Content-Type': 'application/json' };

function json(body: object, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export async function createCheckoutResponse(args: {
  request: Request;
  user: { id: string; email?: string | null } | null;
  url: URL;
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

  const { product_type, couponCode, expected_final_cents: expectedFinalCents } = parsed.data;
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

  if (isRenewal && couponCode?.trim()) {
    return json({ error: 'Cupom não se aplica à renovação.' }, 400);
  }

  const phDistinctId =
    sanitizeDistinctId(parsed.data.ph_distinct_id) ??
    readPostHogDistinctIdFromCookie(request.headers.get('cookie'));
  const baseUrl = getPublicBaseUrl();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_test, test_ends_at')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isTest =
    profile?.is_test === true &&
    (profile.test_ends_at === null || new Date(profile.test_ends_at) > new Date());

  const hasActiveProduct = await hasActiveSubscription(user.id, product_type);
  if (shouldBlockCheckoutForActiveProduct(isRenewal, hasActiveProduct)) {
    const redirectUrl = productAnalysisAppPath(product_type);
    return json(
      {
        error: checkoutAlreadyActiveMessage(product_type),
        code: CHECKOUT_ALREADY_ACTIVE_CODE,
        redirectUrl,
      },
      409,
    );
  }

  if (isAdmin || isTest) {
    await createSubscription({
      userId: user.id,
      productType: product_type,
      stripeSessionId: `bypass_${isAdmin ? 'admin' : 'test'}_${Date.now()}`,
      amountPaid: 0,
      paymentProvider: 'test',
      purchaseKind: isRenewal ? 'renewal' : 'new',
    });

    return json({ bypass: true, redirectUrl: '/app?acesso=liberado' }, 200);
  }

  try {
    let couponValidation = null;
    if (couponCode?.trim() && !isRenewal) {
      couponValidation = await validateAccessCoupon({
        couponCode,
        productType: product_type,
        userId: user.id,
        userEmail: user.email,
      });
      if (couponValidation && !couponValidation.valid) {
        if (couponValidation.error !== 'Cupom inválido ou expirado') {
          return json({ error: couponValidation.error ?? 'Cupom inválido ou expirado' }, 400);
        }
        return json({ error: 'Cupom inválido ou expirado' }, 400);
      }
    }

    let effective;
    try {
      effective = await getEffectivePriceCore({
        productType: product_type,
        couponValidation,
        renewalTablePrice: isRenewal,
      });
    } catch (err) {
      console.error('[create-checkout] Falha ao calcular preço:', err);
      return json({ error: 'Não foi possível calcular o preço. Tente novamente.' }, 503);
    }

    if (effectiveFinalBelowFloor(effective.final_cents, effective.min_cents)) {
      return json({ error: 'Preço abaixo do mínimo permitido para este produto.' }, 400);
    }

    if (
      typeof expectedFinalCents === 'number' &&
      expectedFinalCents !== effective.final_cents
    ) {
      return json(
        {
          price_changed: true,
          message: 'O valor foi atualizado desde que você abriu a página.',
          pricing: effectiveResultToPriceInfo(effective),
          effective,
        },
        200,
      );
    }

    const unitAmount = effective.final_cents;
    let couponHandled = effective.discountSource === 'coupon';
    let couponId: string | undefined;
    let promotionCodeId: string | undefined;

    if (!isRenewal && couponCode && effective.discountSource === 'none') {
      return json({ error: 'Cupom inválido ou expirado' }, 400);
    }

    if (!isRenewal && !couponHandled && couponCode) {
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
        // ignore
      }
    }

    if (couponCode && !couponHandled && !couponId && !promotionCodeId && effective.discountSource !== 'promotion') {
      return json({ error: 'Cupom inválido ou expirado' }, 400);
    }

    const campaign = isRenewal && etapa ? renewalUtmCampaign(etapa) : undefined;
    const renewalQuery = etapa ? `?etapa=${encodeURIComponent(etapa)}` : '';

    const distinctId =
      phDistinctId ??
      user.id;

    await captureServerEvent({
      distinctId,
      event: 'checkout_started',
      properties: {
        product_type,
        base_cents: effective.base_cents,
        final_cents: effective.final_cents,
        promo_id: effective.promo_id ?? '',
        promo_code: effective.promoCode ?? couponCode?.trim() ?? '',
        discount_source: effective.discountSource,
        currency: 'BRL',
        value: Number((effective.final_cents / 100).toFixed(2)),
      },
    }).catch((err) => console.error('[create-checkout] PostHog checkout_started:', err));

    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email ?? '',
      productType: product_type,
      unitAmount,
      baseCents: effective.base_cents,
      promoId: effective.promo_id,
      discountSource: effective.discountSource,
      successUrl: `${baseUrl}/app?checkout=success&produto=${product_type}`,
      cancelUrl: isRenewal
        ? `${baseUrl}/app/renovar${renewalQuery}`
        : `${baseUrl}/comprar?checkout=cancel`,
      couponId,
      promotionCodeId,
      couponCode: isRenewal ? undefined : couponCode?.trim(),
      gaClientId: getGaClientIdFromRequest(request),
      phDistinctId,
      purchaseKind: isRenewal ? 'renewal' : 'new',
      utmCampaign: campaign,
      utmSource: campaign ? 'brevo' : undefined,
      utmMedium: campaign ? 'email' : undefined,
    });

    return json({ url: session.url, final_cents: unitAmount, base_cents: effective.base_cents }, 200);
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

    captureFluxoException('checkout', err, {
      status_http: stripeErr.statusCode ?? null,
      codigo_erro: stripeErr.code ?? null,
    });

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
