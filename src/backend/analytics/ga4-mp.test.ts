import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { gaSessionForPurchase, sendGa4Purchase } from './ga4-mp';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  delete process.env.GA4_MEASUREMENT_ID;
  delete process.env.GA4_API_SECRET;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.GA4_MEASUREMENT_ID;
  delete process.env.GA4_API_SECRET;
});

test('sendGa4Purchase não chama a rede sem env', async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response('ok');
  };

  await sendGa4Purchase({
    clientId: '1.2',
    transactionId: 'cs_test_1',
    value: 98,
    currency: 'BRL',
    items: [{ item_id: 'nome_social', item_name: 'Nome Social' }],
  });

  assert.equal(called, false);
});

test('sendGa4Purchase envia transaction_id e não propaga erro de rede', async () => {
  process.env.GA4_MEASUREMENT_ID = 'G-TEST';
  process.env.GA4_API_SECRET = 'secret';

  let requestUrl = '';
  let body = '';
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    body = String(init?.body ?? '');
    throw new Error('rede indisponível');
  };

  await assert.doesNotReject(() =>
    sendGa4Purchase({
      clientId: '111.222',
      transactionId: 'cs_test_session',
      value: 98,
      currency: 'brl',
      items: [{ item_id: 'nome_social', item_name: 'Nome Social', price: 98, quantity: 1 }],
    }),
  );

  assert.match(requestUrl, /measurement_id=G-TEST/);
  assert.match(requestUrl, /api_secret=secret/);
  assert.match(body, /"transaction_id":"cs_test_session"/);
  assert.match(body, /"currency":"BRL"/);
});

test('sendGa4Purchase inclui purchase_kind no evento purchase', async () => {
  process.env.GA4_MEASUREMENT_ID = 'G-TEST';
  process.env.GA4_API_SECRET = 'secret';

  let body = '';
  globalThis.fetch = async (_input, init) => {
    body = String(init?.body ?? '');
    return new Response('', { status: 200 });
  };

  await sendGa4Purchase({
    clientId: '111.222',
    transactionId: 'cs_renew',
    value: 98,
    currency: 'BRL',
    items: [{ item_id: 'nome_social', item_name: 'Nome Social' }],
    purchaseKind: 'renewal',
  });

  assert.match(body, /"purchase_kind":"renewal"/);

  body = '';
  await sendGa4Purchase({
    clientId: '111.222',
    transactionId: 'cs_new',
    value: 98,
    currency: 'BRL',
    items: [{ item_id: 'nome_social', item_name: 'Nome Social' }],
    purchaseKind: 'new',
  });

  assert.match(body, /"purchase_kind":"new"/);
});

test('session_id válido não é atribuído ao Pix tardio ou no envio após 24 horas', () => {
  const sessionId = 1795600000;
  const start = sessionId * 1000;
  assert.equal(gaSessionForPurchase(sessionId, start + 60_000, start + 65_000), sessionId);
  assert.equal(gaSessionForPurchase(sessionId, start + 3_600_000, start + 3_600_000), undefined);
  assert.equal(gaSessionForPurchase(sessionId, start + 60_000, start + 86_400_001), undefined);
  assert.equal(gaSessionForPurchase(undefined, start, start), undefined);
});

test('purchase sem identidade GA real não sai e consentimento publicitário fica negado por padrão', async () => {
  process.env.GA4_MEASUREMENT_ID = 'G-TEST';
  process.env.GA4_API_SECRET = 'secret';
  let events = 0;
  globalThis.fetch = async (_url, init) => {
    const sent = JSON.parse(String(init?.body));
    assert.deepEqual(sent.consent, { ad_user_data: 'DENIED', ad_personalization: 'DENIED' });
    assert.equal(sent.events[0].params.session_id, undefined);
    events += 1;
    return new Response(null, { status: 204 });
  };
  const purchase = { transactionId: 'cs_test_1', value: 98, currency: 'BRL', items: [] };
  assert.equal(await sendGa4Purchase({ ...purchase, clientId: '' }), 'skipped');
  assert.equal(await sendGa4Purchase({ ...purchase, clientId: '123.456' }), 'sent');
  assert.equal(events, 1);
});
