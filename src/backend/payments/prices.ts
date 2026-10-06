/**
 * Preços, promoções, cupons e trials no banco do Nome Magnético.
 * Service role só no servidor. Falha no banco → preço Stripe sem promoção.
 *
 * `discount_value` de tipo `fixed` no banco é CENTAVOS de BRL.
 * No contrato público `ActivePromotion.discountValue` de `fixed` é BRL
 * (reais), como o HQ devolvia — a landing e o checkout usam esse número.
 */

import { supabase } from '../db/supabase';
import { isUniqueViolation } from '../ops/registry';
import { stripe, type ProductType } from './stripe';
import {
  applyPromotionToPrices,
  codeAppliesToProduct,
  evaluateCoupon,
  evaluateTrial,
  formatBRL,
  isProductType,
  normalizeAccessCode,
  pricesWithoutPromotion,
  storedAccessCode,
  toActivePromotion,
  type AccessCodeRow,
  type ActivePromotion,
  type HqCouponValidation,
  type HqPricesResponse,
  type PriceInfo,
  type PromotionRow,
  type TrialValidation,
} from './promo-math';

export type {
  ActivePromotion,
  CouponValidation,
  HqCouponValidation,
  HqPricesResponse,
  PriceInfo,
  PricesResponse,
  TrialValidation,
} from './promo-math';

export {
  applyPromotionDiscount,
  formatBRL,
  promotionAppliesToProduct,
  promotionProductTypes,
  resolveHqCouponDiscount,
  TRIAL_NOT_FOUND,
} from './promo-math';

export interface StripePrices {
  nome_social: string;
  nome_bebe: string;
  nome_empresa: string;
}

const PRICE_IDS: Record<ProductType, string> = {
  nome_social: process.env.STRIPE_PRICE_NOME_SOCIAL ?? process.env.STRIPE_PRICE_NOME_MAGNETICO ?? '',
  nome_bebe: process.env.STRIPE_PRICE_NOME_BEBE ?? '',
  nome_empresa: process.env.STRIPE_PRICE_NOME_EMPRESA ?? '',
};

const PRODUCT_IDS: Record<ProductType, string> = {
  nome_social: process.env.STRIPE_PRODUCT_NOME_SOCIAL ?? '',
  nome_bebe: process.env.STRIPE_PRODUCT_NOME_BEBE ?? '',
  nome_empresa: process.env.STRIPE_PRODUCT_NOME_EMPRESA ?? '',
};

const PROMOTION_COLUMNS =
  'id, name, product_types, discount_type, discount_value, starts_at, ends_at, is_active, banner_text, stripe_coupon_id, stripe_promo_code, created_at';

const ACCESS_COLUMNS =
  'id, code, kind, product_types, trial_days, discount_type, discount_value, expires_at, is_active, max_uses, stripe_coupon_id, stripe_promo_code_id, note';

function productTypeFromStripe(price: {
  product: unknown;
  metadata?: Record<string, string> | null;
}): ProductType | null {
  const metaType = price.metadata?.product_type;
  if (isProductType(metaType)) return metaType;

  const product = price.product;
  if (typeof product === 'string') {
    for (const [type, id] of Object.entries(PRODUCT_IDS)) {
      if (id && product === id) return type as ProductType;
    }
    return null;
  }
  if (!product || typeof product !== 'object') return null;

  const obj = product as { id?: string; name?: string | null; metadata?: Record<string, string> | null };
  const fromProductMeta = obj.metadata?.product_type;
  if (isProductType(fromProductMeta)) return fromProductMeta;
  for (const [type, id] of Object.entries(PRODUCT_IDS)) {
    if (id && obj.id === id) return type as ProductType;
  }
  const name = (obj.name ?? '').toLowerCase();
  if (name.includes('social')) return 'nome_social';
  if (name.includes('beb') || name.includes('baby')) return 'nome_bebe';
  if (name.includes('empresa') || name.includes('company')) return 'nome_empresa';
  return null;
}

async function retrieveConfiguredPrices(): Promise<Record<string, PriceInfo>> {
  const prices: Record<string, PriceInfo> = {};
  const [nm, nb, ne] = await Promise.all([
    PRICE_IDS.nome_social ? stripe.prices.retrieve(PRICE_IDS.nome_social) : null,
    PRICE_IDS.nome_bebe ? stripe.prices.retrieve(PRICE_IDS.nome_bebe) : null,
    PRICE_IDS.nome_empresa ? stripe.prices.retrieve(PRICE_IDS.nome_empresa) : null,
  ]);
  if (nm) {
    prices.nome_social = {
      cents: nm.unit_amount ?? 0,
      formatted: formatBRL(nm.unit_amount),
      priceId: nm.id,
      productId: typeof nm.product === 'string' ? nm.product : nm.product?.id,
      hasDiscount: false,
    };
  }
  if (nb) {
    prices.nome_bebe = {
      cents: nb.unit_amount ?? 0,
      formatted: formatBRL(nb.unit_amount),
      priceId: nb.id,
      productId: typeof nb.product === 'string' ? nb.product : nb.product?.id,
      hasDiscount: false,
    };
  }
  if (ne) {
    prices.nome_empresa = {
      cents: ne.unit_amount ?? 0,
      formatted: formatBRL(ne.unit_amount),
      priceId: ne.id,
      productId: typeof ne.product === 'string' ? ne.product : ne.product?.id,
      hasDiscount: false,
    };
  }
  return prices;
}

async function fetchStripeCatalog(): Promise<Record<string, PriceInfo>> {
  const grouped = new Map<ProductType, { created: number; info: PriceInfo }>();

  try {
    const listed = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product'],
    });
    for (const price of listed.data) {
      if (!price.unit_amount || price.currency !== 'brl') continue;
      const type = productTypeFromStripe(price);
      if (!type) continue;
      const product = price.product;
      const productId = typeof product === 'string' ? product : product?.id;
      const productName =
        typeof product === 'object' && product && 'name' in product ? (product.name ?? undefined) : undefined;
      const current = grouped.get(type);
      if (!current || price.created > current.created) {
        grouped.set(type, {
          created: price.created,
          info: {
            cents: price.unit_amount,
            formatted: formatBRL(price.unit_amount),
            priceId: price.id,
            productId,
            productName,
            hasDiscount: false,
          },
        });
      }
    }
  } catch (err) {
    console.warn('[prices] Falha ao listar preços no Stripe — tentando IDs configurados:', err);
  }

  const fromList: Record<string, PriceInfo> = {};
  for (const [type, entry] of grouped) fromList[type] = entry.info;
  if (Object.keys(fromList).length === 0) {
    return retrieveConfiguredPrices();
  }

  const missing = (['nome_social', 'nome_bebe', 'nome_empresa'] as ProductType[]).filter((type) => !fromList[type]);
  if (missing.length > 0) {
    try {
      const fallback = await retrieveConfiguredPrices();
      for (const type of missing) {
        if (fallback[type]) fromList[type] = fallback[type];
      }
    } catch {
      // mantém o que veio da listagem
    }
  }
  return fromList;
}

async function fetchActivePromotionRow(): Promise<PromotionRow | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('promotions')
    .select(PROMOTION_COLUMNS)
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as PromotionRow | null) ?? null;
}

/** Preços + promoção ativa no banco local (fallback Stripe sem promoção). */
export async function getPricesAndPromo(): Promise<HqPricesResponse> {
  let prices: Record<string, PriceInfo> = {};
  try {
    prices = await fetchStripeCatalog();
  } catch (err) {
    console.warn('[prices] Falha ao buscar preços no Stripe:', err);
  }

  try {
    const row = await fetchActivePromotionRow();
    if (!row) return { prices, promotion: null };
    const promotion = toActivePromotion(row);
    return { prices: applyPromotionToPrices(prices, promotion), promotion };
  } catch (err) {
    console.warn('[prices] Falha ao ler promoção no banco — preço Stripe sem promoção:', err);
    return pricesWithoutPromotion(prices);
  }
}

/** @deprecated use getPricesAndPromo */
export async function getHqPricesAndPromo(_saasId?: string): Promise<HqPricesResponse> {
  return getPricesAndPromo();
}

export async function getStripePrices(): Promise<StripePrices> {
  const FALLBACK: StripePrices = { nome_social: 'R$ 98,00', nome_bebe: 'R$ 80,00', nome_empresa: 'R$ 125,00' };
  try {
    const { prices } = await getPricesAndPromo();
    return {
      nome_social: prices.nome_social?.formatted || FALLBACK.nome_social,
      nome_bebe: prices.nome_bebe?.formatted || FALLBACK.nome_bebe,
      nome_empresa: prices.nome_empresa?.formatted || FALLBACK.nome_empresa,
    };
  } catch {
    return FALLBACK;
  }
}

async function findAccessCode(raw: string): Promise<AccessCodeRow | null> {
  const exact = storedAccessCode(raw);
  const normalized = normalizeAccessCode(raw);
  if (!normalized) return null;

  const { data: byExact, error: exactError } = await supabase
    .from('access_codes')
    .select(ACCESS_COLUMNS)
    .eq('code', exact)
    .maybeSingle();
  if (exactError) throw exactError;
  if (byExact) return byExact as AccessCodeRow;

  const { data: byNorm, error: normError } = await supabase
    .from('access_codes')
    .select(ACCESS_COLUMNS)
    .eq('code_normalized', normalized)
    .order('created_at', { ascending: false })
    .limit(1);
  if (normError) throw normError;
  return ((byNorm ?? [])[0] as AccessCodeRow | undefined) ?? null;
}

async function countAccessCodeUses(codeId: string): Promise<number> {
  const { count, error } = await supabase
    .from('access_code_uses')
    .select('id', { count: 'exact', head: true })
    .eq('code_id', codeId);
  if (error) throw error;
  return count ?? 0;
}

async function holderAlreadyUsed(codeId: string, userId?: string | null, userEmail?: string | null): Promise<boolean> {
  if (userId) {
    const { data, error } = await supabase
      .from('access_code_uses')
      .select('id')
      .eq('code_id', codeId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return true;
  }
  const email = userEmail?.trim();
  if (email) {
    const { data, error } = await supabase
      .from('access_code_uses')
      .select('id')
      .eq('code_id', codeId)
      .ilike('user_email', email)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return true;
  }
  return false;
}

async function loadCouponContext(row: AccessCodeRow, userId?: string | null, userEmail?: string | null) {
  const [useCount, usedByHolder] = await Promise.all([
    countAccessCodeUses(row.id),
    holderAlreadyUsed(row.id, userId, userEmail),
  ]);
  return { useCount, usedByHolder };
}

export async function validateAccessCoupon(params: {
  couponCode: string;
  productType: ProductType;
  userId?: string | null;
  userEmail?: string | null;
  originalCents?: number | null;
  saasId?: string;
}): Promise<HqCouponValidation | null> {
  const couponCode = params.couponCode?.trim();
  if (!couponCode) return { valid: false, error: 'Cupom inválido ou expirado' };

  try {
    const row = await findAccessCode(couponCode);
    if (!row) return { valid: false, error: 'Cupom inválido ou expirado' };
    const { useCount, usedByHolder } = await loadCouponContext(row, params.userId, params.userEmail);
    return evaluateCoupon(row, {
      productType: params.productType,
      userId: params.userId,
      userEmail: params.userEmail,
      originalCents: params.originalCents,
      usedByHolder,
      useCount,
    });
  } catch (err) {
    console.warn('[prices] Falha ao validar cupom no banco:', err);
    return null;
  }
}

/** @deprecated use validateAccessCoupon */
export const validateHqAccessCoupon = validateAccessCoupon;

async function insertAccessCodeUse(params: {
  codeId: string;
  userId?: string | null;
  userEmail?: string | null;
  productType?: string | null;
  source: 'redeem' | 'webhook' | 'import' | 'ops';
}): Promise<'inserted' | 'duplicate'> {
  const { error } = await supabase.from('access_code_uses').insert({
    code_id: params.codeId,
    user_id: params.userId || null,
    user_email: params.userEmail?.trim() || null,
    product_type: params.productType || null,
    source: params.source,
  });
  if (!error) return 'inserted';
  if (isUniqueViolation(error)) return 'duplicate';
  throw error;
}

export async function recordAccessCouponUse(params: {
  couponCode?: string | null;
  productType: ProductType;
  userId: string;
  userEmail?: string | null;
  saasId?: string;
}): Promise<void> {
  const couponCode = params.couponCode?.trim();
  if (!couponCode) return;

  try {
    const row = await findAccessCode(couponCode);
    if (!row || row.kind !== 'coupon') return;

    const { useCount, usedByHolder } = await loadCouponContext(row, params.userId, params.userEmail);
    const validation = evaluateCoupon(row, {
      productType: params.productType,
      userId: params.userId,
      userEmail: params.userEmail,
      usedByHolder,
      useCount,
    });

    if (!validation.valid && validation.error !== 'Este cupom já foi utilizado') {
      return;
    }

    await insertAccessCodeUse({
      codeId: row.id,
      userId: params.userId,
      userEmail: params.userEmail,
      productType: params.productType,
      source: 'webhook',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Falha ao registrar uso do cupom: ${message}`);
  }
}

/** @deprecated use recordAccessCouponUse */
export const recordHqAccessCouponUse = recordAccessCouponUse;

export async function lookupAccessTrial(trialCode: string): Promise<TrialValidation> {
  const code = trialCode.trim();
  if (!code) return { valid: false, error: 'Código de acesso inválido ou expirado' };
  const row = await findAccessCode(code);
  if (!row) return { valid: false, error: 'Código de acesso inválido ou expirado' };
  const useCount = await countAccessCodeUses(row.id);
  return evaluateTrial(row, { usedByHolder: false, useCount });
}

export async function validateAccessTrial(params: {
  trialCode: string;
  userId?: string | null;
  userEmail?: string | null;
  requestedProduct?: string | null;
}): Promise<TrialValidation> {
  const row = await findAccessCode(params.trialCode);
  if (!row) return { valid: false, error: 'Código de acesso inválido ou expirado' };
  const { useCount, usedByHolder } = await loadCouponContext(row, params.userId, params.userEmail);
  return evaluateTrial(row, {
    requestedProduct: params.requestedProduct,
    usedByHolder,
    useCount,
  });
}

export async function recordAccessTrialUse(params: {
  trialCode?: string | null;
  productType?: string | null;
  userId: string;
  userEmail?: string | null;
  saasId?: string;
}): Promise<void> {
  const trialCode = params.trialCode?.trim();
  if (!trialCode) return;

  try {
    const row = await findAccessCode(trialCode);
    if (!row || (row.kind !== 'trial' && row.kind !== 'gift')) return;
    if (!codeAppliesToProduct(row, params.productType)) return;

    await insertAccessCodeUse({
      codeId: row.id,
      userId: params.userId,
      userEmail: params.userEmail,
      productType: params.productType || null,
      source: 'redeem',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Falha ao registrar uso do trial: ${message}`);
  }
}

/** @deprecated use recordAccessTrialUse */
export const recordHqAccessTrialUse = recordAccessTrialUse;
