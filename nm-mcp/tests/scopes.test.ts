import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasScope } from '../src/auth/tokens.js';
import type { McpScope } from '../src/config.js';

describe('nm-mcp Scopes & Permissions', () => {
  it('agente com escopo read pode ler e não pode executar ações', () => {
    const scopes: McpScope[] = ['read'];

    assert.equal(hasScope(scopes, 'read'), true);
    assert.equal(hasScope(scopes, 'reprocess'), false);
    assert.equal(hasScope(scopes, 'resend'), false);
  });

  it('agente com escopo resend não pode reprocessar', () => {
    const scopes: McpScope[] = ['read', 'resend'];

    assert.equal(hasScope(scopes, 'read'), true);
    assert.equal(hasScope(scopes, 'resend'), true);
    assert.equal(hasScope(scopes, 'reprocess'), false);
  });

  it('agente admin com todos os escopos tem permissão total', () => {
    const scopes: McpScope[] = ['read', 'reprocess', 'resend'];

    assert.equal(hasScope(scopes, 'read'), true);
    assert.equal(hasScope(scopes, 'reprocess'), true);
    assert.equal(hasScope(scopes, 'resend'), true);
  });
});
