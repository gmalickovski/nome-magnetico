import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

const sent: Array<{ distinctId: string; properties: Record<string, unknown> }> = [];
mock.module('posthog-node', {
  namedExports: {
    PostHog: class {
      async captureImmediate(payload: typeof sent[number]) { sent.push(payload); }
      async flush() {}
      async shutdown() {}
    },
  },
});

const {
  captureServerEvent,
  posthogEventUuid,
  readPostHogDistinctIdFromCookie,
  resolveCheckoutDistinctId,
  shutdownPostHogServer,
  uuidV5,
} = await import('./posthog-server');

const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('posthog-server', () => {
  it('gera o uuid v5 do RFC 4122', () => {
    assert.equal(uuidV5('www.example.com', DNS_NAMESPACE), '2ed6657d-e927-568b-95e1-2665a8aea6a2');
  });

  it('repete o mesmo uuid para o mesmo evento e sessão', () => {
    const a = posthogEventUuid('purchase', 'cs_test_123');
    const b = posthogEventUuid('purchase', 'cs_test_123');
    const otherEvent = posthogEventUuid('checkout_error', 'cs_test_123');
    const otherSession = posthogEventUuid('purchase', 'cs_test_456');

    assert.equal(a, b);
    assert.notEqual(a, otherEvent);
    assert.notEqual(a, otherSession);
    assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('lê o distinct_id do cookie ph_*_posthog', () => {
    const payload = encodeURIComponent(JSON.stringify({ distinct_id: 'anon-42', $sesid: [1, 'x', 2] }));
    const header = `foo=1; ph_phc_test_posthog=${payload}; bar=2`;
    assert.equal(readPostHogDistinctIdFromCookie(header), 'anon-42');
    assert.equal(readPostHogDistinctIdFromCookie('ph_other=nope'), undefined);
    assert.equal(readPostHogDistinctIdFromCookie(null), undefined);
  });

  it('exige consentimento e rejeita e-mail como distinct_id do checkout', () => {
    assert.equal(resolveCheckoutDistinctId({ phDistinctId: ' anon ', analyticsConsent: true }), 'anon');
    assert.equal(resolveCheckoutDistinctId({ phDistinctId: 'anon' }), undefined);
    assert.equal(resolveCheckoutDistinctId({ phDistinctId: 'a@b.co', analyticsConsent: true }), undefined);
    assert.equal(resolveCheckoutDistinctId({}), undefined);
  });

  it('associa a sessão do PostHog e omite o campo para sessão ausente ou inválida', async () => {
    const previous = process.env.POSTHOG_API_KEY;
    process.env.POSTHOG_API_KEY = 'dummy-test';
    sent.length = 0;
    const id = '019af9f2-48f0-7a88-9a68-3c0202feb366';
    try {
      for (const sessionId of [id, undefined, 'cs_test_stripe']) {
        await captureServerEvent({ distinctId: 'fixture', event: 'purchase', sessionId });
      }
      assert.deepEqual(sent.splice(0).map((item) => item.properties), [{ $session_id: id }, {}, {}]);
    } finally {
      await shutdownPostHogServer();
      if (previous === undefined) delete process.env.POSTHOG_API_KEY;
      else process.env.POSTHOG_API_KEY = previous;
    }
  });

  it('não lança quando a chave do PostHog está ausente', async () => {
    await captureServerEvent({
      distinctId: 'user-1',
      event: 'purchase',
      uuid: posthogEventUuid('purchase', 'cs_sem_chave'),
      properties: { value: 98, currency: 'BRL', session_id: 'cs_sem_chave' },
    });
  });
});
