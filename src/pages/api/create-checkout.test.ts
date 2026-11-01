import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

type ProfileRow = {
  role: 'user' | 'admin';
  is_test: boolean;
  test_ends_at: string | null;
};

let profile: ProfileRow = { role: 'user', is_test: false, test_ends_at: null };
let hasActiveProductSubscription = false;
const testCheckoutCalls: unknown[] = [];
const notifyCalls: { event: string; payload: Record<string, unknown> }[] = [];

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

mock.module('../../backend/db/supabase', {
  namedExports: {
    supabase: {
      from(table: string) {
        if (table === 'profiles') return profileFrom();
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
    createCheckoutSession: async () => {
      throw new Error('stripe should not run in these tests');
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
    testCheckoutCalls.length = 0;
    notifyCalls.length = 0;
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
});
