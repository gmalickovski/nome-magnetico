import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { failedPaymentDeduplicator } from '../../backend/payments/cart-recovery';
import { resolveCheckoutDistinctId } from '../../backend/analytics/posthog-server';

type StripeEvent = {
  id: string;
  type: string;
  created?: number;
  data: { object: Record<string, unknown> };
};

let constructedEvent: StripeEvent;
const notifyCalls: { event: string; payload: Record<string, unknown> }[] = [];
const createCheckoutCalls: Record<string, unknown>[] = [];
const posthogCalls: Array<{ event: string; distinctId: string; sessionId?: string; properties: Record<string, unknown> }> = [];
let checkoutSessionUrl: string | null = 'https://checkout.stripe.com/pay/cs_recovery_new';
let hasActiveSubscription = false;
let claimResult: 'claimed' | 'duplicate' | 'error' = 'claimed';
const releaseCalls: Array<{ userId: string; productType: string }> = [];
const couponChanges: string[][] = [];
let reservationDbUnavailable = false;
let conversionDbUnavailable = false;
const paidOrders = new Set<string>();
const recordedOrders = new Map<string, Record<string, unknown>>();

const profile = {
  email: 'buyer@example.com',
  nome: null as string | null,
  role: 'user' as const,
};

mock.module('../../backend/payments/stripe', {
  namedExports: {
    constructWebhookEvent: () => constructedEvent,
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
    createSubscription: async ({ stripeSessionId }: { stripeSessionId: string }) => {
      const created = !paidOrders.has(stripeSessionId);
      paidOrders.add(stripeSessionId);
      return { subscription: {}, created };
    },
    refundSubscription: async () => {},
    getSubscriptionByPaymentIntent: async () => null,
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
      return true;
    },
    publishAccessAttributes: async () => true,
  },
});

mock.module('../../backend/analytics/posthog-server', {
  namedExports: {
    captureServerEvent: async (payload: typeof posthogCalls[number]) => { posthogCalls.push(payload); },
    deliverServerEvent: async () => true,
    posthogEventUuid: () => 'uuid-test',
    resolveCheckoutDistinctId,
  },
});

mock.module('../../backend/analytics/ga4-mp', {
  namedExports: {
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
    supabase: {
      from: () => ({ upsert: async () => ({ error: null }) }),
      async rpc(name: string, args: Record<string, unknown>) {
        if (name === 'nm_enqueue_purchase') {
          if (conversionDbUnavailable) return { error: true };
          const id = String(args.p_order_id);
          if (!recordedOrders.has(id)) recordedOrders.set(id, args.p_payload as Record<string, unknown>);
        }
        return { data: [], error: null };
      },
    },
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

mock.module('../../backend/payments/coupon-reservations', {
  namedExports: {
    confirmCouponReservation: async (id: string, session: string) => {
      if (reservationDbUnavailable) throw new Error('DB unavailable');
      couponChanges.push(['confirm', id, session]);
    },
    releaseCouponReservation: async (id: string) => { couponChanges.push(['release', id]); },
  },
});

mock.module('../../backend/auth/confirmEmail', {
  namedExports: {
    confirmEmailAfterPayment: async () => {},
  },
});

mock.module('../../backend/cache/memo', {
  namedExports: {
    invalidateUserSubscriptionsCache: () => {},
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
    failedPaymentDeduplicator.reset();
    notifyCalls.length = 0;
    createCheckoutCalls.length = 0;
    posthogCalls.length = 0;
    releaseCalls.length = 0;
    couponChanges.length = 0;
    reservationDbUnavailable = false;
    conversionDbUnavailable = false;
    paidOrders.clear();
    recordedOrders.clear();
    checkoutSessionUrl = 'https://checkout.stripe.com/pay/cs_recovery_new';
    hasActiveSubscription = false;
    claimResult = 'claimed';
    profile.nome = null;
  });

  it('DEV-276: purchase mantém a sessão do navegador e separa a sessão Stripe', async () => {
    const browserSessionId = '019af9f2-48f0-7a88-9a68-3c0202feb366';
    const metadata = {
      user_id: 'fixture-user', product_type: 'nome_social',
      ph_analytics_consent: '1', ph_distinct_id: 'visitor', ph_session_id: browserSessionId,
    };
    constructedEvent = {
      id: 'evt_posthog_purchase',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_posthog', customer_email: 'fixture@example.test', payment_status: 'paid', amount_total: 9700, currency: 'brl', metadata } },
    };
    assert.equal((await dispatchWebhook()).status, 200);
    assert.deepEqual(posthogCalls.map((call) => call.event), ['payment_confirmed', 'purchase']);
    const [legacy, purchase] = posthogCalls;
    assert.equal(purchase.distinctId, 'visitor');
    assert.equal(purchase.sessionId, browserSessionId);
    assert.equal(purchase.properties.session_id, 'cs_test_posthog');
    assert.equal(purchase.properties.stripe_session_id, 'cs_test_posthog');
    assert.equal(purchase.properties.email, undefined);
    assert.equal(legacy.properties.replaced_by, 'purchase');
  });

  it('DEV-353 registra cartão e Pix confirmado e recupera fila perdida na reentrega sem repetir acesso', async () => {
    const previous = process.env.PAID_ATTRIBUTION_ENABLED;
    process.env.PAID_ATTRIBUTION_ENABLED = '1';
    const card = {
      id: 'cs_test_fixture_card', payment_status: 'paid', amount_total: 9700, currency: 'brl',
      metadata: { user_id: 'user-1', product_type: 'nome_social', paid_attribution_ref: 'fixture' },
    };
    const created = Math.floor(Date.now() / 1000);
    try {
      constructedEvent = { id: 'evt_card', type: 'checkout.session.completed', created, data: { object: card } };
      assert.equal((await dispatchWebhook()).status, 200);
      const pix = { ...card, id: 'cs_test_fixture_pix', payment_status: 'unpaid' };
      constructedEvent = { id: 'evt_pix_pending', type: 'checkout.session.completed', created, data: { object: pix } };
      assert.equal((await dispatchWebhook()).status, 200);
      assert.equal(recordedOrders.size, 1);
      assert.equal(recordedOrders.get(card.id)?.paymentMethod, 'card');

      constructedEvent = {
        id: 'evt_pix_paid', type: 'checkout.session.async_payment_succeeded', created: created + 3600,
        data: { object: { ...pix, payment_status: 'paid' } },
      };
      conversionDbUnavailable = true;
      assert.equal((await dispatchWebhook()).status, 503);
      assert.equal(paidOrders.size, 2);
      conversionDbUnavailable = false;
      assert.equal((await dispatchWebhook()).status, 200);
      assert.equal((await dispatchWebhook()).status, 200);
      assert.equal(recordedOrders.size, 2);
      assert.equal(recordedOrders.get(pix.id)?.paymentMethod, 'pix');
    } finally {
      if (previous === undefined) delete process.env.PAID_ATTRIBUTION_ENABLED;
      else process.env.PAID_ATTRIBUTION_ENABLED = previous;
    }
  });

  it('DEV-268: Pix pendente mantém a reserva e Pix confirmado registra o uso', async () => {
    const session = {
      id: 'cs_coupon',
      payment_status: 'unpaid',
      metadata: { user_id: 'user-1', product_type: 'nome_social', coupon_reservation_id: 'reservation-1' },
    };
    constructedEvent = { id: 'evt_pending', type: 'checkout.session.completed', data: { object: session } };
    assert.equal((await dispatchWebhook()).status, 200);
    assert.deepEqual(couponChanges, []);

    constructedEvent = {
      id: 'evt_paid',
      type: 'checkout.session.async_payment_succeeded',
      data: { object: { ...session, payment_status: 'paid' } },
    };
    reservationDbUnavailable = true;
    assert.equal((await dispatchWebhook()).status, 503);
    reservationDbUnavailable = false;
    assert.equal((await dispatchWebhook()).status, 200);
    assert.deepEqual(couponChanges, [['confirm', 'reservation-1', 'cs_coupon']]);
  });

  for (const eventType of ['checkout.session.expired', 'checkout.session.async_payment_failed']) {
    it(`DEV-268: libera a reserva em ${eventType}`, async () => {
      constructedEvent = {
        id: 'evt_coupon_release',
        type: eventType,
        data: { object: { id: 'cs_coupon', metadata: { recovery: '1', coupon_reservation_id: 'reservation-1' } } },
      };
      assert.equal((await dispatchWebhook()).status, 200);
      assert.deepEqual(couponChanges, [['release', 'reservation-1']]);
    });
  }

  it('DEV-268: recuperação do carrinho usa o preço vigente sem repetir o cupom', async () => {
    constructedEvent = {
      id: 'evt_coupon_recovery',
      type: 'checkout.session.expired',
      data: { object: {
        id: 'cs_coupon',
        amount_total: 7700,
        metadata: {
          user_id: 'user-1', product_type: 'nome_social', final_cents: '7700',
          discount_source: 'coupon', coupon_code: 'CUPOM-TESTE', coupon_reservation_id: 'reservation-1',
        },
      } },
    };
    assert.equal((await dispatchWebhook()).status, 200);
    assert.deepEqual(couponChanges, [['release', 'reservation-1']]);
    assert.equal(createCheckoutCalls[0]?.unitAmount, 9700);
    assert.equal(createCheckoutCalls[0]?.couponCode, undefined);
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
