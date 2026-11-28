import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

// DEV-356: fila de compra por destino. Uma linha por pedido e destino, resultado explícito.
type Row = {
  order_id: string;
  destination: 'posthog' | 'ga4' | 'meta';
  checkout_id: string | null;
  paid_at: string;
  attempts: number;
  payload: unknown;
  finished_at?: string | null;
  outcome?: string | null;
  due_at?: string;
};

const rows = new Map<string, Row>();
let context: Record<string, unknown> | null = null;
let posthogConfigured = true;
let posthogAccepts = true;
const posthogCalls: Array<{ uuid?: string; properties: Record<string, unknown> }> = [];
const gaCalls: Array<Record<string, unknown>> = [];

const key = (order: string, destination: string) => `${order}:${destination}`;

mock.module('../db/supabase', {
  namedExports: {
    supabase: {
      rpc: async (name: string, args: Record<string, unknown>) => {
        if (name === 'nm_enqueue_purchase') {
          for (const destination of ['posthog', 'ga4'] as const) {
            const id = key(String(args.p_order_id), destination);
            if (!rows.has(id)) {
              rows.set(id, {
                order_id: String(args.p_order_id), destination, checkout_id: String(args.p_checkout_id),
                paid_at: String(args.p_paid_at), attempts: 0, payload: args.p_payload, finished_at: null,
              });
            }
          }
          return { error: null };
        }
        if (name === 'nm_claim_purchase_deliveries') {
          const ready = [...rows.values()].filter((row) => !row.finished_at &&
            (!row.due_at || new Date(row.due_at) <= new Date()) &&
            (!args.p_order_id || row.order_id === args.p_order_id));
          for (const row of ready) row.attempts += 1;
          return { data: ready.map((row) => ({ ...row })), error: null };
        }
        if (name === 'nm_paid_delivery_context') return { data: context, error: null };
        throw new Error(`rpc inesperada ${name}`);
      },
      from: () => ({
        update: (values: Partial<Row>) => {
          const filter: Record<string, string> = {};
          const chain = {
            eq(column: string, value: string) {
              filter[column] = value;
              if (Object.keys(filter).length === 3) {
                const row = rows.get(key(filter.order_id, filter.destination));
                if (row) Object.assign(row, values);
                return Promise.resolve({ error: null });
              }
              return chain;
            },
          };
          return chain;
        },
      }),
    },
  },
});

mock.module('./posthog-server', {
  namedExports: {
    posthogServerConfigured: () => posthogConfigured,
    posthogEventUuid: (event: string, id: string) => `uuid:${event}:${id}`,
    deliverServerEvent: async (params: { uuid?: string; properties: Record<string, unknown> }) => {
      posthogCalls.push(params);
      return posthogAccepts;
    },
  },
});

mock.module('./ga4-mp', {
  namedExports: {
    sendGa4Purchase: async (params: Record<string, unknown>) => {
      gaCalls.push(params);
      return 'sent';
    },
  },
});

const { drainPurchaseDeliveries, enqueuePurchase } = await import('./purchase-delivery');

const purchase = {
  distinctId: 'anon_visitor_1',
  amountCents: 9800,
  currency: 'BRL',
  product: 'nome_social' as const,
  kind: 'new' as const,
  paymentMethod: 'card' as const,
};
const consented = {
  click: {
    touch: { channel: 'google_ads', campaign_id: '356000', utm_source: 'google', utm_medium: 'cpc' },
    first_at: '2026-11-28T12:00:00.000Z',
  },
  ga: { client_id: '123.456', session_id: 1764331200 },
  ads: true,
};

describe('purchase-delivery · DEV-356', () => {
  beforeEach(() => {
    rows.clear();
    context = structuredClone(consented);
    posthogConfigured = true;
    posthogAccepts = true;
    posthogCalls.length = 0;
    gaCalls.length = 0;
  });

  it('um pedido gera um purchase por destino, com valor, moeda e campanha, e a reentrega não repete', async () => {
    const paidAt = new Date('2026-11-28T12:10:00.000Z');
    await enqueuePurchase('cs_test_card', 'fixture-checkout', paidAt, purchase);
    assert.deepEqual(await drainPurchaseDeliveries('cs_test_card'), { sent: 2, skipped: 0, retry: 0, failed: 0 });

    await enqueuePurchase('cs_test_card', 'fixture-checkout', paidAt, purchase);
    assert.deepEqual(await drainPurchaseDeliveries('cs_test_card'), { sent: 0, skipped: 0, retry: 0, failed: 0 });

    assert.equal(posthogCalls.length, 1);
    assert.equal(posthogCalls[0].uuid, 'uuid:purchase:cs_test_card');
    assert.equal(posthogCalls[0].properties.value, 98);
    assert.equal(posthogCalls[0].properties.currency, 'BRL');
    assert.equal(posthogCalls[0].properties.session_id, 'cs_test_card');
    assert.equal(posthogCalls[0].properties.paid_campaign_id, '356000');
    assert.equal(gaCalls.length, 1);
    assert.equal(gaCalls[0].transactionId, 'cs_test_card');
    assert.equal(gaCalls[0].value, 98);
    assert.equal(gaCalls[0].adsConsent, true);
  });

  it('PostHog sem chave no ambiente fica skipped, sem tentativas nem falha', async () => {
    posthogConfigured = false;
    await enqueuePurchase('cs_test_sem_chave', 'fixture-checkout', new Date(), purchase);
    assert.deepEqual(await drainPurchaseDeliveries('cs_test_sem_chave'), { sent: 1, skipped: 1, retry: 0, failed: 0 });
    assert.equal(posthogCalls.length, 0);
    assert.equal(rows.get(key('cs_test_sem_chave', 'posthog'))?.outcome, 'skipped');
  });

  it('consentimento revogado depois do checkout bloqueia PostHog e GA4', async () => {
    context = null;
    await enqueuePurchase('cs_test_revogado', 'fixture-checkout', new Date(), { ...purchase, paymentMethod: 'pix' });
    assert.deepEqual(await drainPurchaseDeliveries('cs_test_revogado'), { sent: 0, skipped: 2, retry: 0, failed: 0 });
    assert.equal(posthogCalls.length, 0);
    assert.equal(gaCalls.length, 0);
  });

  it('sem anúncios consentidos o purchase sai sem campanha e o GA4 recebe ad_user_data negado', async () => {
    context = { click: null, ga: consented.ga, ads: false };
    await enqueuePurchase('cs_test_sem_ads', 'fixture-checkout', new Date(), purchase);
    await drainPurchaseDeliveries('cs_test_sem_ads');
    assert.equal(posthogCalls[0].properties.paid_campaign_id, undefined);
    assert.equal(gaCalls[0].adsConsent, false);
  });

  it('falha do PostHog configurado vira retry e mantém a linha aberta', async () => {
    posthogAccepts = false;
    await enqueuePurchase('cs_test_retry', 'fixture-checkout', new Date(), purchase);
    assert.deepEqual(await drainPurchaseDeliveries('cs_test_retry'), { sent: 1, skipped: 0, retry: 1, failed: 0 });
    assert.equal(rows.get(key('cs_test_retry', 'posthog'))?.finished_at, null);
  });
});
