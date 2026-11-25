import assert from 'node:assert/strict';
import { it, mock } from 'node:test';

it('emite begin_checkout uma vez após confirmar o preço e criar a sessão Stripe', async () => {
  const events: unknown[][] = [];
  const requests: Array<Record<string, unknown>> = [];
  const id = '019af9f2-48f0-7a88-9a68-3c0202feb366';
  const fixture = mock.module('./analytics', {
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
  Reflect.set(globalThis, 'document', { documentElement: { dataset: {} } });
  try {
    const { postCreateCheckoutWithPriceConfirm } = await import('./checkout-api');
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
    Reflect.deleteProperty(globalThis, 'document');
  }
});
