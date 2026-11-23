import { randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import { claimChargebackDelivery, markChargebackDelivered, releaseChargebackDelivery } from '../db/stripe-chargeback-deliveries';
import { getSubscriptionByPaymentIntent } from '../db/subscriptions';
import { formatBRLFromCents } from '../money/format-brl-cents';
import { notify } from '../notifications/notify';
import { PRODUCT_TYPES, type ProductType } from '../../shared/product-labels';
import { stripe } from './stripe';

const CLOSED_DISPUTE_STATUSES = new Set(['won', 'lost', 'warning_closed', 'prevented']);

function productFrom(value?: string): ProductType | undefined {
  return PRODUCT_TYPES.find((product) => product === value);
}

function userIdFrom(value?: string): string | undefined {
  return value && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value) ? value : undefined;
}

async function chargebackContext(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id;
  let charge = typeof dispute.charge === 'string' ? undefined : dispute.charge;
  if (!dispute.payment_intent && !charge) {
    charge = await stripe.charges.retrieve(chargeId).catch(() => undefined);
  }
  const paymentIntent = dispute.payment_intent ?? charge?.payment_intent;
  const intentId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;
  const intentMetadata = typeof paymentIntent === 'object' ? paymentIntent?.metadata : undefined;

  let productType = productFrom(intentMetadata?.product_type) ?? productFrom(charge?.metadata?.product_type);
  let userId = userIdFrom(intentMetadata?.user_id) ?? userIdFrom(charge?.metadata?.user_id);
  if (intentId && (!productType || !userId)) {
    const subscription = await getSubscriptionByPaymentIntent(intentId).catch(() => null);
    if (subscription?.payment_provider === 'test') return null;
    productType ??= productFrom(subscription?.product_type);
    userId ??= userIdFrom(subscription?.user_id);
  }
  if (typeof paymentIntent === 'string' && (!productType || !userId)) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntent).catch(() => undefined);
    productType ??= productFrom(intent?.metadata?.product_type);
    userId ??= userIdFrom(intent?.metadata?.user_id);
  }
  return { payment_id: intentId ?? chargeId, productType, userId };
}

export async function notifyStripeChargeback(event: Stripe.ChargeDisputeCreatedEvent): Promise<void> {
  const dispute = event.data.object;
  if (!event.livemode || dispute.livemode === false || CLOSED_DISPUTE_STATUSES.has(dispute.status)) return;

  const context = await chargebackContext(dispute);
  if (!context) return;

  const leaseToken = randomUUID();
  const delivery = await claimChargebackDelivery(dispute.id, leaseToken);
  if (delivery === 'sent') return;
  if (delivery === 'busy') throw new Error('payment.chargeback_delivery_busy');

  const accepted = await notify('payment.chargeback', {
    ...context,
    amount: dispute.amount,
    amount_formatted: formatBRLFromCents(dispute.amount),
    reason: dispute.reason,
    status: dispute.status,
    payment_provider: 'stripe',
    livemode: true,
  });
  if (!accepted) {
    await releaseChargebackDelivery(dispute.id, leaseToken);
    throw new Error('payment.chargeback_notify_failed');
  }
  // This records n8n acceptance. Slack delivery is checked within the workflow.
  await markChargebackDelivered(dispute.id, leaseToken);
}
