import { PRODUCT_TYPES, SELLABLE_PRODUCT_TYPES, type ProductType } from '../../shared/product-labels';

export const COUPON_INVALID = 'Cupom inválido ou expirado';
export const COUPON_ALREADY_USED = 'Este cupom já foi utilizado';
export const COUPON_WRONG_PRODUCT = 'Cupom não se aplica a este produto';
export const COUPON_MAX_USES = 'Este cupom atingiu o limite de usos';

export const TRIAL_INVALID = 'Código de acesso inválido ou expirado';
export const TRIAL_ALREADY_USED = 'Este código já foi utilizado';
export const TRIAL_WRONG_PRODUCT = 'Este código não se aplica a este produto';
export const TRIAL_MAX_USES = 'Este código atingiu o limite de usos';
export const TRIAL_NOT_FOUND = 'Este código de acesso não é válido ou já expirou.';

export { PRODUCT_TYPES, SELLABLE_PRODUCT_TYPES };

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

export type CouponValidation = HqCouponValidation;
export type PricesResponse = HqPricesResponse;

export interface PromotionRow {
  id: string;
  name: string;
  product_types: string[] | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  banner_text?: string | null;
  stripe_coupon_id?: string | null;
  stripe_promo_code?: string | null;
  created_at?: string;
}

export interface AccessCodeRow {
  id: string;
  code: string;
  kind: 'trial' | 'gift' | 'coupon';
  product_types: string[] | null;
  trial_days: number | null;
  discount_type: 'percent' | 'fixed' | null;
  discount_value: number | null;
  expires_at: string | null;
  is_active: boolean;
  max_uses?: number | null;
  stripe_coupon_id?: string | null;
  stripe_promo_code_id?: string | null;
  note?: string | null;
}

export interface CouponEvalContext {
  productType: ProductType;
  userId?: string | null;
  userEmail?: string | null;
  originalCents?: number | null;
  usedByHolder: boolean;
  useCount: number;
  now?: Date;
}

export interface TrialEvalContext {
  requestedProduct?: string | null;
  usedByHolder: boolean;
  useCount: number;
  now?: Date;
}

export interface TrialValidation {
  valid: boolean;
  error?: string;
  code?: string;
  kind?: 'trial' | 'gift';
  trialDays?: number;
  productTypes?: ProductType[];
  codeId?: string;
}

export function formatBRL(unitAmount: number | null | undefined): string {
  if (unitAmount == null) return '';
  return `R$ ${(unitAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function isProductType(value: string | null | undefined): value is ProductType {
  return value === 'nome_social' || value === 'nome_bebe' || value === 'nome_empresa';
}

export function normalizeAccessCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/-/g, '');
}

export function storedAccessCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function codeProductTypes(row: { product_types?: string[] | null }): ProductType[] {
  return (row.product_types ?? []).filter(isProductType);
}

export function promotionProductTypes(promotion?: ActivePromotion | null): ProductType[] {
  return String(promotion?.productType ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(isProductType);
}

export function promotionAppliesToProduct(
  promotion: ActivePromotion | null | undefined,
  productType: ProductType,
): boolean {
  const products = promotionProductTypes(promotion);
  return products.length === 0 || products.includes(productType);
}

export function codeAppliesToProduct(
  row: { product_types?: string[] | null },
  productType: string | null | undefined,
): boolean {
  const products = codeProductTypes(row);
  if (products.length === 0) return true;
  if (!productType) return true;
  const requested = productType
    .split(',')
    .map((item) => item.trim())
    .filter(isProductType);
  if (requested.length === 0) return true;
  return requested.some((item) => products.includes(item));
}

/**
 * Aplica desconto.
 * percent: `value` é 1–100.
 * fixed: `valueCents` é centavos de BRL (regra do NM / migration 035).
 */
export function applyDiscountCents(
  originalCents: number,
  discountType: 'percent' | 'fixed',
  value: number,
): number {
  if (discountType === 'percent') {
    return Math.max(0, Math.round(originalCents * (1 - value / 100)));
  }
  return Math.max(0, Math.round(originalCents - value));
}

/**
 * Contrato público da promoção (HQ): `discountValue` de `fixed` é BRL, não centavos.
 * O banco guarda centavos; `toActivePromotion` converte na ida.
 */
export function applyPromotionDiscount(
  originalCents: number,
  promotion: ActivePromotion,
): number {
  if (promotion.discountType === 'percent') {
    return applyDiscountCents(originalCents, 'percent', promotion.discountValue);
  }
  return applyDiscountCents(originalCents, 'fixed', Math.round(promotion.discountValue * 100));
}

export function resolveHqCouponDiscount(
  coupon: HqCouponValidation | null | undefined,
  originalCents: number,
): number | null {
  if (!coupon?.valid) return null;
  if (typeof coupon.discountedCents === 'number') {
    return Math.max(0, Math.round(coupon.discountedCents));
  }
  if (typeof coupon.discountPercent === 'number' && coupon.discountPercent > 0) {
    return applyDiscountCents(originalCents, 'percent', coupon.discountPercent);
  }
  if (typeof coupon.discountAmountBrl === 'number' && coupon.discountAmountBrl > 0) {
    return applyDiscountCents(originalCents, 'fixed', Math.round(coupon.discountAmountBrl * 100));
  }
  return null;
}

export function selectActivePromotion(rows: PromotionRow[], now = new Date()): PromotionRow | null {
  const ts = now.getTime();
  const active = rows.filter((row) => {
    if (!row.is_active) return false;
    const start = new Date(row.starts_at).getTime();
    const end = new Date(row.ends_at).getTime();
    return start <= ts && ts <= end;
  });
  if (active.length === 0) return null;
  active.sort((a, b) => {
    const created = Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? '');
    if (created !== 0) return created;
    return Date.parse(b.starts_at) - Date.parse(a.starts_at);
  });
  return active[0];
}

export function toActivePromotion(row: PromotionRow): ActivePromotion {
  const products = codeProductTypes(row);
  return {
    id: row.id,
    name: row.name,
    bannerText: row.banner_text ?? null,
    productType: products.length > 0 ? products.join(',') : null,
    discountType: row.discount_type,
    discountValue:
      row.discount_type === 'fixed' ? row.discount_value / 100 : row.discount_value,
    endDate: row.ends_at,
    stripeCouponId: row.stripe_coupon_id ?? null,
    stripePromoCode: row.stripe_promo_code ?? null,
  };
}

export function applyPromotionToPrices(
  prices: Record<string, PriceInfo>,
  promotion: ActivePromotion | null,
): Record<string, PriceInfo> {
  const next: Record<string, PriceInfo> = {};
  for (const [key, info] of Object.entries(prices)) {
    if (!promotion || !isProductType(key) || !promotionAppliesToProduct(promotion, key)) {
      next[key] = { ...info, hasDiscount: false };
      delete next[key].discountedCents;
      delete next[key].discountedFormatted;
      continue;
    }
    const discountedCents = applyPromotionDiscount(info.cents, promotion);
    const hasDiscount = discountedCents < info.cents;
    next[key] = {
      ...info,
      hasDiscount,
      ...(hasDiscount
        ? { discountedCents, discountedFormatted: formatBRL(discountedCents) }
        : {}),
    };
  }
  return next;
}

export function pricesWithoutPromotion(prices: Record<string, PriceInfo>): HqPricesResponse {
  return { prices: applyPromotionToPrices(prices, null), promotion: null };
}

function couponLabel(row: AccessCodeRow): string {
  if (row.discount_type === 'percent' && row.discount_value) {
    return `${row.discount_value}% OFF`;
  }
  if (row.discount_type === 'fixed' && row.discount_value) {
    return `−${formatBRL(row.discount_value)}`;
  }
  return 'Desconto aplicado';
}

function isExpired(expiresAt: string | null | undefined, now: Date): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function evaluateCoupon(
  row: AccessCodeRow | null,
  ctx: CouponEvalContext,
): HqCouponValidation {
  const now = ctx.now ?? new Date();
  if (!row || row.kind !== 'coupon' || !row.is_active || isExpired(row.expires_at, now)) {
    return { valid: false, error: COUPON_INVALID };
  }
  if (!codeAppliesToProduct(row, ctx.productType)) {
    return { valid: false, error: COUPON_WRONG_PRODUCT, code: row.code };
  }
  if (ctx.usedByHolder) {
    return { valid: false, error: COUPON_ALREADY_USED, code: row.code };
  }
  if (row.max_uses != null && ctx.useCount >= row.max_uses) {
    return { valid: false, error: COUPON_MAX_USES, code: row.code };
  }
  if (!row.discount_type || !row.discount_value) {
    return { valid: false, error: COUPON_INVALID, code: row.code };
  }

  const originalCents = ctx.originalCents ?? 0;
  const discountedCents = applyDiscountCents(originalCents, row.discount_type, row.discount_value);
  const discountPercent = row.discount_type === 'percent' ? row.discount_value : null;
  const discountAmountBrl = row.discount_type === 'fixed' ? row.discount_value / 100 : null;

  return {
    valid: true,
    code: row.code,
    description: row.note ?? row.code,
    productTypes: codeProductTypes(row),
    stripeCouponId: row.stripe_coupon_id ?? null,
    stripePromoCodeId: row.stripe_promo_code_id ?? null,
    discountPercent,
    discountAmountBrl,
    originalCents,
    discountedCents,
    discountLabel: couponLabel(row),
  };
}

export function evaluateTrial(
  row: AccessCodeRow | null,
  ctx: TrialEvalContext,
): TrialValidation {
  const now = ctx.now ?? new Date();
  if (!row || (row.kind !== 'trial' && row.kind !== 'gift') || !row.is_active || isExpired(row.expires_at, now)) {
    return { valid: false, error: TRIAL_INVALID };
  }
  if (!row.trial_days || row.trial_days < 1) {
    return { valid: false, error: TRIAL_INVALID, code: row.code };
  }
  if (!codeAppliesToProduct(row, ctx.requestedProduct)) {
    return { valid: false, error: TRIAL_WRONG_PRODUCT, code: row.code };
  }
  if (ctx.usedByHolder) {
    return { valid: false, error: TRIAL_ALREADY_USED, code: row.code, codeId: row.id };
  }
  if (row.max_uses != null && ctx.useCount >= row.max_uses) {
    return { valid: false, error: TRIAL_MAX_USES, code: row.code };
  }

  const products = codeProductTypes(row);
  return {
    valid: true,
    code: row.code,
    kind: row.kind,
    trialDays: row.trial_days,
    productTypes: products.length > 0 ? products : [...SELLABLE_PRODUCT_TYPES],
    codeId: row.id,
  };
}
