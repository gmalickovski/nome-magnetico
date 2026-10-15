/**
 * Preços, promoções, cupons e trials no banco do Nome Magnético.
 * Preço base: tabela `product_prices` (DEV-178). Service role só no servidor.
 *
 * `discount_value` de tipo `fixed` no banco é CENTAVOS de BRL.
 * No contrato público `ActivePromotion.discountValue` de `fixed` é BRL
 * (reais), como o HQ devolvia — a landing e o checkout usam esse número.
 */

import { supabase } from '../db/supabase';
import { isUniqueViolation } from '../ops/registry';
import type { ProductType } from './stripe';
import { fetchProductPriceMap, fallbackRow } from '../pricing/product-prices-db';
import { getCatalogPricing, getEffectivePriceCore, effectiveResultToPriceInfo } from '../pricing/service';
import type { EffectivePriceResult } from '../pricing/service';
import {
  codeAppliesToProduct,
  evaluateCoupon,
  evaluateTrial,
  normalizeAccessCode,
  storedAccessCode,
  type AccessCodeRow,
  type HqCouponValidation,
  type HqPricesResponse,
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

const ACCESS_COLUMNS =
  'id, code, kind, product_types, trial_days, discount_type, discount_value, expires_at, is_active, max_uses, stripe_coupon_id, stripe_promo_code_id, note';

/** Preços + promoção ativa (fonte: product_prices + promotions). */
export async function getPricesAndPromo(): Promise<HqPricesResponse> {
  try {
    return await getCatalogPricing();
  } catch (err) {
    console.warn('[prices] Falha ao carregar catálogo de preços — fallback estático:', err);
    return getCatalogPricing(new Date());
  }
}

export async function getEffectivePrice(params: {
  productType: ProductType;
  now?: Date;
  couponCode?: string;
  userId?: string | null;
  userEmail?: string | null;
  renewalTablePrice?: boolean;
}): Promise<EffectivePriceResult> {
  let couponValidation = null;
  const code = params.couponCode?.trim();
  const priceMap = await fetchProductPriceMap();
  const row = priceMap.get(params.productType) ?? fallbackRow(params.productType);
  if (code && !params.renewalTablePrice) {
    couponValidation = await validateAccessCoupon({
      couponCode: code,
      productType: params.productType,
      userId: params.userId,
      userEmail: params.userEmail,
      originalCents: row.base_cents,
    });
  }

  return getEffectivePriceCore({
    productType: params.productType,
    now: params.now,
    couponValidation,
    renewalTablePrice: params.renewalTablePrice,
    priceMap,
  });
}

export { effectiveResultToPriceInfo };

/** @deprecated use getPricesAndPromo */
export async function getHqPricesAndPromo(_saasId?: string): Promise<HqPricesResponse> {
  return getPricesAndPromo();
}

export async function getStripePrices(): Promise<StripePrices> {
  const { prices } = await getPricesAndPromo();
  const pick = (type: ProductType, fallback: string) =>
    prices[type]?.discountedFormatted ?? prices[type]?.formatted ?? fallback;
  return {
    nome_social: pick('nome_social', 'R$ 98,00'),
    nome_bebe: pick('nome_bebe', 'R$ 80,00'),
    nome_empresa: pick('nome_empresa', 'R$ 125,00'),
  };
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
