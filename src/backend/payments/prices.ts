/**
 * Busca preços e promoção ativa via API pública do HQ.
 * Fallback: busca preços diretamente do Stripe se HQ estiver indisponível.
 */

import { stripe } from './stripe';
import type { ProductType } from './stripe';

export interface StripePrices {
  nome_social: string;
  nome_bebe: string;
  nome_empresa: string;
}

export interface PriceInfo {
  cents: number;
  formatted: string;
  priceId?: string;
  productId?: string;
  productName?: string;
  discountedCents?: number;
  discountedFormatted?: string;
  hasDiscount: boolean;
}

export interface ActivePromotion {
  id: string;
  name: string;
  bannerText: string | null;
  productType: string | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  endDate: string;
  stripeCouponId: string | null;
  stripePromoCode: string | null;
}

export interface HqCouponValidation {
  valid: boolean;
  error?: string;
  code?: string;
  description?: string | null;
  productTypes?: string[];
  stripeCouponId?: string | null;
  stripePromoCodeId?: string | null;
  discountPercent?: number | null;
  discountAmountBrl?: number | null;
  originalCents?: number;
  discountedCents?: number;
  discountLabel?: string;
}

export interface HqPricesResponse {
  prices: Record<string, PriceInfo>;
  promotion: ActivePromotion | null;
}

export function resolveHqCouponDiscount(
  coupon: HqCouponValidation | null | undefined,
  originalCents: number
): number | null {
  if (!coupon?.valid) return null;
  if (typeof coupon.discountedCents === 'number') {
    return Math.max(0, Math.round(coupon.discountedCents));
  }
  if (typeof coupon.discountPercent === 'number' && coupon.discountPercent > 0) {
    return Math.max(0, Math.round(originalCents * (1 - coupon.discountPercent / 100)));
  }
  if (typeof coupon.discountAmountBrl === 'number' && coupon.discountAmountBrl > 0) {
    return Math.max(0, Math.round(originalCents - coupon.discountAmountBrl * 100));
  }
  return null;
}

// Fallback — IDs de preço individuais caso HQ esteja offline
const PRICE_IDS: Record<ProductType, string> = {
  nome_social:  process.env.STRIPE_PRICE_NOME_SOCIAL  ?? '',
  nome_bebe:    process.env.STRIPE_PRICE_NOME_BEBE    ?? '',
  nome_empresa: process.env.STRIPE_PRICE_NOME_EMPRESA ?? '',
};

function formatBRL(unitAmount: number | null): string {
  if (unitAmount == null) return '';
  return `R$ ${(unitAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function promotionProductTypes(promotion?: ActivePromotion | null): ProductType[] {
  return String(promotion?.productType ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is ProductType =>
      item === 'nome_social' || item === 'nome_bebe' || item === 'nome_empresa'
    );
}

export function promotionAppliesToProduct(promotion: ActivePromotion | null | undefined, productType: ProductType): boolean {
  const products = promotionProductTypes(promotion);
  return products.length === 0 || products.includes(productType);
}

export async function validateHqAccessCoupon(params: {
  couponCode: string;
  productType: ProductType;
  userId?: string | null;
  userEmail?: string | null;
  originalCents?: number | null;
  saasId?: string;
}): Promise<HqCouponValidation | null> {
  const hqUrl = process.env.HQ_API_URL;
  if (!hqUrl) return null;

  const res = await fetch(`${hqUrl}/access-codes/validate-coupon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(5000),
    body: JSON.stringify({
      saasId: params.saasId ?? 'nome-magnetico',
      couponCode: params.couponCode,
      productType: params.productType,
      userId: params.userId,
      userEmail: params.userEmail,
      originalCents: params.originalCents,
    }),
  });

  return await res.json() as HqCouponValidation;
}

export async function recordHqAccessCouponUse(params: {
  couponCode?: string | null;
  productType: ProductType;
  userId: string;
  userEmail?: string | null;
  saasId?: string;
}): Promise<void> {
  const hqUrl = process.env.HQ_API_URL;
  const couponCode = params.couponCode?.trim();
  if (!hqUrl || !couponCode) return;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.HQ_INTERNAL_TOKEN) {
    headers['x-hq-internal-token'] = process.env.HQ_INTERNAL_TOKEN;
  }

  const res = await fetch(`${hqUrl}/access-codes/redeem-coupon`, {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(5000),
    body: JSON.stringify({
      saasId: params.saasId ?? 'nome-magnetico',
      couponCode,
      productType: params.productType,
      userId: params.userId,
      userEmail: params.userEmail,
    }),
  });

  if (!res.ok && res.status !== 400 && res.status !== 404 && res.status !== 409) {
    const text = await res.text();
    throw new Error(`Falha ao registrar uso do cupom no HQ: ${text}`);
  }
}

/** Busca preços + promoção ativa via HQ (preferido) ou Stripe (fallback) */
export async function recordHqAccessTrialUse(params: {
  trialCode?: string | null;
  productType?: string | null;
  userId: string;
  userEmail?: string | null;
  saasId?: string;
}): Promise<void> {
  const hqUrl = process.env.HQ_API_URL;
  const trialCode = params.trialCode?.trim();
  if (!hqUrl || !trialCode) return;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.HQ_INTERNAL_TOKEN) {
    headers['x-hq-internal-token'] = process.env.HQ_INTERNAL_TOKEN;
  }

  const res = await fetch(`${hqUrl}/access-codes/redeem-trial`, {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(5000),
    body: JSON.stringify({
      saasId: params.saasId ?? 'nome-magnetico',
      trialCode,
      productType: params.productType,
      userId: params.userId,
      userEmail: params.userEmail,
    }),
  });

  if (!res.ok && res.status !== 400 && res.status !== 404 && res.status !== 409) {
    const text = await res.text();
    throw new Error(`Falha ao registrar uso do trial no HQ: ${text}`);
  }
}

export async function getHqPricesAndPromo(saasId = 'nome-magnetico'): Promise<HqPricesResponse> {
  const hqUrl = process.env.HQ_API_URL;
  if (hqUrl) {
    try {
      const res = await fetch(`${hqUrl}/promotions/public?saasId=${saasId}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        return await res.json() as HqPricesResponse;
      }
    } catch {
      // HQ indisponível → fallback Stripe abaixo
    }
  }

  // Fallback: busca preços diretamente do Stripe sem promoção
  const prices: Record<string, PriceInfo> = {};
  const ids = Object.values(PRICE_IDS).filter(Boolean);
  if (ids.length > 0) {
    const [nm, nb, ne] = await Promise.all([
      PRICE_IDS.nome_social  ? stripe.prices.retrieve(PRICE_IDS.nome_social)  : null,
      PRICE_IDS.nome_bebe    ? stripe.prices.retrieve(PRICE_IDS.nome_bebe)    : null,
      PRICE_IDS.nome_empresa ? stripe.prices.retrieve(PRICE_IDS.nome_empresa) : null,
    ]);
    if (nm) prices.nome_social  = { cents: nm.unit_amount ?? 0, formatted: formatBRL(nm.unit_amount), hasDiscount: false };
    if (nb) prices.nome_bebe    = { cents: nb.unit_amount ?? 0, formatted: formatBRL(nb.unit_amount), hasDiscount: false };
    if (ne) prices.nome_empresa = { cents: ne.unit_amount ?? 0, formatted: formatBRL(ne.unit_amount), hasDiscount: false };
  }

  return { prices, promotion: null };
}

/** Compatibilidade retroativa — retorna apenas strings de preço */
export async function getStripePrices(): Promise<StripePrices> {
  const FALLBACK: StripePrices = { nome_social: 'R$ 98,00', nome_bebe: 'R$ 80,00', nome_empresa: 'R$ 125,00' };
  try {
    const { prices } = await getHqPricesAndPromo();
    return {
      nome_social:  prices.nome_social?.formatted  || FALLBACK.nome_social,
      nome_bebe:    prices.nome_bebe?.formatted    || FALLBACK.nome_bebe,
      nome_empresa: prices.nome_empresa?.formatted || FALLBACK.nome_empresa,
    };
  } catch {
    return FALLBACK;
  }
}
