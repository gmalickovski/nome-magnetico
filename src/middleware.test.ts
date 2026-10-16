import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildAppLoginRedirectPath,
  createMutableRedirect302,
  redirectPublicAppWithoutSession,
} from './middleware/app-access';

/** Astro sets route metadata on middleware responses; Response.redirect() headers are immutable. */
function patchResponseLikeAstro(response: Response): void {
  response.headers.set('x-astro-route-type', 'page');
}

describe('redirectPublicAppWithoutSession (/app/renovar)', () => {
  it('redireciona 302 para login e permite headers mutáveis (sem TypeError immutable)', () => {
    const response = redirectPublicAppWithoutSession('/app/renovar', '', undefined);
    assert.ok(response);
    assert.equal(response.status, 302);

    const location = response.headers.get('Location');
    assert.equal(location, buildAppLoginRedirectPath('/app/renovar', ''));
    assert.equal(decodeURIComponent(new URL(`http://x${location}`).searchParams.get('redirect') ?? ''), '/app/renovar');
    assert.doesNotThrow(() => patchResponseLikeAstro(response));
  });

  it('não redireciona rotas públicas nem /app com sessão', () => {
    assert.equal(redirectPublicAppWithoutSession('/app/renovar', '', 'token'), null);
    assert.equal(redirectPublicAppWithoutSession('/', '', undefined), null);
  });
});

describe('redirect mutável vs Response.redirect', () => {
  it('Response.redirect falha ao mutar headers', () => {
    const immutable = Response.redirect('http://127.0.0.1/auth/login', 302);
    assert.throws(() => patchResponseLikeAstro(immutable), /immutable/i);
  });

  it('createMutableRedirect302 aceita mutação de headers', () => {
    const response = createMutableRedirect302('/auth/login?redirect=%2Fapp%2Frenovar');
    assert.doesNotThrow(() => patchResponseLikeAstro(response));
  });
});
