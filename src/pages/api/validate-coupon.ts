import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getEffectivePrice, getPricesAndPromo, formatBRL } from '../../backend/payments/prices';
import { SELLABLE_PRODUCT_TYPES } from '../../shared/product-labels';
import { supabase } from '../../backend/db/supabase';
import {
  getClientIp,
  hashClientIp,
  enforceApiRateLimits,
} from '../../backend/security/apiRateLimit';

const schema = z.object({
  coupon_code:  z.string().min(1),
  product_type: z.enum(SELLABLE_PRODUCT_TYPES),
});

const FALLBACK_CENTS: Record<string, number> = {
  nome_social:   9800,
  nome_bebe:     8000,
  nome_empresa: 12500,
};

// 10 requisições por 10 minutos por usuário; 30 por 10 minutos por IP
const USER_COUPON_LIMIT = 10;
const IP_COUPON_LIMIT = 30;
const COUPON_WINDOW_SECONDS = 10 * 60;

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const user = locals.user;
  if (!user) {
    return json({ valid: false, error: 'Faça login para validar o cupom' }, 401);
  }

  const clientIp = getClientIp(request, clientAddress);
  const ipHash = hashClientIp(clientIp);

  const rateLimitResult = await enforceApiRateLimits(
    supabase,
    [
      {
        key: `coupon:user:${user.id}`,
        limit: USER_COUPON_LIMIT,
        windowSeconds: COUPON_WINDOW_SECONDS,
      },
      {
        key: `coupon:ip:${ipHash}`,
        limit: IP_COUPON_LIMIT,
        windowSeconds: COUPON_WINDOW_SECONDS,
      },
    ],
    `coupon:${user.id}`
  );

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        valid: false,
        error: 'Você realizou muitas tentativas de validação de cupom. Aguarde alguns minutos antes de tentar novamente.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
        },
      }
    );
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

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
