import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TokenRateLimiter } from '../src/auth/rate-limiter.js';

describe('nm-mcp TokenRateLimiter', () => {
  const tokenHash = 'test_token_hash_abc';

  it('permite até 60 leituras por minuto e bloqueia a 61ª', () => {
    const limiter = new TokenRateLimiter({ maxReadsPerMinute: 60, maxActionsPerHour: 10 });
    const now = 1700000000000;

    for (let i = 0; i < 60; i += 1) {
      const res = limiter.check(tokenHash, 'read', now + i);
      assert.equal(res.allowed, true, `requisição ${i + 1} deveria ser permitida`);
    }

    const blocked = limiter.check(tokenHash, 'read', now + 61);
    assert.equal(blocked.allowed, false);
    if (!blocked.allowed) {
      assert.ok(blocked.retryAfterSeconds > 0);
    }

    // Após 61 segundos, a janela rola e permite novas requisições
    const nextWindow = limiter.check(tokenHash, 'read', now + 61 * 1000);
    assert.equal(nextWindow.allowed, true);
  });

  it('permite até 10 ações por hora e bloqueia a 11ª', () => {
    const limiter = new TokenRateLimiter({ maxReadsPerMinute: 60, maxActionsPerHour: 10 });
    const now = 1700000000000;

    for (let i = 0; i < 10; i += 1) {
      const res = limiter.check(tokenHash, 'action', now + i * 1000);
      assert.equal(res.allowed, true, `ação ${i + 1} deveria ser permitida`);
    }

    const blocked = limiter.check(tokenHash, 'action', now + 11 * 1000);
    assert.equal(blocked.allowed, false);

    // Após 1 hora, a janela expira
    const nextHour = limiter.check(tokenHash, 'action', now + 3601 * 1000);
    assert.equal(nextHour.allowed, true);
  });
});
