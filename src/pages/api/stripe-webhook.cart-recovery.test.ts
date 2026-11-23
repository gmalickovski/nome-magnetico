import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { failedPaymentDeduplicator } from '../../backend/payments/cart-recovery';
import { clearCache } from '../../backend/cache/memo';

type StripeEvent = {
  id: string;
  type: string;
  livemode?: boolean;
  data: { object: Record<string, unknown> };
};

let constructedEvent: StripeEvent;
const notifyCalls: { event: string; payload: Record<string, unknown> }[] = [];
const createCheckoutCalls: Record<string, unknown>[] = [];
let checkoutSessionUrl: string | null = 'https://checkout.stripe.com/pay/cs_recovery_new';
let hasActiveSubscription = false;
let claimResult: 'claimed' | 'duplicate' | 'error' = 'claimed';
const releaseCalls: Array<{ userId: string; productType: string }> = [];
const fixtureUserId = 'abf00000-0000-4000-8000-000000000001';
let notifyOk = true;
let disputeSubscription: Record<string, unknown> | null = null;

const profile = {
  email: 'buyer@example.com',
  nome: null as string | null,
  role: 'user' as const,
};

mock.module('../../backend/payments/stripe', {
  namedExports: {
    constructWebhookEvent: () => constructedEvent,
    stripe: {
      charges: { retrieve: async () => ({ metadata: { product_type: 'nome_bebe', user_id: fixtureUserId } }) },
      paymentIntents: { retrieve: async () => ({ metadata: { product_type: 'nome_empresa', user_id: fixtureUserId } }) },
    },
    createCheckoutSession: async (params: Record<string, unknown>) => {
      createCheckoutCalls.push(params);
      return { url: checkoutSessionUrl, id: 'cs_new_recovery' };
    },
    PRODUCT_NAMES: {
      nome_social: 'Nome Social',
      nome_bebe: 'Nome Bebê',
      nome_empresa: 'Nome Empresa',
    },
  },
});

mock.module('../../backend/db/users', {
  namedExports: {
    getProfile: async () => profile,
  },
});

mock.module('../../backend/db/subscriptions', {
  namedExports: {
    hasActiveSubscription: async () => hasActiveSubscription,
    createSubscription: async () => ({ subscription: {}, created: true }),
    refundSubscription: async () => {},
    getSubscriptionByPaymentIntent: async () => disputeSubscription,
  },
});

mock.module('../../backend/db/cart-recovery-sends', {
  namedExports: {
    claimCartRecoverySend: async () => claimResult,
    releaseCartRecoverySend: async (userId: string, productType: string) => {
      releaseCalls.push({ userId, productType });
    },
  },
});

mock.module('../../backend/pricing/service', {
  namedExports: {
    getEffectivePriceCore: async () => ({
      final_cents: 9700,
      base_cents: 9700,
      min_cents: 0,
      discountSource: 'none',
    }),
  },
});

mock.module('../../backend/notifications/notify', {
  namedExports: {
    notify: async (event: string, payload: Record<string, unknown>) => {
      notifyCalls.push({ event, payload });
      return notifyOk;
    },
    publishAccessAttributes: async () => true,
  },
});

mock.module('../../backend/analytics/posthog-server', {
  namedExports: {
    captureServerEvent: async () => {},
    posthogEventUuid: () => 'uuid-test',
    resolveCheckoutDistinctId: () => 'distinct-test',
  },
});

mock.module('../../backend/analytics/ga4-mp', {
  namedExports: {
    resolveGaClientId: () => 'ga-test',
    sendGa4Purchase: async () => {},
  },
});

mock.module('../../backend/analytics/ga4', {
  namedExports: {
    trackPurchaseConfirmed: async () => {},
  },
});

mock.module('../../sentry/fluxo', {
  namedExports: {
    captureFluxoException: () => {},
  },
});

mock.module('../../backend/db/supabase', {
  namedExports: {
    supabase: { from: () => ({ upsert: async () => ({ error: null }) }) },
  },
});

mock.module('../../utils/public-url', {
  namedExports: {
    getPublicBaseUrl: () => 'https://www.nomemagnetico.com.br',
  },
});

mock.module('../../backend/payments/prices', {
  namedExports: {
    recordAccessCouponUse: async () => {},
  },
});

mock.module('../../backend/auth/confirmEmail', {
  namedExports: {
    confirmEmailAfterPayment: async () => {},
  },
});

mock.module('../../backend/payments/admin-slack', {
  namedExports: {
    shouldNotifyAdminSlackForProvider: () => false,
  },
});

mock.module('../../backend/payments/checkout-access', {
  namedExports: {
    productAnalysisAppPath: () => '/app/nome-social',
  },
});

mock.module('../../backend/notifications/payment-confirmed-payload', {
  namedExports: {
    buildPaymentConfirmedPayload: () => null,
  },
});

const { POST } = await import('./stripe-webhook');

async function dispatchWebhook() {
  return POST({
    request: new Request('http://localhost/api/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=test' },
      body: '{}',
    }),
  } as Parameters<typeof POST>[0]);
}

describe('stripe-webhook · cart recovery (DEV-278)', () => {
  beforeEach(() => {
    clearCache();
    failedPaymentDeduplicator.reset();
    notifyCalls.length = 0;
    createCheckoutCalls.length = 0;
    releaseCalls.length = 0;
    notifyOk = true;
    disputeSubscription = null;
    checkoutSessionUrl = 'https://checkout.stripe.com/pay/cs_recovery_new';
    hasActiveSubscription = false;
    claimResult = 'claimed';
    profile.nome = null;
  });

  function disputeEvent(overrides: Partial<StripeEvent> = {}, dispute: Record<string, unknown> = {}): StripeEvent {
    return {
      id: 'evt_fixture270',
      type: 'charge.dispute.created',
      livemode: true,
      data: { object: {
        id: 'dp_fixture270', amount: 6590, currency: 'brl', livemode: true,
        reason: 'fraudulent', status: 'needs_response', charge: 'ch_fixture270',
        payment_intent: {
          id: 'pi_fixture270',
          metadata: { product_type: 'nome_social', user_id: fixtureUserId, email: 'fixture@example.test' },
        },
        ...dispute,
      } },
      ...overrides,
    };
  }

  it('DEV-270: abre um alerta de disputa com o contrato do n8n e sem contatos', async () => {
    constructedEvent = disputeEvent();
    const results = await Promise.all([dispatchWebhook(), dispatchWebhook()]);
    assert.deepEqual(results.map((response) => response.status), [200, 200]);
    assert.deepEqual(notifyCalls, [{
      event: 'payment.chargeback',
      payload: {
        payment_id: 'pi_fixture270', productType: 'nome_social', userId: fixtureUserId,
        amount: 6590, amount_formatted: 'R$ 65,90',
        reason: 'fraudulent', status: 'needs_response', payment_provider: 'stripe', livemode: true,
      },
    }]);
  });

  it('DEV-270: não envia alerta em sandbox nem em disputas encerradas', async () => {
    for (const event of [
      disputeEvent({ livemode: false }),
      disputeEvent({ type: 'charge.dispute.closed' }),
      disputeEvent({}, { status: 'won' }),
      disputeEvent({}, { livemode: false }),
    ]) {
      constructedEvent = event;
      assert.equal((await dispatchWebhook()).status, 200);
    }
    assert.deepEqual(notifyCalls, []);
  });

  it('DEV-270: identifica a compra pela assinatura e depois pelos metadados Stripe', async () => {
    disputeSubscription = { product_type: 'nome_social', user_id: fixtureUserId, payment_provider: 'stripe' };
    constructedEvent = disputeEvent({}, { payment_intent: 'pi_fixture270' });
    assert.equal((await dispatchWebhook()).status, 200);
    assert.equal(notifyCalls[0]?.payload.productType, 'nome_social');

    disputeSubscription = null;
    constructedEvent = disputeEvent({}, { id: 'dp_intent270', payment_intent: 'pi_intent270' });
    assert.equal((await dispatchWebhook()).status, 200);
    assert.equal(notifyCalls[1]?.payload.productType, 'nome_empresa');

    constructedEvent = disputeEvent({}, { id: 'dp_charge270', payment_intent: null });
    assert.equal((await dispatchWebhook()).status, 200);
    assert.equal(notifyCalls[2]?.payload.payment_id, 'ch_fixture270');
    assert.equal(notifyCalls[2]?.payload.productType, 'nome_bebe');
  });

  it('DEV-270: pede reentrega ao Stripe se o n8n recusar o evento', async () => {
    constructedEvent = disputeEvent();
    notifyOk = false;
    assert.equal((await dispatchWebhook()).status, 503);
    notifyOk = true;
    assert.equal((await dispatchWebhook()).status, 200);
    assert.equal((await dispatchWebhook()).status, 200);
    assert.equal(notifyCalls.length, 2);
  });

  it('checkout.session.expired emite só cart.abandoned (sem payment.failed)', async () => {
    constructedEvent = {
      id: 'evt_expired_1',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_expired_1',
          metadata: { user_id: 'user-1', product_type: 'nome_social', final_cents: '9700' },
          amount_total: 9700,
        },
      },
    };

    await dispatchWebhook();

    const events = notifyCalls.map((c) => c.event);
    assert.equal(events.includes('payment.failed'), false);
    assert.equal(events.includes('cart.abandoned'), true);
    assert.equal(createCheckoutCalls.length, 1);
    assert.equal(createCheckoutCalls[0]?.recovery, true);
  });

  it('checkout.session.expired com recovery=1 não emite cart.abandoned', async () => {
    constructedEvent = {
      id: 'evt_expired_recovery',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_expired_recovery',
          metadata: { user_id: 'user-1', product_type: 'nome_social', recovery: '1' },
        },
      },
    };

    await dispatchWebhook();
    assert.equal(notifyCalls.length, 0);
  });

  it('async_payment_failed com recovery=1 não emite eventos transacionais', async () => {
    constructedEvent = {
      id: 'evt_async_recovery',
      type: 'checkout.session.async_payment_failed',
      data: {
        object: {
          id: 'cs_async_recovery',
          metadata: { user_id: 'user-1', product_type: 'nome_social', recovery: '1' },
        },
      },
    };

    await dispatchWebhook();
    assert.equal(notifyCalls.length, 0);
  });

  it('payment_intent.payment_failed com recovery=1 não emite eventos transacionais', async () => {
    constructedEvent = {
      id: 'evt_pi_recovery',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_recovery_fail',
          metadata: { user_id: 'user-1', product_type: 'nome_social', recovery: '1' },
          amount: 9700,
        },
      },
    };

    await dispatchWebhook();
    assert.equal(notifyCalls.length, 0);
  });

  it('payment_intent.payment_failed usa firstName com fallback no payment.failed', async () => {
    constructedEvent = {
      id: 'evt_pi_declined',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_declined_1',
          metadata: { user_id: 'user-1', product_type: 'nome_social', final_cents: '9700' },
          amount: 9700,
          last_payment_error: { payment_method: { type: 'card' }, message: 'declined' },
          payment_method_types: ['card', 'pix'],
        },
      },
    };

    await dispatchWebhook();
    const failed = notifyCalls.find((c) => c.event === 'payment.failed');
    assert.ok(failed);
    assert.equal(failed.payload.firstName, 'buyer');
  });

  it('libera claim quando createCheckoutSession não devolve URL', async () => {
    checkoutSessionUrl = null;
    constructedEvent = {
      id: 'evt_expired_no_url',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_expired_no_url',
          metadata: { user_id: 'user-1', product_type: 'nome_social', final_cents: '9700' },
          amount_total: 9700,
        },
      },
    };

    await dispatchWebhook();
    assert.equal(notifyCalls.some((c) => c.event === 'cart.abandoned'), false);
    assert.deepEqual(releaseCalls, [{ userId: 'user-1', productType: 'nome_social' }]);
  });
});
