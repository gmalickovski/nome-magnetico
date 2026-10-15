import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { authorizeInternalRequest, secretsMatch } from './internal-auth';

const KEY = 'INTERNAL_API_SECRET';

describe('authorizeInternalRequest', () => {
  const previous = process.env[KEY];

  afterEach(() => {
    if (previous === undefined) delete process.env[KEY];
    else process.env[KEY] = previous;
  });

  it('responde 503 quando o segredo não está configurado', () => {
    delete process.env[KEY];
    assert.deepEqual(authorizeInternalRequest('qualquer'), {
      ok: false,
      status: 503,
      error: 'internal secret not configured',
    });
    process.env[KEY] = '   ';
    assert.equal(authorizeInternalRequest('x').status, 503);
  });

  it('responde 401 quando o header não confere e aceita o valor trimado', () => {
    process.env[KEY] = 'segredo-certo';
    assert.deepEqual(authorizeInternalRequest('errado'), {
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });
    assert.equal(authorizeInternalRequest(null).status, 401);
    assert.equal(authorizeInternalRequest('').status, 401);
    assert.deepEqual(authorizeInternalRequest('  segredo-certo  '), { ok: true });
    assert.equal(secretsMatch('segredo-certo', 'segredo-certo'), true);
    assert.equal(secretsMatch('segredo-certo', 'segredo-certa'), false);
    assert.equal(secretsMatch('ab', 'a'), false);
  });
});
