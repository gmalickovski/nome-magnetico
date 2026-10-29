import { invalidateUserSubscriptionsCache } from '../cache/memo';
import { createSubscription } from '../db/subscriptions';
import { getProfile } from '../db/users';
import { notify } from '../notifications/notify';
import { captureFluxoException } from '../../sentry/fluxo';
import { getPublicBaseUrl } from '../../utils/public-url';
import { productAnalysisAppPath } from './checkout-access';
import type { PurchaseKind } from './renewal';
import { PRODUCT_NAMES, type ProductType } from './stripe';

export async function processTestCheckoutSuccess(params: {
  userId: string;
  productType: ProductType;
  stripeSessionId: string;
  purchaseKind: PurchaseKind;
  amountPaid?: number;
}): Promise<void> {
  const { subscription, created } = await createSubscription({
    userId: params.userId,
    productType: params.productType,
    stripeSessionId: params.stripeSessionId,
    amountPaid: params.amountPaid ?? 0,
    paymentProvider: 'test',
    purchaseKind: params.purchaseKind,
  });

  invalidateUserSubscriptionsCache(params.userId);

  if (!created) {
    return;
  }

  const profile = await getProfile(params.userId);
  if (!profile) {
    console.error(
      JSON.stringify({
        scope: 'create-checkout',
        event: 'payment.confirmed',
        ok: false,
        reason: 'profile_not_found',
        userId: params.userId,
        stripeSessionId: params.stripeSessionId,
      }),
    );
    return;
  }

  const baseUrl = getPublicBaseUrl();
  const accessUrl = `${baseUrl}${productAnalysisAppPath(params.productType)}`;

  const paymentConfirmedOk = await notify('payment.confirmed', {
    email: profile.email,
    firstName: profile.nome ?? profile.email.split('@')[0],
    accessUrl,
    productType: params.productType,
    productName: PRODUCT_NAMES[params.productType],
    amount: params.amountPaid ?? 0,
  });

  if (!paymentConfirmedOk) {
    captureFluxoException('notify_transacional', new Error('payment.confirmed_notify_failed'), {
      product_type: params.productType,
    });
  }
}
