import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { supabase } from '../db/supabase';
import { PRODUCT_LABELS, PRODUCT_TYPES } from '../../shared/product-labels';
import { paidCampaignProperties, readGaIdentity } from './paid-attribution';
import { sendGa4Purchase } from './ga4-mp';
import { deliverServerEvent, posthogEventUuid } from './posthog-server';

const purchaseSchema = z.object({
  distinctId: z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/),
  amountCents: z.number().int().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  product: z.enum(PRODUCT_TYPES),
  kind: z.enum(['new', 'renewal']),
  paymentMethod: z.enum(['card', 'pix']),
  source: z.enum(['card_pdf', 'paywall_free']).optional(),
  baseCents: z.number().int().nonnegative().optional(),
  finalCents: z.number().int().nonnegative().optional(),
});

type Purchase = z.infer<typeof purchaseSchema>;
type Destination = 'posthog' | 'ga4' | 'meta';
type Outcome = 'sent' | 'skipped' | 'retry';

type QueuedPurchase = {
  order_id: string;
  destination: Destination;
  checkout_id: string | null;
  paid_at: string;
  attempts: number;
  payload: unknown;
};

export async function enqueuePurchase(
  orderId: string,
  checkoutId: string,
  paidAt: Date,
  purchase: Purchase,
) {
  const payload = purchaseSchema.parse(purchase);
  const { error } = await supabase.rpc('nm_enqueue_purchase', {
    p_order_id: orderId,
    p_checkout_id: checkoutId,
    p_paid_at: paidAt.toISOString(),
    p_payload: payload,
  });
  if (error) throw new Error('Falha ao enfileirar conversão');
}

async function deliver(row: QueuedPurchase): Promise<Outcome> {
  const parsed = purchaseSchema.safeParse(row.payload);
  if (!parsed.success) return 'skipped';
  const purchase = parsed.data;
  const { data: context, error } = await supabase.rpc('nm_paid_delivery_context', {
    p_checkout_id: row.checkout_id,
    p_paid_at: row.paid_at,
  });
  if (error) return 'retry';

  const paidAt = new Date(row.paid_at);
  const value = purchase.amountCents / 100;
  const plan = PRODUCT_LABELS[purchase.product];
  if (row.destination === 'posthog') {
    const sent = await deliverServerEvent({
      event: 'purchase',
      distinctId: purchase.distinctId,
      uuid: posthogEventUuid('purchase', row.order_id),
      timestamp: paidAt,
      properties: {
        session_id: row.order_id,
        value,
        currency: purchase.currency,
        product: purchase.product,
        product_type: purchase.product,
        plan,
        purchase_kind: purchase.kind,
        payment_method: purchase.paymentMethod,
        base_cents: purchase.baseCents ?? purchase.amountCents,
        final_cents: purchase.finalCents ?? purchase.amountCents,
        ...(purchase.source ? { source: purchase.source } : {}),
        ...paidCampaignProperties(context?.click),
      },
    });
    return sent ? 'sent' : 'retry';
  }
  if (row.destination !== 'ga4') return 'skipped';

  const ga = readGaIdentity(context?.ga);
  if (!ga) return 'skipped';
  return sendGa4Purchase({
    clientId: ga.client_id,
    sessionId: ga.session_id,
    adsConsent: context?.ads === true,
    transactionId: row.order_id,
    value,
    currency: purchase.currency,
    paidAt,
    items: [{ item_id: purchase.product, item_name: plan, price: value, quantity: 1 }],
    paymentProvider: 'stripe',
    productType: purchase.product,
    purchaseKind: purchase.kind,
  });
}

const BACKOFF_MINUTES = [1, 5, 30, 120, 720, 1440];

export async function drainPurchaseDeliveries(orderId?: string) {
  const lease = randomUUID();
  const { data, error } = await supabase.rpc('nm_claim_purchase_deliveries', {
    p_lease_id: lease,
    p_order_id: orderId ?? null,
  });
  if (error) throw new Error('Fila de conversões indisponível');

  const results = { sent: 0, skipped: 0, retry: 0, failed: 0 };
  for (const row of (data ?? []) as QueuedPurchase[]) {
    let outcome: Outcome;
    try {
      outcome = await deliver(row);
    } catch {
      outcome = 'retry';
    }
    const now = Date.now();
    const delay = BACKOFF_MINUTES[row.attempts - 1];
    const status = outcome === 'retry' && delay === undefined ? 'failed' : outcome;
    const { error: updateError } = await supabase.from('nm_purchase_deliveries')
      .update({
        lease_id: null,
        lease_until: null,
        ...(status === 'retry'
          ? { due_at: new Date(now + (delay ?? 0) * 60_000).toISOString() }
          : { finished_at: new Date(now).toISOString(), outcome: status }),
      })
      .eq('order_id', row.order_id).eq('destination', row.destination).eq('lease_id', lease);
    if (updateError) throw new Error('Falha ao atualizar resultado de conversão');
    results[status] += 1;
    if (status === 'failed') console.error('[paid-attribution] Tentativas esgotadas', row.destination);
  }
  return results;
}
