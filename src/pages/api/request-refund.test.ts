import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

const notifyCalls: { event: string; payload: Record<string, unknown> }[] = [];

const subscription = {
  id: '00000000-0000-4000-8000-000000000001',
  product_type: 'nome_social',
  stripe_payment_intent_id: null,
  amount_paid: 0,
  payment_provider: 'test' as const,
};

mock.module('../../backend/db/subscriptions', {
  namedExports: {
    getRefundableSubscriptions: async () => [subscription],
    refundSubscription: async () => {},
  },
});

mock.module('../../backend/payments/stripe', {
  namedExports: {
    createRefund: async () => ({ id: 're_1' }),
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
      notifyCalls.push({ event, payload });
      return true;
    },
    publishAccessAttributes: async () => {},
  },
});

const { POST } = await import('./request-refund');

describe('request-refund · provider test', () => {
  beforeEach(() => {
    notifyCalls.length = 0;
  });

  it('marca skipAdminSlack no payment.refunded para não avisar Slack', async () => {
    const res = await POST({
      request: new Request('http://localhost/api/request-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: '00000000-0000-4000-8000-000000000001' }),
      }),
      locals: { user: { id: 'user-1', email: 'test@example.com' } },
    } as never);

    assert.equal(res.status, 200);
    assert.equal(notifyCalls.length, 1);
    assert.equal(notifyCalls[0]?.event, 'payment.refunded');
    assert.equal(notifyCalls[0]?.payload.skipAdminSlack, true);
  });
});
