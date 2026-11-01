import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

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
      discountSource: 'none',
    }),
  },
});

mock.module('../../backend/payments/prices', {
  namedExports: {
    effectiveResultToPriceInfo: (effective: unknown) => effective,
    validateAccessCoupon: async () => null,
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

function post(body: object) {
  return createCheckoutResponse({
    request: new Request('http://localhost/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    user: { id: 'user-1', email: 'buyer@example.com' },
    url: new URL('http://localhost/api/create-checkout'),
  });
}

describe('create-checkout · DEV-239', () => {
  beforeEach(() => {
    profile = { role: 'user', is_test: false, test_ends_at: null };
    hasActiveProductSubscription = false;
    ownedAnalysisId = null;
    allowStripeSession = false;
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
    assert.equal(call.utmSource, 'app_chat');
    assert.equal(call.utmCampaign, 'card_pdf');
    assert.equal(call.utmMedium, undefined);
    assert.equal(
      call.successUrl,
      'https://www.nomemagnetico.com.br/app?checkout=success&produto=nome_social&resume=1'
    );
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
