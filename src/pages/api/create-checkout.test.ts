import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { COUPON_ACCOUNT_INELIGIBLE, type HqCouponValidation } from '../../backend/payments/promo-math';

type ProfileRow = {
  role: 'user' | 'admin';
  is_test: boolean;
  test_ends_at: string | null;
};

let profile: ProfileRow = { role: 'user', is_test: false, test_ends_at: null };
let hasActiveProductSubscription = false;
let ownedAnalysisId: string | null = null;
const testCheckoutCalls: unknown[] = [];
const notifyCalls: { event: string; payload: Record<string, unknown> }[] = [];
const stripeSessionCalls: Record<string, unknown>[] = [];
let allowStripeSession = false;
let couponValidation: HqCouponValidation | null = null;
let discountSource: 'none' | 'coupon' | 'promotion' = 'none';
let availableReservation: string | null = null;
const releasedReservations: string[] = [];

function profileFrom() {
  const builder = {
    select() {
      return builder;
    },
    eq() {
      return builder;
    },
    single() {
      return Promise.resolve({ data: profile, error: null });
    },
  };
  return builder;
}

function analysesFrom() {
  let queriedId = '';
  let queriedUser = '';
  const builder = {
    select() {
      return builder;
    },
    eq(col: string, val: string) {
      if (col === 'id') queriedId = val;
      if (col === 'user_id') queriedUser = val;
      return builder;
    },
    maybeSingle() {
      if (ownedAnalysisId && queriedId === ownedAnalysisId && queriedUser === 'user-1') {
        return Promise.resolve({ data: { id: ownedAnalysisId }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
  };
  return builder;
}

function chatChoicesFrom() {
  return {
    upsert() {
      return Promise.resolve({ data: null, error: null });
    },
  };
}

mock.module('../../backend/db/supabase', {
  namedExports: {
    supabase: {
      from(table: string) {
        if (table === 'profiles') return profileFrom();
        if (table === 'analyses') return analysesFrom();
        if (table === 'chat_checkout_choices') return chatChoicesFrom();
        throw new Error(`unexpected table ${table}`);
      },
    },
  },
});

mock.module('../../backend/db/subscriptions', {
  namedExports: {
    hasActiveProductSubscription: async () => hasActiveProductSubscription,
  },
});

mock.module('../../backend/payments/test-checkout-success', {
  namedExports: {
    processTestCheckoutSuccess: async (args: unknown) => {
      testCheckoutCalls.push(args);
    },
  },
});

mock.module('../../backend/notifications/notify', {
  namedExports: {
    notify: async (event: string, payload: Record<string, unknown>) => {
      notifyCalls.push({ event, payload });
      return true;
    },
  },
});

mock.module('../../backend/payments/stripe', {
  namedExports: {
    stripe: { promotionCodes: { list: async () => ({ data: [] }) } },
    createCheckoutSession: async (params: Record<string, unknown>) => {
      if (!allowStripeSession) {
        throw new Error('stripe should not run in these tests');
      }
      stripeSessionCalls.push(params);
      return { url: 'https://checkout.stripe.com/pay/cs_test_123' };
    },
  },
});

mock.module('../../backend/pricing/service', {
  namedExports: {
    getEffectivePriceCore: async () => ({
      final_cents: 9700,
      base_cents: 9700,
      min_cents: 0,
      discountSource,
    }),
  },
});

mock.module('../../backend/payments/coupon-reservations', {
  namedExports: {
    reserveCouponUse: async () => {
      const id = availableReservation;
      availableReservation = null;
      return id;
    },
    releaseCouponReservation: async (id: string) => { releasedReservations.push(id); },
  },
});

mock.module('../../backend/payments/prices', {
  namedExports: {
    effectiveResultToPriceInfo: (effective: unknown) => effective,
    validateAccessCoupon: async () => couponValidation,
  },
});

mock.module('../../backend/pricing/effective-price', {
  namedExports: {
    effectiveFinalBelowFloor: () => false,
  },
});

mock.module('../../backend/analytics/ga4', {
  namedExports: {
    getGaClientIdFromRequest: () => undefined,
  },
});

mock.module('../../backend/analytics/posthog-server', {
  namedExports: {
    captureServerEvent: async () => {},
    readPostHogDistinctIdFromCookie: () => undefined,
    sanitizeDistinctId: (id: string | undefined) => id,
  },
});

mock.module('../../backend/utils/error-logger', {
  namedExports: {
    logError: async () => {},
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

const { createCheckoutResponse } = await import('./create-checkout');

function post(body: object, userOverrides: { email_confirmed_at?: string | null } = {}) {
  return createCheckoutResponse({
    request: new Request('http://localhost/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    user: {
      id: 'user-1',
      email: 'buyer@example.com',
      email_confirmed_at:
        'email_confirmed_at' in userOverrides
          ? userOverrides.email_confirmed_at
          : '2026-10-01T00:00:00.000Z',
    },
    url: new URL('http://localhost/api/create-checkout'),
  });
}

describe('create-checkout · DEV-239', () => {
  beforeEach(() => {
    profile = { role: 'user', is_test: false, test_ends_at: null };
    hasActiveProductSubscription = false;
    ownedAnalysisId = null;
    allowStripeSession = false;
    couponValidation = null;
    discountSource = 'none';
    availableReservation = null;
    releasedReservations.length = 0;
    testCheckoutCalls.length = 0;
    notifyCalls.length = 0;
    stripeSessionCalls.length = 0;
  });

  it('comprador real com produto ativo retorna 409 already_active', async () => {
    hasActiveProductSubscription = true;

    const res = await post({ product_type: 'nome_social' });
    const data = await res.json();

    assert.equal(res.status, 409);
    assert.equal(data.code, 'already_active');
    assert.equal(testCheckoutCalls.length, 0);
  });

  it('retorna o motivo da inelegibilidade e impede criar a sessão Stripe', async () => {
    couponValidation = { valid: false, error: COUPON_ACCOUNT_INELIGIBLE };
    allowStripeSession = true;

    const res = await post({ product_type: 'nome_social', couponCode: 'CUPOM-TESTE' });

    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, COUPON_ACCOUNT_INELIGIBLE);
    assert.equal(stripeSessionCalls.length, 0);
  });

  it('impede criar checkout com cupom quando a validação fica indisponível', async () => {
    allowStripeSession = true;

    const res = await post({ product_type: 'nome_social', couponCode: 'CUPOM-TESTE' });

    assert.equal(res.status, 503);
    assert.equal(stripeSessionCalls.length, 0);
  });

  it('DEV-268: somente o pedido que reservou o cupom abre uma sessão Stripe', async () => {
    couponValidation = { valid: true, accessCodeId: 'code-1', code: 'CUPOM-TESTE' };
    discountSource = 'coupon';
    availableReservation = 'reservation-1';
    allowStripeSession = true;
    const body = { product_type: 'nome_social', couponCode: 'CUPOM-TESTE' };

    const orders = await Promise.all([post(body), post(body)]);

    assert.deepEqual(orders.map((order) => order.status).sort(), [200, 409]);
    assert.equal(stripeSessionCalls.length, 1);
    assert.equal(stripeSessionCalls[0].couponReservationId, 'reservation-1');
    assert.deepEqual(releasedReservations, []);
  });

  it('DEV-268: libera a reserva quando a abertura da sessão falha', async () => {
    couponValidation = { valid: true, accessCodeId: 'code-1', code: 'CUPOM-TESTE' };
    discountSource = 'coupon';
    availableReservation = 'reservation-1';

    const res = await post({ product_type: 'nome_social', couponCode: 'CUPOM-TESTE' });

    assert.equal(res.status, 500);
    assert.deepEqual(releasedReservations, ['reservation-1']);
  });

  it('DEV-268: não reserva o cupom quando a promoção vence', async () => {
    couponValidation = { valid: true, accessCodeId: 'code-1', code: 'CUPOM-TESTE' };
    discountSource = 'promotion';
    availableReservation = 'reservation-1';
    allowStripeSession = true;

    const res = await post({ product_type: 'nome_social', couponCode: 'CUPOM-TESTE' });

    assert.equal(res.status, 200);
    assert.equal(availableReservation, 'reservation-1');
    assert.equal(stripeSessionCalls[0].couponCode, undefined);
  });

  it('perfil is_test sem assinatura ativa usa bypass test e não chama Stripe', async () => {
    profile = { role: 'user', is_test: true, test_ends_at: null };
    hasActiveProductSubscription = false;

    const res = await post({ product_type: 'nome_social' });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.bypass, true);
    assert.equal(testCheckoutCalls.length, 1);
    assert.equal(notifyCalls.some((c) => c.event === 'admin.new_payment'), false);
  });

  it('e-mail não confirmado retorna 403 email_not_confirmed', async () => {
    const res = await post({ product_type: 'nome_social' }, { email_confirmed_at: null });
    const data = await res.json();

    assert.equal(res.status, 403);
    assert.equal(data.error, 'email_not_confirmed');
    assert.equal(testCheckoutCalls.length, 0);
  });

  it('perfil is_test com assinatura test ativa retorna 409', async () => {
    profile = { role: 'user', is_test: true, test_ends_at: null };
    hasActiveProductSubscription = true;

    const res = await post({ product_type: 'nome_social' });
    const data = await res.json();

    assert.equal(res.status, 409);
    assert.equal(data.code, 'already_active');
    assert.equal(testCheckoutCalls.length, 0);
  });

  it('DEV-261: repassa chosen_signature, analysis_id validado, source e successUrl com resume=1 sem forçar brevo', async () => {
    allowStripeSession = true;
    ownedAnalysisId = '550e8400-e29b-41d4-a716-446655440000';

    const res = await post({
      product_type: 'nome_social',
      chosen_signature: '  Maria Clara Luz  ',
      analysis_id: ownedAnalysisId,
      source: 'card_pdf',
      utm_source: 'app_chat',
      utm_campaign: 'card_pdf',
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.url, 'https://checkout.stripe.com/pay/cs_test_123');
    assert.equal(stripeSessionCalls.length, 1);
    const call = stripeSessionCalls[0];
    assert.equal(call.chosenSignature, 'Maria Clara Luz');
    assert.equal(call.analysisId, ownedAnalysisId);
    assert.equal(call.source, 'card_pdf');
    assert.equal(call.utmSource, undefined);
    assert.equal(call.utmCampaign, undefined);
    assert.equal(call.utmMedium, undefined);
    assert.equal(
      call.successUrl,
      'https://www.nomemagnetico.com.br/app?checkout=success&produto=nome_social&resume=1'
    );
  });

  it('DEV-341: mantém a campanha de entrada real em uma compra iniciada pelo chat', async () => {
    allowStripeSession = true;
    const res = await post({
      product_type: 'nome_social',
      source: 'paywall_free',
      utm_source: 'qa_dev341',
      utm_campaign: 'origem',
    });

    assert.equal(res.status, 200);
    assert.equal(stripeSessionCalls[0].source, 'paywall_free');
    assert.equal(stripeSessionCalls[0].utmSource, 'qa_dev341');
    assert.equal(stripeSessionCalls[0].utmCampaign, 'origem');
  });

  it('DEV-261: descarta analysis_id que não pertence ao usuário sem falhar o checkout', async () => {
    allowStripeSession = true;
    ownedAnalysisId = '550e8400-e29b-41d4-a716-446655440000';

    const res = await post({
      product_type: 'nome_social',
      chosen_signature: 'Maria Clara Luz',
      analysis_id: '11111111-2222-4333-8444-555555555555',
      source: 'paywall_free',
    });

    assert.equal(res.status, 200);
    assert.equal(stripeSessionCalls.length, 1);
    const call = stripeSessionCalls[0];
    assert.equal(call.analysisId, undefined);
    assert.equal(call.chosenSignature, 'Maria Clara Luz');
    assert.equal(call.source, 'paywall_free');
  });

  it('DEV-261: rejeita chosen_signature acima de 80 caracteres', async () => {
    const res = await post({
      product_type: 'nome_social',
      chosen_signature: 'X'.repeat(81),
    });
    assert.equal(res.status, 400);
  });
});
