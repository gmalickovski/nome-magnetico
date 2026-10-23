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
});
