import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  safeCompareSecrets,
  isValidInternalSecret,
  isValidInternalBearerToken,
} from './internalSecret';

const KEY = 'INTERNAL_API_SECRET';

describe('internalSecret', () => {
  const previous = process.env[KEY];

  afterEach(() => {
    if (previous === undefined) delete process.env[KEY];
    else process.env[KEY] = previous;
  });

  describe('safeCompareSecrets', () => {
    it('compara corretamente segredos iguais e diferentes', () => {
      assert.equal(safeCompareSecrets('segredo123', 'segredo123'), true);
      assert.equal(safeCompareSecrets('segredo123', 'segredo124'), false);
      assert.equal(safeCompareSecrets('curto', 'longo-demais-para-ter-mesmo-tamanho'), false);
      assert.equal(safeCompareSecrets('', 'qualquer'), false);
      assert.equal(safeCompareSecrets('qualquer', ''), false);
    });
  });

  describe('isValidInternalSecret', () => {
    it('falha fechada quando env ausente ou vazio', () => {
      delete process.env[KEY];
      assert.equal(isValidInternalSecret('qualquer'), false);

      process.env[KEY] = '   ';
      assert.equal(isValidInternalSecret('qualquer'), false);
    });

    it('valida com sucesso quando o segredo confere', () => {
      process.env[KEY] = 'super-secret-key-123';
      assert.equal(isValidInternalSecret('super-secret-key-123'), true);
      assert.equal(isValidInternalSecret('  super-secret-key-123  '), true);
      assert.equal(isValidInternalSecret('chave-errada'), false);
      assert.equal(isValidInternalSecret(null), false);
      assert.equal(isValidInternalSecret(undefined), false);
    });
  });

  describe('isValidInternalBearerToken', () => {
    it('exige prefixo Bearer e valida o token', () => {
      process.env[KEY] = 'token-cms-456';
      assert.equal(isValidInternalBearerToken('Bearer token-cms-456'), true);
      assert.equal(isValidInternalBearerToken('Bearer   token-cms-456  '), true);
      // Sem prefixo estrito Bearer deve recusar
      assert.equal(isValidInternalBearerToken('token-cms-456'), false);
      assert.equal(isValidInternalBearerToken('Basic token-cms-456'), false);
      assert.equal(isValidInternalBearerToken('Bearer token-errado'), false);
      assert.equal(isValidInternalBearerToken(null), false);
      assert.equal(isValidInternalBearerToken(''), false);
    });
  });
});
