import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

// Use require to manipulate require.cache, or better, we can mock via global env and fetch
// Since readServerEnv reads process.env, we can just mutate process.env
// And we can mock globalThis.fetch

import { notify } from './notify';
import { readServerEnv } from '../env/runtime';

describe('notify', () => {
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

  it('envia evento com header de autenticacao se N8N_EVENTS_WEBHOOK_SECRET existir', async () => {
    process.env[WEBHOOK_KEY] = 'http://n8n.test/webhook';
    process.env[SECRET_KEY] = 'my-secret-token';

    let fetchCalled = false;
    let fetchHeaders: HeadersInit | undefined;

    globalThis.fetch = mock.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      fetchCalled = true;
      fetchHeaders = init?.headers;
      return { ok: true } as Response;
    });

    const success = await notify('user.welcome', { email: 'test@example.com' });

    assert.equal(success, true);
    assert.equal(fetchCalled, true);
    assert.deepEqual(fetchHeaders, {
      'Content-Type': 'application/json',
      'Authorization': 'my-secret-token'
    });
  });

  it('envia evento sem header de autenticacao se N8N_EVENTS_WEBHOOK_SECRET nao existir', async () => {
    process.env[WEBHOOK_KEY] = 'http://n8n.test/webhook';
    delete process.env[SECRET_KEY];

    let fetchCalled = false;
    let fetchHeaders: HeadersInit | undefined;

    globalThis.fetch = mock.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      fetchCalled = true;
      fetchHeaders = init?.headers;
      return { ok: true } as Response;
    });

    const success = await notify('user.welcome', { email: 'test@example.com' });

    assert.equal(success, true);
    assert.equal(fetchCalled, true);
    assert.deepEqual(fetchHeaders, {
      'Content-Type': 'application/json'
    });
  });
});
