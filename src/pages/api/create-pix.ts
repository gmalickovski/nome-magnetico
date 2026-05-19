import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '../../backend/db/supabase';
import { createPixCharge } from '../../backend/payments/asaas';
import {
  getHqPricesAndPromo,
  promotionAppliesToProduct,
  resolveHqCouponDiscount,
  validateHqAccessCoupon,
} from '../../backend/payments/prices';
import { getGaClientIdFromRequest } from '../../backend/analytics/ga4';
import type { ProductType } from '../../backend/payments/stripe';
import { logError } from '../../backend/utils/error-logger';

const schema = z.object({
  product_type: z.enum(['nome_social', 'nome_bebe', 'nome_empresa']),
  coupon_code:  z.string().optional(),
});

const FALLBACK_PRICES: Record<ProductType, number> = {
  nome_social:   98.00,
  nome_bebe:     80.00,
  nome_empresa: 125.00,
};

const PRODUCT_DESCRIPTIONS: Record<ProductType, string> = {
  nome_social:  'Nome Magnético — Nome Social',
  nome_bebe:    'Nome Magnético — Nome de Bebê',
  nome_empresa: 'Nome Magnético — Nome Empresarial',
};

function formatBRL(cents: number) {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const POST: APIRoute = async ({ request, locals }) => {
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

  const { product_type, coupon_code } = parsed.data;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_test, test_ends_at')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isTest =
    profile?.is_test === true &&
    (profile.test_ends_at === null || new Date(profile.test_ends_at) > new Date());

  if (isAdmin || isTest) {
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      product_type,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      stripe_session_id: `bypass_${isAdmin ? 'admin' : 'test'}_${Date.now()}`,
      amount_paid: 0,
    });
    return new Response(
      JSON.stringify({ bypass: true, redirectUrl: '/app?acesso=liberado' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // ── Busca preço canônico do HQ e verifica cupom
    let value = FALLBACK_PRICES[product_type as ProductType];
    let originalCents = Math.round(value * 100);
    let finalCents = originalCents;
    const cleanCoupon = coupon_code?.trim();

    try {
      const { prices, promotion } = await getHqPricesAndPromo();
      const priceInfo = prices[product_type];
      if (priceInfo?.cents) {
        value = priceInfo.cents / 100;
      }
      originalCents = Math.round(value * 100);
      finalCents = originalCents;

      let couponHandled = false;
      if (cleanCoupon) {
        const hqCoupon = await validateHqAccessCoupon({
          couponCode: cleanCoupon,
          productType: product_type,
          userId: user.id,
          userEmail: user.email,
          originalCents,
        });

        if (hqCoupon) {
          if (!hqCoupon.valid && hqCoupon.error !== 'Cupom inválido ou expirado') {
            return new Response(
              JSON.stringify({ error: hqCoupon.error ?? 'Cupom inválido ou expirado' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
          const discountedCents = resolveHqCouponDiscount(hqCoupon, originalCents);
          if (discountedCents !== null) {
            finalCents = discountedCents;
            value = finalCents / 100;
            couponHandled = true;
          }
        }
      }

      // Aplica desconto se cupom ou promoção ativa for válida
      if (promotion && !couponHandled) {
        const appliesToThis = promotionAppliesToProduct(promotion, product_type);
        const couponMatch = cleanCoupon &&
          promotion.stripePromoCode?.toLowerCase() === cleanCoupon.toLowerCase();
        const autoPromo = !coupon_code; // promoção automática sem cupom

        if (appliesToThis && (couponMatch || autoPromo)) {
          if (promotion.discountType === 'percent') {
            finalCents = Math.round(originalCents * (1 - promotion.discountValue / 100));
          } else {
            finalCents = Math.max(0, originalCents - Math.round(promotion.discountValue * 100));
          }
          value = finalCents / 100;
          couponHandled = true;
        }
      }

      if (cleanCoupon && !couponHandled) {
        return new Response(
          JSON.stringify({ error: 'Cupom inválido ou expirado' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (err) {
      if (cleanCoupon) {
        console.error('[create-pix] Erro ao validar cupom no HQ:', err);
        return new Response(
          JSON.stringify({ error: 'Erro ao validar cupom para PIX. Tente novamente.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // HQ indisponível — usa fallback sem desconto apenas quando não há cupom
      finalCents = Math.round(value * 100);
    }

    const result = await createPixCharge({
      userId: user.id,
      productType: product_type,
      value,
      description: PRODUCT_DESCRIPTIONS[product_type as ProductType],
      couponCode: coupon_code?.trim(),
      gaClientId: getGaClientIdFromRequest(request),
    });

    return new Response(
      JSON.stringify({
        chargeId:      result.chargeId,
        pixCopiaECola: result.pixCopiaECola,
        qrCodeImage:   result.qrCodeImage,
        expiresAt:     result.expirationDate,
        originalCents,
        finalCents,
        originalFormatted: formatBRL(originalCents),
        finalFormatted:    formatBRL(finalCents),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[create-pix] Erro:', detail);

    // Registra erro crítico de checkout PIX no monitor
    await logError({
      type: 'checkout_pix',
      severity: 'critical',
      userId: user?.id,
      message: detail,
      details: { provider: 'asaas' },
    });

    return new Response(
      JSON.stringify({ error: 'Erro ao gerar cobrança PIX. Tente novamente.', detail }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
