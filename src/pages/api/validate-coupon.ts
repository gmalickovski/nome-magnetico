import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getEffectivePrice, getPricesAndPromo, formatBRL } from '../../backend/payments/prices';
import { SELLABLE_PRODUCT_TYPES } from '../../shared/product-labels';

const schema = z.object({
  coupon_code:  z.string().min(1),
  product_type: z.enum(SELLABLE_PRODUCT_TYPES),
});

const FALLBACK_CENTS: Record<string, number> = {
  nome_social:   9800,
  nome_bebe:     8000,
  nome_empresa: 12500,
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ valid: false, error: 'Faça login para validar o cupom' }, 401);
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return json({ valid: false, error: 'Body inválido' }, 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json({ valid: false, error: 'Dados inválidos' }, 400);
  }

  const { coupon_code, product_type } = parsed.data;
  const code = coupon_code.trim().toUpperCase();

  try {
    const { prices } = await getPricesAndPromo();
    const originalCents =
      prices[product_type]?.baseCents ??
      prices[product_type]?.cents ??
      FALLBACK_CENTS[product_type] ??
      9800;

    const withCoupon = await getEffectivePrice({
      productType: product_type,
      couponCode: code,
      userId: user.id,
      userEmail: user.email,
    });

    if (withCoupon.discountSource === 'coupon' && withCoupon.promoCode) {
      return json({
        valid: true,
        originalCents,
        discountedCents: withCoupon.final_cents,
        originalFormatted: formatBRL(originalCents),
        discountedFormatted: formatBRL(withCoupon.final_cents),
        discountLabel: 'Desconto aplicado',
        promotionName: withCoupon.promoCode,
      });
    }

    return json({ valid: false, error: 'Cupom inválido ou expirado' });
  } catch {
    return json({ valid: false, error: 'Erro ao validar cupom. Tente novamente.' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
