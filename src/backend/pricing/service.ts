import type { ProductType } from '../../shared/product-labels';
import { SELLABLE_PRODUCT_TYPES } from '../../shared/product-labels';
import type { ActivePromotion, HqCouponValidation, HqPricesResponse, PriceInfo } from '../payments/promo-math';
import { fetchActivePromotion, fetchAllPromotionRowsForSelect, pickActivePromotion } from './promotions-db';
import {
  computeEffectivePricePure,
  type EffectivePriceResult,
  type ProductPriceRow,
} from './effective-price';
import { fetchProductPriceMap, fallbackRow } from './product-prices-db';

export type { EffectivePriceResult };

function effectiveToPriceInfo(effective: EffectivePriceResult): PriceInfo {
  const hasDiscount = effective.hasDiscount;
  return {
    cents: effective.final_cents,
    formatted: hasDiscount ? effective.baseFormatted : effective.finalFormatted,
    baseCents: effective.base_cents,
    baseFormatted: effective.baseFormatted,
    hasDiscount,
    ...(hasDiscount
      ? {
          discountedCents: effective.final_cents,
          discountedFormatted: effective.finalFormatted,
        }
      : {}),
    promoEndsAt: effective.promo_ends_at,
    validUntilLabel: effective.validUntilLabel,
    discountSource: effective.discountSource,
    promoId: effective.promo_id,
    minCents: effective.min_cents,
  };
}

export async function getEffectivePriceCore(params: {
  productType: ProductType;
  now?: Date;
  couponValidation?: HqCouponValidation | null;
  renewalTablePrice?: boolean;
  priceMap?: Map<ProductType, ProductPriceRow>;
  productRow?: ProductPriceRow | null;
  promotion?: ActivePromotion | null;
}): Promise<EffectivePriceResult> {
  const now = params.now ?? new Date();
  const priceMap = params.priceMap ?? (await fetchProductPriceMap());
  const productRow =
    params.productRow ?? priceMap.get(params.productType) ?? fallbackRow(params.productType);

  let promotion = params.promotion;
  if (promotion === undefined && !params.renewalTablePrice) {
    try {
      promotion = await fetchActivePromotion(now);
    } catch {
      promotion = null;
    }
  }

  return computeEffectivePricePure({
    productType: params.productType,
    now,
    productRow,
    promotion: promotion ?? null,
    couponValidation: params.couponValidation ?? null,
    renewalTablePrice: params.renewalTablePrice,
  });
}

export async function getCatalogPricing(now = new Date()): Promise<HqPricesResponse> {
  const priceMap = await fetchProductPriceMap();
  let promotion: ActivePromotion | null = null;

  try {
    const rows = await fetchAllPromotionRowsForSelect();
    promotion = pickActivePromotion(rows, now);
  } catch {
    promotion = null;
  }

  const prices: Record<string, PriceInfo> = {};
  for (const productType of SELLABLE_PRODUCT_TYPES) {
    const effective = computeEffectivePricePure({
      productType,
      now,
      productRow: priceMap.get(productType) ?? fallbackRow(productType),
      promotion,
    });
    prices[productType] = effectiveToPriceInfo(effective);
  }

  return { prices, promotion };
}

export function effectiveResultToPriceInfo(result: EffectivePriceResult): PriceInfo {
  return effectiveToPriceInfo(result);
}

/** Cabeçalho Cache-Control para páginas com preço (≤ 60 s). */
export function pricingCacheControlHeader(): string {
  return 'public, s-maxage=60, stale-while-revalidate=120';
}
