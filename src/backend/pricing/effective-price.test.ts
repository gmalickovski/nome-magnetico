import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeEffectivePricePure,
  discountedCentsViolatesFloor,
  FALLBACK_PRODUCT_PRICES,
} from './effective-price';
import { resolveExclusiveDiscount } from './discount-resolution';
import { formatPromoValidUntilLabel } from './format-validity';
import type { ActivePromotion } from '../payments/promo-math';

const baseRow = {
  product_type: 'nome_social' as const,
  base_cents: 9800,
  min_cents: 1000,
  label: 'Nome Social',
  is_active: true,
};

const percentPromo = (value: number, endsAt: string): ActivePromotion => ({
  id: 'promo-1',
  name: 'Teste',
  bannerText: null,
  productType: 'nome_social',
  discountType: 'percent',
  discountValue: value,
  endDate: endsAt,
  stripeCouponId: null,
  stripePromoCode: null,
});

describe('computeEffectivePricePure', () => {
  it('sem promo nem cupom devolve base', () => {
    const r = computeEffectivePricePure({ productType: 'nome_social', productRow: baseRow });
    assert.equal(r.base_cents, 9800);
    assert.equal(r.final_cents, 9800);
    assert.equal(r.discountSource, 'none');
    assert.equal(r.hasDiscount, false);
  });

  it('promo percentual ativa reduz preço', () => {
    const ends = new Date(Date.now() + 86400000).toISOString();
    const r = computeEffectivePricePure({
      productType: 'nome_social',
      productRow: baseRow,
      promotion: percentPromo(20, ends),
    });
    assert.equal(r.final_cents, 7840);
    assert.equal(r.discountSource, 'promotion');
    assert.equal(r.promo_id, 'promo-1');
    assert.ok(r.validUntilLabel?.startsWith('até '));
  });

  it('promo fixed em centavos (via ActivePromotion BRL)', () => {
    const ends = new Date(Date.now() + 86400000).toISOString();
    const r = computeEffectivePricePure({
      productType: 'nome_social',
      productRow: baseRow,
      promotion: {
        ...percentPromo(0, ends),
        discountType: 'fixed',
        discountValue: 20,
      },
    });
    assert.equal(r.final_cents, 7800);
  });

  it('promo expirada não aplica (caller passa null)', () => {
    const r = computeEffectivePricePure({
      productType: 'nome_social',
      productRow: baseRow,
      promotion: null,
    });
    assert.equal(r.final_cents, 9800);
  });

  it('cupom válido menor que promo usa cupom', () => {
    const ends = new Date(Date.now() + 86400000).toISOString();
    const r = computeEffectivePricePure({
      productType: 'nome_social',
      productRow: baseRow,
      promotion: percentPromo(10, ends),
      couponValidation: {
        valid: true,
        code: 'SAVE30',
        discountedCents: 6860,
        originalCents: 9800,
      },
    });
    assert.equal(r.final_cents, 6860);
    assert.equal(r.discountSource, 'coupon');
    assert.equal(r.promoCode, 'SAVE30');
  });

  it('promo menor que cupom usa promo', () => {
    const ends = new Date(Date.now() + 86400000).toISOString();
    const r = computeEffectivePricePure({
      productType: 'nome_social',
      productRow: baseRow,
      promotion: percentPromo(30, ends),
      couponValidation: {
        valid: true,
        code: 'SAVE10',
        discountedCents: 8820,
        originalCents: 9800,
      },
    });
    assert.equal(r.final_cents, 6860);
    assert.equal(r.discountSource, 'promotion');
  });

  it('nunca abaixo de min_cents', () => {
    const ends = new Date(Date.now() + 86400000).toISOString();
    const r = computeEffectivePricePure({
      productType: 'nome_social',
      productRow: baseRow,
      promotion: percentPromo(99, ends),
    });
    assert.equal(r.final_cents, 1000);
  });

  it('renovação usa só tabela', () => {
    const ends = new Date(Date.now() + 86400000).toISOString();
    const r = computeEffectivePricePure({
      productType: 'nome_social',
      productRow: baseRow,
      renewalTablePrice: true,
      promotion: percentPromo(50, ends),
      couponValidation: { valid: true, discountedCents: 100, originalCents: 9800 },
    });
    assert.equal(r.final_cents, 9800);
  });

  it('fallback quando sem linha no banco', () => {
    const r = computeEffectivePricePure({ productType: 'nome_bebe' });
    assert.equal(r.base_cents, FALLBACK_PRODUCT_PRICES.nome_bebe.baseCents);
  });
});

describe('resolveExclusiveDiscount', () => {
  it('empate favorece promoção', () => {
    const r = resolveExclusiveDiscount(9800, [
      { source: 'coupon', finalCents: 7840, promoCode: 'X' },
      { source: 'promotion', finalCents: 7840, promoId: 'p1' },
    ]);
    assert.equal(r.discountSource, 'promotion');
  });
});

describe('discountedCentsViolatesFloor', () => {
  it('detecta desconto abaixo do piso', () => {
    assert.equal(discountedCentsViolatesFloor(9800, 5000, 'percent', 60), true);
    assert.equal(discountedCentsViolatesFloor(9800, 100, 'percent', 50), false);
  });
});

describe('formatPromoValidUntilLabel', () => {
  it('formata data futura', () => {
    const end = '2026-12-25T15:00:00.000Z';
    const label = formatPromoValidUntilLabel(end, new Date('2026-01-01T12:00:00.000Z'));
    assert.match(label ?? '', /^até \d{2}\/\d{2}$/);
  });

  it('retorna null para promo passada', () => {
    assert.equal(formatPromoValidUntilLabel('2020-01-01T00:00:00.000Z'), null);
  });
});
