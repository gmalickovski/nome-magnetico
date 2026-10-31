import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

const notifyCalls: { event: string; payload: Record<string, unknown> }[] = [];
const callOrder: string[] = [];
let notifyReturnValue = true;

const subscription = {
  id: '00000000-0000-4000-8000-000000000001',
  product_type: 'nome_social',
  stripe_payment_intent_id: null as string | null,
  amount_paid: 0,
  payment_provider: 'test' as const,
  starts_at: '2026-10-25T00:00:00.000Z',
};

mock.module('../../backend/db/subscriptions', {
  namedExports: {
    getRefundableSubscriptions: async () => [subscription],
    refundSubscription: async () => {
      callOrder.push('refundSubscription');
    },
  },
});

mock.module('../../backend/payments/stripe', {
  namedExports: {
    createRefund: async () => {
      callOrder.push('createRefund');
      return { id: 're_1' };
    },
    PRODUCT_NAMES: { nome_social: 'Nome Social' },
  },
});

mock.module('../../backend/db/users', {
  namedExports: {
    getProfile: async () => ({
      id: 'user-1',
      email: 'test@example.com',
      nome: 'Teste',
    }),
  },
});

mock.module('../../backend/notifications/notify', {
  namedExports: {
    notify: async (event: string, payload: Record<string, unknown>) => {
      callOrder.push(`notify:${event}`);
      notifyCalls.push({ event, payload });
      return notifyReturnValue;
    },
    publishAccessAttributes: async () => {},
  },
});

const { POST } = await import('./request-refund');

describe('request-refund · provider test', () => {
  beforeEach(() => {
    notifyCalls.length = 0;
    callOrder.length = 0;
    notifyReturnValue = true;
    subscription.stripe_payment_intent_id = null;
  });

  it('marca skipAdminSlack no refund.requested e payment.refunded para não avisar Slack', async () => {
    const res = await POST({
      request: new Request('http://localhost/api/request-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: '00000000-0000-4000-8000-000000000001' }),
      }),
      locals: { user: { id: 'user-1', email: 'test@example.com' } },
    } as never);

    assert.equal(res.status, 200);
    assert.equal(notifyCalls.length, 2);
    assert.equal(notifyCalls[0]?.event, 'refund.requested');
    assert.equal(notifyCalls[0]?.payload.skipAdminSlack, true);
    assert.equal(notifyCalls[1]?.event, 'payment.refunded');
    assert.equal(notifyCalls[1]?.payload.skipAdminSlack, true);
  });

  it('chama notify com refund.requested ANTES de createRefund no Stripe com o payload esperado', async () => {
    subscription.stripe_payment_intent_id = 'pi_test_123';

    const res = await POST({
      request: new Request('http://localhost/api/request-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: '00000000-0000-4000-8000-000000000001',
          reason: 'Insatisfação com o serviço',
        }),
      }),
      locals: { user: { id: 'user-1', email: 'test@example.com' } },
    } as never);

    assert.equal(res.status, 200);
    assert.equal(notifyCalls.length, 2);

    const firstNotify = notifyCalls[0];
    assert.equal(firstNotify?.event, 'refund.requested');
    assert.deepEqual(firstNotify?.payload, {
      email: 'test@example.com',
      firstName: 'Teste',
      userId: 'user-1',
      subscriptionId: '00000000-0000-4000-8000-000000000001',
      productType: 'nome_social',
      productName: 'Nome Social',
      amount: 0,
      amount_formatted: 'R$ 0,00',
      purchasedAt: '2026-10-25T00:00:00.000Z',
      requestedAt: firstNotify?.payload.requestedAt,
      reason: 'Insatisfação com o serviço',
      paymentProvider: 'test',
      skipAdminSlack: true,
    });
    assert.ok(typeof firstNotify?.payload.requestedAt === 'string');

    // Verifica que refund.requested ocorreu ANTES de createRefund
    const notifyIndex = callOrder.indexOf('notify:refund.requested');
    const stripeRefundIndex = callOrder.indexOf('createRefund');
    assert.ok(notifyIndex !== -1, 'notify:refund.requested deve ter sido chamado');
    assert.ok(stripeRefundIndex !== -1, 'createRefund deve ter sido chamado');
    assert.ok(notifyIndex < stripeRefundIndex, 'notify:refund.requested deve preceder createRefund');
  });

  it('continua o reembolso e retorna 200 mesmo se notify devolver false', async () => {
    subscription.stripe_payment_intent_id = 'pi_test_123';
    notifyReturnValue = false;

    const res = await POST({
      request: new Request('http://localhost/api/request-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: '00000000-0000-4000-8000-000000000001',
          reason: 'Motivo qualquer',
        }),
      }),
      locals: { user: { id: 'user-1', email: 'test@example.com' } },
    } as never);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(callOrder.includes('createRefund'), 'createRefund foi chamado com sucesso');
    assert.ok(callOrder.includes('refundSubscription'), 'refundSubscription foi chamado com sucesso');
  });

  it('DEV-259: amount_paid null vira amount 0 e amount_formatted R$ 0,00 nos 2 eventos', async () => {
    (subscription as { amount_paid: number | null }).amount_paid = null;
    try {
      const res = await POST({
        request: new Request('http://localhost/api/request-refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId: '00000000-0000-4000-8000-000000000001' }),
        }),
        locals: { user: { id: 'user-1', email: 'test@example.com' } },
      } as never);
      assert.equal(res.status, 200);
      assert.equal(notifyCalls.length, 2);
      for (const call of notifyCalls) {
        assert.equal(call.payload.amount, 0);
        assert.equal(String(call.payload.amount_formatted).replace(/\u00a0/g, ' '), 'R$ 0,00');
      }
      assert.equal(notifyCalls[1]?.payload.userId, 'user-1');
    } finally {
      subscription.amount_paid = 0;
    }
  });
});