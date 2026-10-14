import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  captureServerEvent,
  posthogEventUuid,
  readPostHogDistinctIdFromCookie,
  resolveCheckoutDistinctId,
  uuidV5,
} from './posthog-server';

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

  it('prefere ph_distinct_id e cai para user id ou email', () => {
    assert.equal(
      resolveCheckoutDistinctId({ phDistinctId: ' anon ', userId: 'user-1', email: 'a@b.co' }),
      'anon',
    );
    assert.equal(resolveCheckoutDistinctId({ phDistinctId: '  ', userId: 'user-1', email: 'a@b.co' }), 'user-1');
    assert.equal(resolveCheckoutDistinctId({ email: 'a@b.co' }), 'a@b.co');
    assert.equal(resolveCheckoutDistinctId({}), undefined);
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
