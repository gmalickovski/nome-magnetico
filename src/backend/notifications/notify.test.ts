import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { notify } from './notify';

describe('notify / sendToWebhook', () => {
  const originalFetch = globalThis.fetch;
  const SECRET_KEY = 'N8N_EVENTS_WEBHOOK_SECRET';
  const WEBHOOK_KEY = 'N8N_WEBHOOK_TRANSACIONAL';

  const previousSecret = process.env[SECRET_KEY];
  const previousWebhook = process.env[WEBHOOK_KEY];

  afterEach(() => {
    globalThis.fetch = originalFetch;

    if (previousSecret === undefined) delete process.env[SECRET_KEY];
    else process.env[SECRET_KEY] = previousSecret;

    if (previousWebhook === undefined) delete process.env[WEBHOOK_KEY];
    else process.env[WEBHOOK_KEY] = previousWebhook;
  });

  it('envia Authorization quando N8N_EVENTS_WEBHOOK_SECRET está definido', async () => {
    process.env[WEBHOOK_KEY] = 'http://n8n.test/webhook';
    process.env[SECRET_KEY] = 'my-secret-token';

    let fetchHeaders: HeadersInit | undefined;

    globalThis.fetch = mock.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      fetchHeaders = init?.headers;
      return { ok: true } as Response;
    });

    const success = await notify('user.welcome', { email: 'test@example.com' });

    assert.equal(success, true);
    assert.deepEqual(fetchHeaders, {
      'Content-Type': 'application/json',
      Authorization: 'my-secret-token',
    });
  });

  it('não envia Authorization quando N8N_EVENTS_WEBHOOK_SECRET está ausente', async () => {
    process.env[WEBHOOK_KEY] = 'http://n8n.test/webhook';
    delete process.env[SECRET_KEY];

    let fetchHeaders: HeadersInit | undefined;

    globalThis.fetch = mock.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      fetchHeaders = init?.headers;
      return { ok: true } as Response;
    });

    const success = await notify('user.welcome', { email: 'test@example.com' });

    assert.equal(success, true);
    assert.deepEqual(fetchHeaders, {
      'Content-Type': 'application/json',
    });
  });

  it('envia payment.chargeback no envelope transacional com timeout', async () => {
    const endpoint = 'http://n8n.test/webhook';
    process.env[WEBHOOK_KEY] = endpoint;
    process.env[SECRET_KEY] = 'test-webhook-token';
    const payload = {
      payment_id: 'pi_fixture270',
      productType: 'nome_social',
      amount: 6590,
      amount_formatted: 'R$ 65,90',
      reason: 'fraudulent',
      status: 'needs_response',
      payment_provider: 'stripe',
      livemode: true,
    } as const;

    const send = mock.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      new Response(null, { status: 200 }));
    globalThis.fetch = send;

    assert.equal(await notify('payment.chargeback', payload), true);
    assert.equal(send.mock.callCount(), 1);
    const [url, init] = send.mock.calls[0].arguments;
    assert.equal(url, endpoint);
    assert.equal(init?.method, 'POST');
    assert.equal(new Headers(init?.headers).get('authorization'), 'test-webhook-token');
    assert.ok(init?.signal instanceof AbortSignal);
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(Object.keys(body).sort(), ['event', 'payload', 'timestamp']);
    assert.equal(body.event, 'payment.chargeback');
    assert.ok(Number.isFinite(Date.parse(body.timestamp)));
    for (const [key, value] of Object.entries(payload)) {
      assert.equal(body.payload[key], value);
    }
    assert.equal(body.payload.email, undefined);
    assert.equal(body.payload.firstName, undefined);
  });
});
