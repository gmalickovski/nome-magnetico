import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

const notifyCalls: { event: string; payload: Record<string, unknown> }[] = [];
let createResult = { created: true, subscription: { id: 'sub-1', payment_provider: 'test' } };

mock.module('../cache/memo', {
  namedExports: {
    invalidateUserSubscriptionsCache: () => {},
  },
});

mock.module('../db/subscriptions', {
  namedExports: {
    createSubscription: async () => createResult,
  },
});

mock.module('../db/users', {
  namedExports: {
    getProfile: async () => ({
      id: 'user-1',
      email: 'test@example.com',
      nome: 'Teste',
    }),
  },
});

mock.module('../notifications/notify', {
  namedExports: {
    notify: async (event: string, payload: Record<string, unknown>) => {
      notifyCalls.push({ event, payload });
      return true;
    },
  },
});

mock.module('../../sentry/fluxo', {
  namedExports: {
    captureFluxoException: () => {},
  },
});

mock.module('../../utils/public-url', {
  namedExports: {
    getPublicBaseUrl: () => 'https://www.nomemagnetico.com.br',
  },
});

const { processTestCheckoutSuccess } = await import('./test-checkout-success');

describe('processTestCheckoutSuccess', () => {
  beforeEach(() => {
    notifyCalls.length = 0;
    createResult = { created: true, subscription: { id: 'sub-1', payment_provider: 'test' } };
  });

  it('dispara payment.confirmed com payload alinhado ao webhook Stripe', async () => {
    await processTestCheckoutSuccess({
      userId: 'user-1',
      productType: 'nome_social',
      stripeSessionId: 'bypass_test_123',
      purchaseKind: 'new',
      amountPaid: 0,
    });

    assert.equal(notifyCalls.length, 1);
    assert.equal(notifyCalls[0]?.event, 'payment.confirmed');
    assert.equal(notifyCalls[0]?.payload.email, 'test@example.com');
    assert.equal(notifyCalls[0]?.payload.firstName, 'Teste');
    assert.equal(notifyCalls[0]?.payload.productType, 'nome_social');
    assert.match(String(notifyCalls[0]?.payload.accessUrl), /\/app\/analise\/nome-social$/);
    assert.equal(notifyCalls[0]?.payload.amount, 0);
    assert.equal(notifyCalls.some((c) => c.event === 'admin.new_payment'), false);
  });

  it('não reenvia payment.confirmed quando a sessão já existia', async () => {
    createResult = { created: false, subscription: { id: 'sub-1', payment_provider: 'test' } };

    await processTestCheckoutSuccess({
      userId: 'user-1',
      productType: 'nome_social',
      stripeSessionId: 'bypass_test_dup',
      purchaseKind: 'new',
    });

    assert.equal(notifyCalls.length, 0);
  });
});
