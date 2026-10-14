import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { resolveGaClientId, sendGa4Purchase } from './ga4-mp';

const originalFetch = globalThis.fetch;

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

test('resolveGaClientId prefere metadata e deriva do session id se vazio', () => {
  assert.equal(resolveGaClientId('cs_abc', ' 999.888 '), '999.888');
  const fallback = resolveGaClientId('cs_abc', '  ');
  assert.match(fallback, /^\d+\.\d+$/);
  assert.equal(fallback, resolveGaClientId('cs_abc', null));
  assert.notEqual(fallback, resolveGaClientId('cs_other', null));
});
