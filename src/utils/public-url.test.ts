import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPublicUrl, getPublicBaseUrl } from './public-url';

describe('getPublicBaseUrl', () => {
  it('usa APP_URL quando definida', () => {
    assert.equal(
      getPublicBaseUrl({ APP_URL: 'https://staging.nomemagnetico.com.br' }),
      'https://staging.nomemagnetico.com.br',
    );
  });

  it('cai em https://nomemagnetico.com.br quando APP_URL está ausente', () => {
    assert.equal(getPublicBaseUrl({}), 'https://nomemagnetico.com.br');
    assert.equal(getPublicBaseUrl({ APP_URL: '' }), 'https://nomemagnetico.com.br');
  });

  it('remove barra final de APP_URL', () => {
    assert.equal(
      getPublicBaseUrl({ APP_URL: 'https://nomemagnetico.com.br/' }),
      'https://nomemagnetico.com.br',
    );
    assert.equal(
      getPublicBaseUrl({ APP_URL: 'https://nomemagnetico.com.br///' }),
      'https://nomemagnetico.com.br',
    );
  });
});

describe('buildPublicUrl', () => {
  it('prefixa o path com a origem pública', () => {
    assert.equal(
      buildPublicUrl('/api/download-pdf?id=abc', { APP_URL: 'https://nomemagnetico.com.br/' }),
      'https://nomemagnetico.com.br/api/download-pdf?id=abc',
    );
  });
});
