import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hashToken, authenticateBearerToken, safeCompareHashes } from '../src/auth/tokens.js';
import type { AgentTokenConfig } from '../src/config.js';

describe('nm-mcp Auth & Tokens', () => {
  const rawToken = 'nm_admin_secret_token_12345';
  const tokenHash = hashToken(rawToken);

  const testTokens: AgentTokenConfig[] = [
    {
      agent: 'grok_bot',
      token_hash: tokenHash,
      scopes: ['read', 'reprocess', 'resend'],
      is_active: true,
    },
    {
      agent: 'gemini',
      token_hash: hashToken('nm_admin_gemini_token'),
      scopes: ['read'],
      is_active: true,
    },
    {
      agent: 'revoked_agent',
      token_hash: hashToken('nm_admin_revoked_token'),
      scopes: ['read'],
      is_active: false,
    },
  ];

  it('autentica token válido com sucesso', () => {
    const auth = authenticateBearerToken(`Bearer ${rawToken}`, testTokens);
    assert.equal(auth.ok, true);
    if (auth.ok) {
      assert.equal(auth.principal.agent, 'grok_bot');
      assert.deepEqual(auth.principal.scopes, ['read', 'reprocess', 'resend']);
      assert.equal(auth.principal.tokenHash, tokenHash);
    }
  });

  it('rejeita token inválido (401)', () => {
    const auth = authenticateBearerToken('Bearer nm_admin_wrong_token', testTokens);
    assert.equal(auth.ok, false);
    if (!auth.ok) {
      assert.match(auth.error, /unauthorized/i);
    }
  });

  it('rejeita token desativado / revogado', () => {
    const auth = authenticateBearerToken('Bearer nm_admin_revoked_token', testTokens);
    assert.equal(auth.ok, false);
  });

  it('rejeita cabeçalho ausente ou malformatado', () => {
    const authNoHeader = authenticateBearerToken(null, testTokens);
    assert.equal(authNoHeader.ok, false);

    const authNoBearer = authenticateBearerToken('Basic abc1234', testTokens);
    assert.equal(authNoBearer.ok, false);

    const authEmpty = authenticateBearerToken('Bearer   ', testTokens);
    assert.equal(authEmpty.ok, false);
  });

  it('compara hashes em tempo constante e rejeita tamanhos incorretos', () => {
    assert.equal(safeCompareHashes(tokenHash, tokenHash), true);
    assert.equal(safeCompareHashes(tokenHash, hashToken('other')), false);
    assert.equal(safeCompareHashes('short', tokenHash), false);
    assert.equal(safeCompareHashes('', ''), false);
  });
});
