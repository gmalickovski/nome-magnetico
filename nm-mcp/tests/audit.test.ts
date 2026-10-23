import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { maskEmail, sanitizeAuditParameters } from '../src/utils/mask-email.js';

describe('nm-mcp Audit & PII Scrubbing', () => {
  it('mascara e-mails corretamente', () => {
    assert.equal(maskEmail('guilherme@studiomlk.com.br'), 'g***@studiomlk.com.br');
    assert.equal(maskEmail('ana.silva@gmail.com'), 'a***@gmail.com');
    assert.equal(maskEmail('x@empresa.com'), 'x***@empresa.com');
    assert.equal(maskEmail(''), '***');
    assert.equal(maskEmail(null), '***');
  });

  it('sanitiza parâmetros de auditoria mascarando PII e segredos', () => {
    const rawParams = {
      email: 'lead@example.com',
      token: 'secret_token_123',
      apiKey: 'api_key_456',
      dry_run: true,
      lead_id: 'lead-1234',
      nested: {
        userEmail: 'outro@teste.com',
        count: 5,
      },
    };

    const sanitized = sanitizeAuditParameters(rawParams);

    assert.equal(sanitized.email, 'l***@example.com');
    assert.equal(sanitized.token, '[REDACTED]');
    assert.equal(sanitized.apiKey, '[REDACTED]');
    assert.equal(sanitized.dry_run, true);
    assert.equal(sanitized.lead_id, 'lead-1234');
    assert.deepEqual(sanitized.nested, {
      userEmail: 'o***@teste.com',
      count: 5,
    });
  });
});
