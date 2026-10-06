import { supabase } from '../db/supabase';
import { SELLABLE_PRODUCT_TYPES, type ProductType } from '../../shared/product-labels';
import { recordAccessTrialUse, validateAccessTrial } from './prices';
import { TRIAL_ALREADY_USED, TRIAL_INVALID, TRIAL_NOT_FOUND } from './promo-math';

const VALID_PRODUCTS = SELLABLE_PRODUCT_TYPES;

export interface RedeemTrialResult {
  ok: boolean;
  status: number;
  error?: string;
  alreadyActive?: boolean;
  alreadyRedeemed?: boolean;
  endsAt?: string | null;
  skippedActiveProducts?: string[];
}

function asProductList(products: string[]): ProductType[] {
  const allowed = new Set<string>([...VALID_PRODUCTS, 'nome_social', 'nome_bebe', 'nome_empresa']);
  return products.filter((item): item is ProductType => allowed.has(item));
}

/**
 * Valida o código em `access_codes` e concede o trial.
 * `trial_days` e `product_types` vêm do banco — query string / body não definem o acesso.
 */
export async function redeemAccessTrial(params: {
  trialCode: string;
  userId: string;
  userEmail?: string | null;
}): Promise<RedeemTrialResult> {
  const trialCode = params.trialCode.trim();
  if (!trialCode) {
    return { ok: false, status: 400, error: TRIAL_NOT_FOUND };
  }

  let validation;
  try {
    validation = await validateAccessTrial({
      trialCode,
      userId: params.userId,
      userEmail: params.userEmail,
    });
  } catch (err) {
    console.error('[trial-redeem] Falha ao validar código:', err);
    return { ok: false, status: 503, error: 'Não foi possível validar o código agora. Tente de novo em instantes.' };
  }

  if (!validation.valid || !validation.trialDays || !validation.productTypes) {
    if (validation.error === TRIAL_ALREADY_USED) {
      return { ok: false, status: 409, alreadyRedeemed: true, error: 'Código já resgatado por este usuário' };
    }
    return {
      ok: false,
      status: 400,
      error: validation.error === TRIAL_INVALID ? TRIAL_NOT_FOUND : (validation.error ?? TRIAL_NOT_FOUND),
    };
  }

  const products = asProductList(validation.productTypes);
  if (products.length === 0) {
    return { ok: false, status: 400, error: TRIAL_NOT_FOUND };
  }

  const now = new Date();
  const { data: existing } = await supabase
    .from('trial_redemptions')
    .select('id')
    .eq('user_id', params.userId)
    .eq('trial_code', trialCode)
    .maybeSingle();

  if (existing) {
    await recordAccessTrialUse({
      trialCode,
      productType: products.join(','),
      userId: params.userId,
      userEmail: params.userEmail,
    }).catch((err) => console.error('[trial-redeem] Falha ao registrar uso já resgatado:', err));
    return { ok: false, status: 409, alreadyRedeemed: true, error: 'Código já resgatado por este usuário' };
  }

  const { data: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('product_type, ends_at')
    .eq('user_id', params.userId)
    .in('product_type', products)
    .gt('ends_at', now.toISOString());

  const activeProducts = new Set((activeSubscriptions ?? []).map((subscription) => subscription.product_type));
  const productsToCreate = products.filter((product) => !activeProducts.has(product));

  if (productsToCreate.length === 0) {
    await recordAccessTrialUse({
      trialCode,
      productType: products.join(','),
      userId: params.userId,
      userEmail: params.userEmail,
    }).catch((err) => console.error('[trial-redeem] Falha ao registrar uso com acesso já ativo:', err));
    return {
      ok: false,
      status: 409,
      alreadyActive: true,
      error: 'Você já possui acesso ativo para este produto.',
    };
  }

  const trialDays = validation.trialDays;
  const endsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString();
  const kind = validation.kind ?? 'trial';

  if (productsToCreate.length === VALID_PRODUCTS.length && VALID_PRODUCTS.every((item) => productsToCreate.includes(item))) {
    await supabase
      .from('profiles')
      .update({ is_test: true, test_ends_at: endsAt })
      .eq('id', params.userId);
  }

  for (const pt of productsToCreate) {
    await supabase.from('subscriptions').insert({
      user_id: params.userId,
      product_type: pt,
      starts_at: now.toISOString(),
      ends_at: endsAt,
      stripe_session_id: `trial_${trialCode}`,
      amount_paid: 0,
      metadata: { source: kind === 'gift' ? 'gift_access_link' : 'access_code', code: trialCode },
    });
  }

  await supabase.from('trial_redemptions').insert({
    user_id: params.userId,
    trial_code: trialCode,
    trial_days: trialDays,
    product_type: products.length === VALID_PRODUCTS.length ? 'all' : products.join(','),
    source: kind === 'gift' ? 'gift' : 'link',
  });

  await recordAccessTrialUse({
    trialCode,
    productType: products.join(','),
    userId: params.userId,
    userEmail: params.userEmail,
  }).catch((err) => console.error('[trial-redeem] Falha ao registrar uso do trial:', err));

  return {
    ok: true,
    status: 200,
    endsAt,
    skippedActiveProducts: Array.from(activeProducts),
  };
}
