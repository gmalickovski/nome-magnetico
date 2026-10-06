import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyDiscountCents,
  applyPromotionDiscount,
  applyPromotionToPrices,
  COUPON_ALREADY_USED,
  COUPON_INVALID,
  COUPON_MAX_USES,
  COUPON_WRONG_PRODUCT,
  evaluateCoupon,
  evaluateTrial,
  normalizeAccessCode,
  pricesWithoutPromotion,
  resolveHqCouponDiscount,
  selectActivePromotion,
  toActivePromotion,
  TRIAL_ALREADY_USED,
  TRIAL_INVALID,
  TRIAL_MAX_USES,
  type AccessCodeRow,
  type PriceInfo,
  type PromotionRow,
} from './promo-math';

const NOW = new Date('2026-10-06T15:00:00.000Z');

function promo(overrides: Partial<PromotionRow> = {}): PromotionRow {
  return {
    id: 'promo-1',
    name: 'Lua Cheia',
    product_types: [],
    discount_type: 'percent',
    discount_value: 20,
    starts_at: '2026-10-01T00:00:00.000Z',
    ends_at: '2026-10-31T23:59:59.000Z',
    is_active: true,
    banner_text: '20% na Lua Cheia',
    stripe_coupon_id: 'coupon_lua',
    stripe_promo_code: 'LUACHEIA',
    created_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

function coupon(overrides: Partial<AccessCodeRow> = {}): AccessCodeRow {
  return {
    id: 'code-1',
    code: 'DEHB-W6KS-RZY6',
    kind: 'coupon',
    product_types: [],
    trial_days: null,
    discount_type: 'percent',
    discount_value: 15,
    expires_at: '2026-12-01T00:00:00.000Z',
    is_active: true,
    max_uses: 10,
    stripe_coupon_id: 'coupon_dehb',
    stripe_promo_code_id: 'promo_dehb',
    note: 'Parceiros',
    ...overrides,
  };
}

function trial(overrides: Partial<AccessCodeRow> = {}): AccessCodeRow {
  return {
    id: 'trial-1',
    code: 'TESTE7',
    kind: 'trial',
    product_types: ['nome_social'],
    trial_days: 7,
    discount_type: null,
    discount_value: null,
    expires_at: '2026-12-01T00:00:00.000Z',
    is_active: true,
    max_uses: 3,
    ...overrides,
  };
}

const catalog: Record<string, PriceInfo> = {
  nome_social: { cents: 9800, formatted: 'R$ 98,00', hasDiscount: false, productId: 'prod_social' },
  nome_bebe: { cents: 8000, formatted: 'R$ 80,00', hasDiscount: false },
};

describe('promoções ativas', () => {
  it('escolhe a promoção ativa mais recente dentro da janela', () => {
    const selected = selectActivePromotion(
      [
        promo({ id: 'old', created_at: '2026-08-01T00:00:00.000Z', discount_value: 10 }),
        promo({ id: 'new', created_at: '2026-09-15T00:00:00.000Z', discount_value: 25 }),
      ],
      NOW,
    );
    assert.equal(selected?.id, 'new');
    assert.equal(selected?.discount_value, 25);
  });

  it('ignora promoção inativa', () => {
    assert.equal(selectActivePromotion([promo({ is_active: false })], NOW), null);
  });

  it('ignora promoção fora da janela', () => {
    assert.equal(
      selectActivePromotion(
        [promo({ starts_at: '2026-11-01T00:00:00.000Z', ends_at: '2026-11-30T00:00:00.000Z' })],
        NOW,
      ),
      null,
    );
    assert.equal(
      selectActivePromotion(
        [promo({ starts_at: '2026-08-01T00:00:00.000Z', ends_at: '2026-09-01T00:00:00.000Z' })],
        NOW,
      ),
      null,
    );
  });

  it('aplica percentual e devolve BRL no contrato público de fixed', () => {
    const percent = toActivePromotion(promo());
    const priced = applyPromotionToPrices(catalog, percent);
    assert.equal(priced.nome_social.discountedCents, 7840);
    assert.equal(priced.nome_social.hasDiscount, true);

    const fixed = toActivePromotion(promo({ discount_type: 'fixed', discount_value: 2000 }));
    assert.equal(fixed.discountValue, 20);
    assert.equal(applyPromotionDiscount(9800, fixed), 7800);
    assert.equal(applyDiscountCents(9800, 'fixed', 2000), 7800);
  });

  it('lista vazia de produtos vale para todos; lista restrita respeita o produto', () => {
    const all = toActivePromotion(promo({ product_types: [] }));
    const onlySocial = toActivePromotion(promo({ product_types: ['nome_social'] }));
    const allPrices = applyPromotionToPrices(catalog, all);
    const restricted = applyPromotionToPrices(catalog, onlySocial);
    assert.equal(allPrices.nome_bebe.hasDiscount, true);
    assert.equal(restricted.nome_bebe.hasDiscount, false);
    assert.equal(restricted.nome_social.hasDiscount, true);
  });
});

describe('cupom', () => {
  it('normaliza hífen e caixa', () => {
    assert.equal(normalizeAccessCode('dehb-w6ks-rzy6'), 'DEHBW6KSRZY6');
    assert.equal(normalizeAccessCode(' DEHBW6KSRZY6 '), 'DEHBW6KSRZY6');
  });

  it('aceita cupom percentual válido', () => {
    const result = evaluateCoupon(coupon(), {
      productType: 'nome_social',
      originalCents: 9800,
      usedByHolder: false,
      useCount: 1,
      now: NOW,
    });
    assert.equal(result.valid, true);
    assert.equal(result.discountedCents, 8330);
    assert.equal(result.discountPercent, 15);
    assert.equal(result.stripePromoCodeId, 'promo_dehb');
  });

  it('aceita cupom fixed em centavos e devolve discountAmountBrl em reais', () => {
    const result = evaluateCoupon(
      coupon({ discount_type: 'fixed', discount_value: 1500 }),
      {
        productType: 'nome_social',
        originalCents: 9800,
        usedByHolder: false,
        useCount: 0,
        now: NOW,
      },
    );
    assert.equal(result.valid, true);
    assert.equal(result.discountedCents, 8300);
    assert.equal(result.discountAmountBrl, 15);
    assert.equal(resolveHqCouponDiscount(result, 9800), 8300);
  });

  it('rejeita cupom inexistente, inativo ou expirado', () => {
    assert.equal(evaluateCoupon(null, { productType: 'nome_social', usedByHolder: false, useCount: 0, now: NOW }).error, COUPON_INVALID);
    assert.equal(
      evaluateCoupon(coupon({ is_active: false }), { productType: 'nome_social', usedByHolder: false, useCount: 0, now: NOW }).error,
      COUPON_INVALID,
    );
    assert.equal(
      evaluateCoupon(coupon({ expires_at: '2026-01-01T00:00:00.000Z' }), {
        productType: 'nome_social',
        usedByHolder: false,
        useCount: 0,
        now: NOW,
      }).error,
      COUPON_INVALID,
    );
  });

  it('rejeita produto, limite e já usado', () => {
    assert.equal(
      evaluateCoupon(coupon({ product_types: ['nome_bebe'] }), {
        productType: 'nome_social',
        usedByHolder: false,
        useCount: 0,
        now: NOW,
      }).error,
      COUPON_WRONG_PRODUCT,
    );
    assert.equal(
      evaluateCoupon(coupon({ max_uses: 2 }), {
        productType: 'nome_social',
        usedByHolder: false,
        useCount: 2,
        now: NOW,
      }).error,
      COUPON_MAX_USES,
    );
    assert.equal(
      evaluateCoupon(coupon(), {
        productType: 'nome_social',
        usedByHolder: true,
        useCount: 1,
        now: NOW,
      }).error,
      COUPON_ALREADY_USED,
    );
  });

  it('max_uses nulo é ilimitado', () => {
    const result = evaluateCoupon(coupon({ max_uses: null }), {
      productType: 'nome_social',
      originalCents: 9800,
      usedByHolder: false,
      useCount: 999,
      now: NOW,
    });
    assert.equal(result.valid, true);
  });
});

describe('trial', () => {
  it('aceita trial ativo e usa dias/produtos do banco', () => {
    const result = evaluateTrial(trial(), { usedByHolder: false, useCount: 0, now: NOW });
    assert.equal(result.valid, true);
    assert.equal(result.trialDays, 7);
    assert.deepEqual(result.productTypes, ['nome_social']);
  });

  it('rejeita trial inválido, já usado e no limite', () => {
    assert.equal(evaluateTrial(null, { usedByHolder: false, useCount: 0, now: NOW }).error, TRIAL_INVALID);
    assert.equal(evaluateTrial(trial({ kind: 'coupon' }), { usedByHolder: false, useCount: 0, now: NOW }).error, TRIAL_INVALID);
    assert.equal(evaluateTrial(trial(), { usedByHolder: true, useCount: 1, now: NOW }).error, TRIAL_ALREADY_USED);
    assert.equal(evaluateTrial(trial({ max_uses: 1 }), { usedByHolder: false, useCount: 1, now: NOW }).error, TRIAL_MAX_USES);
  });

  it('gift também vale como trial', () => {
    const result = evaluateTrial(trial({ kind: 'gift', trial_days: 30 }), { usedByHolder: false, useCount: 0, now: NOW });
    assert.equal(result.valid, true);
    assert.equal(result.kind, 'gift');
    assert.equal(result.trialDays, 30);
  });
});

describe('redeem idempotente e fallback Stripe', () => {
  it('já usado continua inválido na revalidação (webhook 409 sem quebrar)', () => {
    const first = evaluateCoupon(coupon(), {
      productType: 'nome_social',
      usedByHolder: false,
      useCount: 0,
      now: NOW,
    });
    const second = evaluateCoupon(coupon(), {
      productType: 'nome_social',
      usedByHolder: true,
      useCount: 1,
      now: NOW,
    });
    assert.equal(first.valid, true);
    assert.equal(second.valid, false);
    assert.equal(second.error, COUPON_ALREADY_USED);
  });

  it('falha no banco devolve preços Stripe sem promoção', () => {
    const fallback = pricesWithoutPromotion({
      nome_social: { cents: 9800, formatted: 'R$ 98,00', hasDiscount: true, discountedCents: 7840 },
    });
    assert.equal(fallback.promotion, null);
    assert.equal(fallback.prices.nome_social.hasDiscount, false);
    assert.equal(fallback.prices.nome_social.discountedCents, undefined);
  });
});
