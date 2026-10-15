import type { ProductType } from './product-labels';

/** Como cupom e promoção interagem — alterável em um só lugar (DEV-178). */
export const DISCOUNT_EXCLUSIVE_RULE = 'lowest_wins' as const;

export type DiscountSource = 'none' | 'promotion' | 'coupon';

export interface PricingDisplay {
  productType: ProductType;
  baseCents: number;
  finalCents: number;
  minCents: number;
  baseFormatted: string;
  finalFormatted: string;
  promoId: string | null;
  promoCode: string | null;
  promoEndsAt: string | null;
  discountSource: DiscountSource;
  hasDiscount: boolean;
  /** "até dd/mm" em America/Sao_Paulo quando promo ativa com ends_at */
  validUntilLabel: string | null;
}
