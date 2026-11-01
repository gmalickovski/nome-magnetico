import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

type SessionLike = { access_token: string; refresh_token: string } | null;

let getSessionResult: SessionLike;
let refreshSessionResult: SessionLike;
const writeAuthCookiesCalls: Array<[string, string]> = [];
let lastFetchInit: RequestInit | undefined;

const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: getSessionResult }, error: null }),
    refreshSession: async () => ({ data: { session: refreshSessionResult }, error: null }),
  },
};

mock.module('./supabase-browser.js', {
  namedExports: { supabaseBrowser: mockSupabase },
});

mock.module('./auth-cookies.js', {
  namedExports: {
    writeAuthCookies: (access: string, refresh: string) => {
      writeAuthCookiesCalls.push([access, refresh]);
    },
  },
});

const { resolveAuthAccessToken, fetchWithAuth, readAccessTokenFromDocumentCookie } =
  await import('./auth-fetch.js');

describe('auth-fetch', () => {
  beforeEach(() => {
    getSessionResult = null;
    refreshSessionResult = null;
    writeAuthCookiesCalls.length = 0;
    lastFetchInit = undefined;
    // @ts-expect-error test stub
    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      lastFetchInit = init;
      return new Response('{}', { status: 200 });
    };
  });

  afterEach(() => {
    // @ts-expect-error cleanup
    delete globalThis.document;
  });

  it('resolveAuthAccessToken usa sessão Supabase e sincroniza cookies', async () => {
    getSessionResult = { access_token: 'session-token', refresh_token: 'refresh-token' };
    const token = await resolveAuthAccessToken();
    assert.equal(token, 'session-token');
    assert.deepEqual(writeAuthCookiesCalls, [['session-token', 'refresh-token']]);
  });

  it('resolveAuthAccessToken cai no cookie quando getSession e refresh vazios', async () => {
    // @ts-expect-error test stub
    globalThis.document = { cookie: 'nome-magnetico-auth-access-token=cookie-token' };
    const token = await resolveAuthAccessToken();
    assert.equal(token, 'cookie-token');
    assert.equal(writeAuthCookiesCalls.length, 0);
  });

  it('readAccessTokenFromDocumentCookie decodifica valor', () => {
    // @ts-expect-error test stub
    globalThis.document = {
      cookie: 'other=1; nome-magnetico-auth-access-token=abc%2Bdef',
    };
    assert.equal(readAccessTokenFromDocumentCookie(), 'abc+def');
  });

  it('fetchWithAuth envia Authorization Bearer e credentials include (caso regenerate)', async () => {
    getSessionResult = { access_token: 'bearer-for-regenerate', refresh_token: 'r' };
    await fetchWithAuth('/api/regenerate-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.ok(lastFetchInit);
    const headers = new Headers(lastFetchInit!.headers);
    assert.equal(headers.get('Authorization'), 'Bearer bearer-for-regenerate');
    assert.equal(lastFetchInit!.credentials, 'include');
  });

  it('fetchWithAuth usa token do cookie se sessão só aparece após refresh', async () => {
    refreshSessionResult = { access_token: 'after-refresh', refresh_token: 'rr' };
    await fetchWithAuth('/api/regenerate-suggestions', { method: 'POST' });
    const headers = new Headers(lastFetchInit!.headers);
    assert.equal(headers.get('Authorization'), 'Bearer after-refresh');
  });
});
