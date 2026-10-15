import type { ProductType } from '../../shared/product-labels';
import type { DiscountSource, PricingDisplay } from '../../shared/pricing-display';
import {
  applyDiscountCents,
  applyPromotionDiscount,
  type ActivePromotion,
  type HqCouponValidation,
  formatBRL,
  promotionAppliesToProduct,
  resolveHqCouponDiscount,
} from '../payments/promo-math';
import { clampPriceCents, resolveExclusiveDiscount, type DiscountCandidate } from './discount-resolution';
import { formatPromoValidUntilLabel } from './format-validity';

export const FALLBACK_PRODUCT_PRICES: Record<
  ProductType,
  { baseCents: number; minCents: number; label: string }
> = {
  nome_social: { baseCents: 9800, minCents: 100, label: 'Nome Social' },
  nome_bebe: { baseCents: 8000, minCents: 100, label: 'Nome de Bebê' },
  nome_empresa: { baseCents: 12500, minCents: 100, label: 'Nome Empresarial' },
};

export interface ProductPriceRow {
  product_type: ProductType;
  base_cents: number;
  min_cents: number;
  label: string;
  is_active: boolean;
}

export interface GetEffectivePriceInput {
  productType: ProductType;
  now?: Date;
  couponValidation?: HqCouponValidation | null;
  promotion?: ActivePromotion | null;
  productRow?: ProductPriceRow | null;
  /** Renovação: só preço base, sem promo/cupom */
  renewalTablePrice?: boolean;
}

export interface EffectivePriceResult extends PricingDisplay {
  /** Alias snake_case para checkout/metadata */
  base_cents: number;
  final_cents: number;
  min_cents: number;
  promo_id: string | null;
  promo_ends_at: string | null;
  formatted: string;
}

function rowOrFallback(productType: ProductType, row?: ProductPriceRow | null) {
  if (row && row.is_active !== false) {
    return {
      baseCents: row.base_cents,
      minCents: row.min_cents,
      label: row.label,
    };
  }
  const fb = FALLBACK_PRODUCT_PRICES[productType];
  return { baseCents: fb.baseCents, minCents: fb.minCents, label: fb.label };
}

export function computeEffectivePricePure(input: GetEffectivePriceInput): EffectivePriceResult {
  const now = input.now ?? new Date();
  const { baseCents, minCents } = rowOrFallback(input.productType, input.productRow);

  if (input.renewalTablePrice) {
    const finalCents = clampPriceCents(baseCents, minCents);
    return toResult({
      productType: input.productType,
      baseCents,
      minCents,
      finalCents,
      discountSource: 'none',
      promoId: null,
      promoCode: null,
      promoEndsAt: null,
      now,
    });
  }

  const candidates: DiscountCandidate[] = [];

  const promotion = input.promotion;
  if (promotion && promotionAppliesToProduct(promotion, input.productType)) {
    const promoFinal = applyPromotionDiscount(baseCents, promotion);
    candidates.push({
      source: 'promotion',
      finalCents: promoFinal,
      promoId: promotion.id,
      promoEndsAt: promotion.endDate,
    });
  }

  const coupon = input.couponValidation;
  if (coupon?.valid) {
    const couponFinal = resolveHqCouponDiscount(coupon, baseCents);
    if (couponFinal !== null) {
      candidates.push({
        source: 'coupon',
        finalCents: couponFinal,
        promoCode: coupon.code ?? null,
      });
    }
  }

  const resolved = resolveExclusiveDiscount(baseCents, candidates);
  const finalCents = clampPriceCents(resolved.finalCents, minCents);

  const winner = resolved.winner;
  const promoId = resolved.discountSource === 'promotion' ? (winner?.promoId ?? null) : null;
  const promoCode = resolved.discountSource === 'coupon' ? (winner?.promoCode ?? null) : null;
  const promoEndsAt =
    resolved.discountSource === 'promotion' ? (winner?.promoEndsAt ?? promotion?.endDate ?? null) : null;

  return toResult({
    productType: input.productType,
    baseCents,
    minCents,
    finalCents,
    discountSource: resolved.discountSource,
    promoId,
    promoCode,
    promoEndsAt,
    now,
  });
}

function toResult(params: {
  productType: ProductType;
  baseCents: number;
  minCents: number;
  finalCents: number;
  discountSource: DiscountSource;
  promoId: string | null;
  promoCode: string | null;
  promoEndsAt: string | null;
  now: Date;
}): EffectivePriceResult {
  const hasDiscount = params.finalCents < params.baseCents;
  const validUntilLabel =
    hasDiscount && params.discountSource === 'promotion'
      ? formatPromoValidUntilLabel(params.promoEndsAt, params.now)
      : null;

  const baseFormatted = formatBRL(params.baseCents);
  const finalFormatted = formatBRL(params.finalCents);

  const display: PricingDisplay = {
    productType: params.productType,
    baseCents: params.baseCents,
    finalCents: params.finalCents,
    minCents: params.minCents,
    baseFormatted,
    finalFormatted,
    promoId: params.promoId,
    promoCode: params.promoCode,
    promoEndsAt: params.promoEndsAt,
    discountSource: params.discountSource,
    hasDiscount,
    validUntilLabel,
  };

  return {
    ...display,
    base_cents: params.baseCents,
    final_cents: params.finalCents,
    min_cents: params.minCents,
    promo_id: params.promoId,
    promo_ends_at: params.promoEndsAt,
    formatted: finalFormatted,
  };
}

/** Valida se um desconto deixaria o valor abaixo do piso (antes do clamp). */
export function discountedCentsViolatesFloor(
  baseCents: number,
  minCents: number,
  discountType: 'percent' | 'fixed',
  discountValue: number,
): boolean {
  const after = applyDiscountCents(baseCents, discountType, discountValue);
  return after < minCents || after <= 0;
}

export function effectiveFinalBelowFloor(finalCents: number, minCents: number): boolean {
  return finalCents < minCents || finalCents <= 0;
}
