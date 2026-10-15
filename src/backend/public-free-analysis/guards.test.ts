import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  FreeAnalysisRequestSchema,
  HONEYPOT_FIELD,
  fakeHoneypotSuccessBody,
  isAllowedPublicOrigin,
  isHoneypotTripped,
  isPlausibleBirthDate,
  normalizeEmailDedupKey,
} from './guards';

describe('normalizeEmailDedupKey', () => {
  it('normaliza e remove tags +', () => {
    assert.equal(normalizeEmailDedupKey('  Ana+promo@Example.COM '), 'ana@example.com');
    assert.equal(normalizeEmailDedupKey('user+tag1@mail.com'), 'user@mail.com');
  });
});

describe('isHoneypotTripped', () => {
  it('detecta honeypot preenchido', () => {
    assert.equal(isHoneypotTripped({ [HONEYPOT_FIELD]: 'https://spam.com' }), true);
    assert.equal(isHoneypotTripped({ [HONEYPOT_FIELD]: '   ' }), false);
    assert.equal(isHoneypotTripped({}), false);
  });

  it('retorna corpo falso de sucesso', () => {
    assert.deepEqual(fakeHoneypotSuccessBody(), {
      success: true,
      leadId: '00000000-0000-4000-8000-000000000000',
    });
  });
});

describe('isAllowedPublicOrigin', () => {
  it('aceita domínios de produção', () => {
    const previous = process.env.APP_URL;
    process.env.APP_URL = 'https://analise.test';
    try {
      const req = new Request('https://example.com', {
        headers: { origin: 'https://analise.test' },
      });
      assert.equal(isAllowedPublicOrigin(req, false), true);
    } finally {
      if (previous === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = previous;
    }
  });

  it('rejeita origem desconhecida em produção', () => {
    const req = new Request('https://example.com', {
      headers: { origin: 'https://evil.example' },
    });
    assert.equal(isAllowedPublicOrigin(req, false), false);
  });

  it('aceita localhost em development', () => {
    const req = new Request('https://example.com', {
      headers: { origin: 'http://localhost:4321' }, // pragma: allowlist secret
    });
    assert.equal(isAllowedPublicOrigin(req, true), true);
  });
});

describe('FreeAnalysisRequestSchema', () => {
  it('rejeita campos desconhecidos', () => {
    const result = FreeAnalysisRequestSchema.safeParse({
      nome_completo: 'Maria Silva',
      data_nascimento: '15/03/1990',
      email: 'maria@email.com',
      extra: true,
    });
    assert.equal(result.success, false);
  });

  it('aceita payload válido', () => {
    const result = FreeAnalysisRequestSchema.safeParse({
      nome_completo: 'Maria Silva',
      data_nascimento: '15/03/1990',
      email: 'maria@email.com',
    });
    assert.equal(result.success, true);
  });
});

describe('isPlausibleBirthDate', () => {
  it('valida intervalo plausível', () => {
    assert.equal(isPlausibleBirthDate('31/02/1990', new Date('2020-01-01T00:00:00Z')), false);
    assert.equal(isPlausibleBirthDate('15/03/1990', new Date('2020-01-01T00:00:00Z')), true);
    assert.equal(isPlausibleBirthDate('15/03/2030', new Date('2020-01-01T00:00:00Z')), false);
  });
});
