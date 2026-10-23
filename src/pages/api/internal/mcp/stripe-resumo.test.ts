import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { signInternalPayload } from '../../../../backend/security/hmac';

process.env.INTERNAL_HMAC_SECRET = 'test-hmac-secret-xyz';

const mockSubscriptions = [
  { amount_paid: 9700, product_type: 'nome_social', created_at: '2026-10-20T10:00:00Z', refunded_at: null },
  { amount_paid: 14700, product_type: 'nome_bebe', created_at: '2026-10-21T10:00:00Z', refunded_at: null },
];

const mockRefunds = [
  { amount_paid: 9700, refunded_at: '2026-10-22T08:00:00Z', refund_reason: 'Desistência' },
];

const mockActiveSubs = [
  { amount_paid: 9700 },
  { amount_paid: 14700 },
];

mock.module('../../../../backend/db/supabase', {
  namedExports: {
    getSupabaseAdmin: () => ({
      from: (table: string) => ({
        select: (fields: string) => ({
          gte: (col: string) => {
            if (col === 'created_at') {
              return {
                is: () => Promise.resolve({ data: mockSubscriptions, error: null }),
              };
            }
            if (col === 'refunded_at') {
              return Promise.resolve({ data: mockRefunds, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          },
          gt: () => ({
            is: () => Promise.resolve({ data: mockActiveSubs, error: null }),
          }),
        }),
      }),
    }),
  },
});

mock.module('../../../../backend/payments/stripe', {
  namedExports: {
    stripe: {
      balance: {
        retrieve: async () => ({
          available: [{ amount: 50000, currency: 'brl' }],
          pending: [{ amount: 15000, currency: 'brl' }],
        }),
      },
    },
  },
});

const { POST } = await import('./stripe-resumo');

describe('POST /api/internal/mcp/stripe-resumo', () => {
  const secret = 'test-hmac-secret-xyz';

  it('rejeita requisições sem assinatura HMAC (401)', async () => {
    const req = new Request('http://localhost:4321/api/internal/mcp/stripe-resumo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodo: 'mes' }),
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 401);
  });

  it('retorna resumo financeiro e de saldo do Stripe', async () => {
    const now = Date.now();
    const body = JSON.stringify({ periodo: 'mes' });
    const sig = signInternalPayload({ rawBody: body, timestamp: now, secret });

    const req = new Request('http://localhost:4321/api/internal/mcp/stripe-resumo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(now),
      },
      body,
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.periodo, 'mes');
    assert.equal(data.vendas.total, 2);
    assert.equal(data.vendas.receita_centavos, 24400);
    assert.equal(data.vendas.receita_reais, 244.0);
    assert.equal(data.reembolsos.total, 1);
    assert.equal(data.reembolsos.valor_centavos, 9700);
    assert.equal(data.mrr.assinaturas_ativas, 2);
    assert.equal(data.mrr.mrr_estimado_centavos, 24400);
    assert.equal(data.stripe_balance.status, 'ok');
    assert.equal(data.stripe_balance.disponivel_centavos, 50000);
    assert.equal(data.stripe_balance.pendente_centavos, 15000);
  });
});
