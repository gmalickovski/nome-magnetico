import { DISCOUNT_EXCLUSIVE_RULE, type DiscountSource } from '../../shared/pricing-display';

export interface DiscountCandidate {
  source: Exclude<DiscountSource, 'none'>;
  finalCents: number;
  promoId?: string | null;
  promoCode?: string | null;
  promoEndsAt?: string | null;
}

/**
 * Cupom e promoção não acumulam: vale o menor preço (regra Growth, DEV-178).
 * Empate: preferência à promoção sazonal.
 */
export function resolveExclusiveDiscount(
  baseCents: number,
  candidates: DiscountCandidate[],
): { finalCents: number; discountSource: DiscountSource; winner: DiscountCandidate | null } {
  if (DISCOUNT_EXCLUSIVE_RULE !== 'lowest_wins') {
    throw new Error(`Regra de desconto não implementada: ${DISCOUNT_EXCLUSIVE_RULE}`);
  }

  let winner: DiscountCandidate | null = null;
  for (const candidate of candidates) {
    if (candidate.finalCents >= baseCents) continue;
    if (!winner) {
      winner = candidate;
      continue;
    }
    if (candidate.finalCents < winner.finalCents) {
      winner = candidate;
    } else if (
      candidate.finalCents === winner.finalCents &&
      candidate.source === 'promotion' &&
      winner.source === 'coupon'
    ) {
      winner = candidate;
    }
  }

  if (!winner) {
    return { finalCents: baseCents, discountSource: 'none', winner: null };
  }

  return {
    finalCents: winner.finalCents,
    discountSource: winner.source,
    winner,
  };
}

export function clampPriceCents(finalCents: number, minCents: number): number {
  const floor = Math.max(1, minCents);
  return Math.max(floor, Math.round(finalCents));
}
