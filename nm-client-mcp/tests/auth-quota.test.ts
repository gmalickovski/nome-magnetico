import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { hashToken, authenticateClientToken } from '../src/auth/tokens.js';
import { setMockDbClient } from '../src/db/client.js';

describe('nm-client-mcp Auth & Quota Verification (DEV-208)', () => {
  beforeEach(() => {
    setMockDbClient(null);
  });

  it('gera hash SHA-256 consistente para o token', () => {
    const hash = hashToken('nm_client_test_token_123');
    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64);
    assert.equal(hash, hashToken('  nm_client_test_token_123  '));
  });

  it('rejeita cabeçalho ausente ou malformatado', async () => {
    const res1 = await authenticateClientToken(null);
    assert.equal(res1.ok, false);
    assert.equal(res1.status, 401);

    const res2 = await authenticateClientToken('Basic abc');
    assert.equal(res2.ok, false);
    assert.equal(res2.status, 401);
  });

  it('autentica token válido com assinatura ativa e cota disponível', async () => {
    const mockDb = {
      rpc: async (fn: string, args: any) => {
        if (fn === 'verify_client_access') {
          return {
            data: {
              ok: true,
              user_id: 'u123',
              subscription_id: 'sub456',
              quota_limit: 50,
              used_count: 5,
              remaining_quota: 45,
            },
            error: null,
          };
        }
        return { data: null, error: new Error('rpc not found') };
      },
    };

    setMockDbClient(mockDb);

    const res = await authenticateClientToken('Bearer nm_client_valid_token');
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.principal.userId, 'u123');
      assert.equal(res.principal.subscriptionId, 'sub456');
      assert.equal(res.principal.remainingQuota, 45);
    }
  });

  it('retorna 429 quando a cota de uso do plano é excedida', async () => {
    const mockDb = {
      rpc: async (fn: string) => {
        if (fn === 'verify_client_access') {
          return {
            data: {
              ok: false,
              error: 'Cota de uso excedida para este plano',
            },
            error: null,
          };
        }
        return { data: null, error: new Error('rpc not found') };
      },
    };

    setMockDbClient(mockDb);

    const res = await authenticateClientToken('Bearer nm_client_quota_full');
    assert.equal(res.ok, false);
    assert.equal(res.status, 429);
    assert.match(res.error, /Cota/);
  });

  it('retorna 403 quando a assinatura está expirada ou cancelada', async () => {
    const mockDb = {
      rpc: async (fn: string) => {
        if (fn === 'verify_client_access') {
          return {
            data: {
              ok: false,
              error: 'Acesso da assinatura expirado',
            },
            error: null,
          };
        }
        return { data: null, error: new Error('rpc not found') };
      },
    };

    setMockDbClient(mockDb);

    const res = await authenticateClientToken('Bearer nm_client_expired');
    assert.equal(res.ok, false);
    assert.equal(res.status, 403);
    assert.match(res.error, /expirado/);
  });
});
