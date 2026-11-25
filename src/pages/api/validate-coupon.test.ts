import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { ActivePromotion, HqCouponValidation } from '../../backend/payments/promo-math';
import { formatBRL } from '../../backend/payments/promo-math';
import { computeEffectivePricePure } from '../../backend/pricing/effective-price';

let coupon: HqCouponValidation | null;
let promotion: ActivePromotion | null;

mock.module('../../backend/db/supabase', { namedExports: { supabase: {} } });
mock.module('../../backend/security/apiRateLimit', {
  namedExports: {
    getClientIp: () => '127.0.0.1',
    hashClientIp: () => 'test',
    enforceApiRateLimits: async () => ({ allowed: true }),
  },
});
mock.module('../../backend/payments/prices', {
  namedExports: { formatBRL, validateAccessCoupon: async () => coupon },
});
mock.module('../../backend/pricing/service', {
  namedExports: {
    getEffectivePriceCore: async (input: Parameters<typeof computeEffectivePricePure>[0]) =>
      computeEffectivePricePure({ ...input, promotion }),
  },
});

const { POST } = await import('./validate-coupon');

async function quote() {
  return POST({
    request: new Request('http://localhost/api/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ coupon_code: 'LINK', product_type: 'nome_social' }),
    }),
    locals: { user: { id: 'test-user', email: 'buyer@example.com' } },
    clientAddress: '127.0.0.1',
  } as Parameters<typeof POST>[0]);
}

describe('prévia de cupom do checkout', () => {
  beforeEach(() => {
    coupon = { valid: true, code: 'LINK', discountPercent: 20 };
    promotion = null;
  });

  it('mostra o desconto e o piso calculados pelo mesmo motor do checkout', async () => {
    assert.deepEqual(await (await quote()).json(), {
      valid: true, applied: true, originalCents: 9800, discountedCents: 7840,
      originalFormatted: formatBRL(9800), discountedFormatted: formatBRL(7840),
      discountLabel: 'Desconto aplicado', promotionName: 'LINK',
    });
    coupon = { valid: true, code: 'LINK', discountPercent: 100 };
    assert.equal((await (await quote()).json()).discountedCents, 100);
  });

  it('mantém uma promoção mais barata sem somar os descontos', async () => {
    promotion = {
      id: 'promo', name: 'Promoção', bannerText: null, productType: 'nome_social',
      discountType: 'percent', discountValue: 30, endDate: '2099-01-01',
      stripeCouponId: null, stripePromoCode: null,
    };
    const data = await (await quote()).json();
    assert.equal(data.valid, true);
    assert.equal(data.applied, false);
    assert.equal(data.discountedCents, 6860);
  });

  it('repassa o motivo da recusa no modal', async () => {
    coupon = { valid: false, error: 'Cupom não se aplica a este produto' };
    assert.deepEqual(await (await quote()).json(), { valid: false, error: coupon.error });
  });
});
