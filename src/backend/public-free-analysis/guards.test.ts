import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  FreeAnalysisRequestSchema,
  HONEYPOT_FIELD,
  fakeHoneypotSuccessBody,
  hasSamePublicRequestOrigin,
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

describe('hasSamePublicRequestOrigin', () => {
  it('preserva a porta do app quando o adapter resolve o host como localhost', () => {
    const url = new URL('http://localhost/api/analytics/paid-preferences');
    const request = new Request(url, {
      headers: { host: 'localhost:4321', origin: 'http://localhost:4321' }, // pragma: allowlist secret
    });
    assert.equal(hasSamePublicRequestOrigin(request, url), true);
    request.headers.set('origin', 'http://localhost');
    assert.equal(hasSamePublicRequestOrigin(request, url), false);
    request.headers.set('origin', 'http://localhost:3000'); // pragma: allowlist secret
    assert.equal(hasSamePublicRequestOrigin(request, url), false);
  });

  it('valida o host público configurado e ignora X-Forwarded-Host', (t) => {
    const key = 'FREE_ANALYSIS_ALLOWED_ORIGINS';
    const previous = process.env[key];
    process.env[key] = 'https://site.example';
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });

    const url = new URL('https://localhost/api/analytics/paid-preferences');
    const request = new Request(url, {
      headers: { host: 'site.example', origin: 'https://site.example' },
    });
    assert.equal(hasSamePublicRequestOrigin(request, url), true);
    request.headers.set('host', 'other.example');
    request.headers.set('x-forwarded-host', 'site.example');
    assert.equal(hasSamePublicRequestOrigin(request, url), false);
    request.headers.set('origin', 'https://other.example');
    assert.equal(hasSamePublicRequestOrigin(request, url), false);
    request.headers.delete('origin');
    assert.equal(hasSamePublicRequestOrigin(request, url), false);
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
