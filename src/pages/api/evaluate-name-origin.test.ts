import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { origemPermitida } from './evaluate-name.ts';

describe('DEV-317 · evaluate-name aceita a origem pública atrás do proxy', () => {
  const req = (host: string, url = 'http://localhost:4321/api/evaluate-name') =>
    new Request(url, { method: 'POST', headers: { host } });
  it('aceita o domínio público mesmo com request.url interno', () => {
    assert.equal(origemPermitida('https://www.nomemagnetico.com.br', req('www.nomemagnetico.com.br')), true);
  });
  it('recusa outro site', () => {
    assert.equal(origemPermitida('https://site-malicioso.com', req('www.nomemagnetico.com.br')), false);
  });
  it('recusa origem malformada', () => {
    assert.equal(origemPermitida('nada', req('www.nomemagnetico.com.br')), false);
  });
});
