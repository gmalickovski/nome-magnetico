import assert from 'node:assert/strict';
import { it } from 'node:test';

function storage(seed?: Record<string, string>) {
  const entries = new Map(Object.entries(seed ?? {}));
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  };
}

it('mantém o submit anônimo vinculado ao identificar a conta e evita o envio duplicado', async () => {
  const { getPostHogDistinctId, identifyUser, track, captureBeginCheckout } = await import('./analytics');
  const anonymousId = '019af9f2-48f0-7a88-9a68-3c0202feb366';
  const accountId = '72a13dcc-8aa2-4217-a345-06bb269c4c82';
  const posthogCalls: unknown[][] = [];
  const gaCalls: unknown[][] = [];
  const localStorage = storage({ 'nm-cookie-consent': 'all' });
  let distinctId = anonymousId;
  Reflect.set(globalThis, 'window', {
    localStorage,
    gtag: (...args: unknown[]) => gaCalls.push(args),
    nmIdentifyPostHog: (id: string) => {
      posthogCalls.push(['$identify', distinctId, id]);
      distinctId = id;
    },
    posthog: {
      get_distinct_id: () => distinctId,
      capture: (event: string, properties: unknown) => posthogCalls.push([event, distinctId, properties]),
    },
  });
  try {
    const properties = { product_type: 'analise_gratuita' };
    const requestIdentity = getPostHogDistinctId();
    assert.equal(requestIdentity, anonymousId);
    track('analise_gratis_submit', properties, { postHog: false });
    assert.deepEqual(posthogCalls, []);
    assert.deepEqual(gaCalls, [['event', 'analise_gratis_submit', properties]]);
    track('analise_gratis_submit', properties);
    assert.deepEqual(posthogCalls[0], ['analise_gratis_submit', requestIdentity, properties]);

    identifyUser(accountId);
    captureBeginCheckout('nome_social', 'card', 97);
    assert.deepEqual(posthogCalls[1], ['$identify', requestIdentity, accountId]);
    assert.equal(posthogCalls[2][1], accountId);
    assert.equal(getPostHogDistinctId(), accountId);

    localStorage.setItem('nm-cookie-consent', 'essential');
    assert.equal(getPostHogDistinctId(), undefined);
    track('analise_gratis_submit', properties);
    assert.equal(posthogCalls.length, 3);
  } finally {
    Reflect.deleteProperty(globalThis, 'window');
  }
});

it('emite begin_checkout uma vez após confirmar o preço e criar a sessão Stripe', async () => {
  const events: unknown[][] = [];
  const requests: Array<Record<string, unknown>> = [];
  const id = '019af9f2-48f0-7a88-9a68-3c0202feb366';
  const fixture = mock.module('../frontend/lib/analytics', {
    namedExports: {
      captureBeginCheckout: (...args: unknown[]) => events.push(args),
      getPostHogDistinctId: () => 'visitor',
      getPostHogSessionId: () => id,
    },
  });
  const fetchMock = mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    requests.push(JSON.parse(String(init.body)));
    return requests.length === 1
      ? Response.json({ price_changed: true, effective: { final_cents: 9700 } })
      : Response.json({ url: 'https://example.test/checkout', final_cents: 9700 });
  });
  Reflect.set(globalThis, 'window', { confirm: () => true });
  try {
    const { postCreateCheckoutWithPriceConfirm } = await import('../frontend/lib/checkout-api');
    assert.equal((await postCreateCheckoutWithPriceConfirm({ product_type: 'nome_social' }, String)).ok, true);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].ph_session_id, id);
    assert.equal(requests[1].ph_distinct_id, 'visitor');
    assert.equal(requests[1].ph_analytics_consent, true);
    assert.deepEqual(events, [['nome_social', 'card', 97, id]]);
  } finally {
    fixture.restore();
    fetchMock.mock.restore();
    Reflect.deleteProperty(globalThis, 'window');
  }
});
