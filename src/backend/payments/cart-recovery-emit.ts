import type { ProductType } from './stripe';
import { notify } from '../notifications/notify';
import { hasActiveSubscription } from '../db/subscriptions';
import { getEffectivePriceCore } from '../pricing/service';
import {
  claimCartRecoverySend,
  releaseCartRecoverySend,
} from '../db/cart-recovery-sends';
import {
  buildCartAbandonedPayload,
  type RecoveryPaymentMethod,
  type RecoveryReasonType,
} from './cart-recovery';

export type CheckoutRecoveryMetadata = {
  final_cents?: string;
  base_cents?: string;
  promo_id?: string;
  discount_source?: string;
  coupon_code?: string;
  chosen_signature?: string;
  analysis_id?: string;
  source?: string;
  recovery?: string;
};

export function isRecoveryCheckout(metadata?: CheckoutRecoveryMetadata | null): boolean {
  return metadata?.recovery === '1';
}

export type ResolveRecoveryCheckoutUrl = (params: {
  userId: string;
  userEmail: string;
  productType: ProductType;
  unitAmount: number;
  baseCents?: number;
  promoId?: string | null;
  discountSource?: 'none' | 'promotion' | 'coupon';
  couponCode?: string;
  chosenSignature?: string;
  analysisId?: string;
  source?: 'card_pdf' | 'paywall_free';
}) => Promise<string | null>;

export async function emitCartAbandonedIfEligible(params: {
  userId: string;
  productType: ProductType;
  profile: { email: string; nome: string | null };
  paymentId: string;
  reasonType: RecoveryReasonType;
  paymentMethod?: RecoveryPaymentMethod;
  motivo: string;
  sessionMetadata?: CheckoutRecoveryMetadata | null;
  amountTotalCents?: number | null;
  resolveRecoveryCheckoutUrl: ResolveRecoveryCheckoutUrl;
}): Promise<'emitted' | 'skipped'> {
  const { userId, productType, profile, paymentId, reasonType, paymentMethod, motivo, sessionMetadata } =
    params;

  if (productType !== 'nome_social') {
    return 'skipped';
  }

  if (await hasActiveSubscription(userId, productType)) {
    return 'skipped';
  }

  const claim = await claimCartRecoverySend(userId, productType);
  if (claim !== 'claimed') {
    return 'skipped';
  }

  const rollbackClaim = async () => {
    await releaseCartRecoverySend(userId, productType);
  };

  let unitAmount =
    sessionMetadata?.final_cents ? Number(sessionMetadata.final_cents)
    : (typeof params.amountTotalCents === 'number' && params.amountTotalCents > 0)
      ? params.amountTotalCents
      : 0;

  if (unitAmount <= 0) {
    try {
      const effective = await getEffectivePriceCore({ productType });
      unitAmount = effective.final_cents;
    } catch {
      unitAmount = 0;
    }
  }

  if (unitAmount <= 0) {
    await rollbackClaim();
    return 'skipped';
  }

  const checkoutUrl = await params.resolveRecoveryCheckoutUrl({
    userId,
    userEmail: profile.email,
    productType,
    unitAmount,
    baseCents: sessionMetadata?.base_cents ? Number(sessionMetadata.base_cents) : unitAmount,
    promoId: sessionMetadata?.promo_id,
    discountSource: sessionMetadata?.discount_source as 'none' | 'promotion' | 'coupon' | undefined,
    couponCode: sessionMetadata?.coupon_code,
    chosenSignature: sessionMetadata?.chosen_signature,
    analysisId: sessionMetadata?.analysis_id,
    source: sessionMetadata?.source as 'card_pdf' | 'paywall_free' | undefined,
  });

  if (!checkoutUrl) {
    await rollbackClaim();
    return 'skipped';
  }

  const payload = buildCartAbandonedPayload({
    email: profile.email,
    firstName: profile.nome ?? '',
    productType,
    checkoutUrl,
    userId,
    paymentId,
    reasonType,
    paymentMethod,
    motivo,
  });

  if (!payload) {
    await rollbackClaim();
    return 'skipped';
  }

  const notifyOk = await notify('cart.abandoned', payload);
  if (!notifyOk) {
    await rollbackClaim();
    return 'skipped';
  }

  return 'emitted';
}
