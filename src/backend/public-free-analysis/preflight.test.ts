import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { HONEYPOT_FIELD } from './guards';
import { runFreeAnalysisPreflight } from './preflight';
const TEST_ORIGIN = 'https://analise.test';

let savedAppUrl: string | undefined;

beforeEach(() => {
  savedAppUrl = process.env.APP_URL;
  process.env.APP_URL = TEST_ORIGIN;
});

afterEach(() => {
  if (savedAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = savedAppUrl;
});

function buildRequest(
  body: Record<string, unknown>,
  origin = TEST_ORIGIN,
) {
  return new Request(`${origin}/api/teste-bloqueio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin,
    },
    body: JSON.stringify(body),
  });
}

function mockSupabase(options?: {
  hourCount?: number;
  dayCount?: number;
  leadCreatedAt?: string | null;
}) {
  const hourCount = options?.hourCount ?? 0;
  const dayCount = options?.dayCount ?? 0;
  const leadCreatedAt = options?.leadCreatedAt ?? null;
  let rateCall = 0;

  return {
    from(table: string) {
      if (table === 'public_analysis_rate_limits') {
        return {
          select() {
            return {
              eq() {
                return {
                  gte: async () => {
                    rateCall += 1;
                    const count = rateCall === 1 ? hourCount : dayCount;
                    return { count, error: null };
                  },
                };
              },
            };
          },
        };
      }
      if (table === 'free_analyses_leads') {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      limit: async () => ({
                        data: leadCreatedAt
                          ? [{ id: 'lead-1', created_at: leadCreatedAt }]
                          : [],
                        error: null,
                      }),
                    };
                  },
                };
              },
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
}

const validBody = {
  nome_completo: 'Maria Silva',
  data_nascimento: '15/03/1990',
  email: 'maria@email.com',
  [HONEYPOT_FIELD]: '',
};

describe('runFreeAnalysisPreflight', () => {
  it('happy path', async () => {
    const result = await runFreeAnalysisPreflight(
      buildRequest(validBody),
      mockSupabase(),
      { allowLocalhostOrigins: false },
    );
    assert.equal('ok' in result && result.ok, true);
    if ('ok' in result && result.ok) {
      assert.equal(result.dedupEmail, 'maria@email.com');
    }
  });

  it('honeypot retorna 200 falso', async () => {
    const result = await runFreeAnalysisPreflight(
      buildRequest({ ...validBody, [HONEYPOT_FIELD]: 'http://bot' }),
      mockSupabase(),
      { allowLocalhostOrigins: false },
    );
    assert.equal('status' in result && result.status, 200);
    if ('body' in result) {
      assert.equal(result.body.success, true);
    }
  });

  it('origem inválida retorna 403', async () => {
    const result = await runFreeAnalysisPreflight(
      buildRequest(validBody, 'https://evil.example'),
      mockSupabase(),
      { allowLocalhostOrigins: false },
    );
    assert.equal('status' in result && result.status, 403);
  });

  it('input inválido retorna 400', async () => {
    const result = await runFreeAnalysisPreflight(
      buildRequest({ ...validBody, email: 'invalido' }),
      mockSupabase(),
      { allowLocalhostOrigins: false },
    );
    assert.equal('status' in result && result.status, 400);
  });

  it('rate limit por IP retorna 429', async () => {
    const result = await runFreeAnalysisPreflight(
      buildRequest(validBody),
      mockSupabase({ hourCount: 3, dayCount: 3 }),
      { allowLocalhostOrigins: false },
    );
    assert.equal('status' in result && result.status, 429);
    if ('body' in result) {
      assert.equal(result.body.code, 'public_rate_limit');
    }
  });

  it('e-mail duplicado antigo retorna 409', async () => {
    const old = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = await runFreeAnalysisPreflight(
      buildRequest(validBody),
      mockSupabase({ leadCreatedAt: old }),
      { allowLocalhostOrigins: false },
    );
    assert.equal('status' in result && result.status, 409);
    if ('body' in result) {
      assert.equal(result.body.error, 'already_requested');
    }
  });

  it('deduplica e-mail com tag +', async () => {
    const old = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = await runFreeAnalysisPreflight(
      buildRequest({ ...validBody, email: 'maria+promo@email.com' }),
      mockSupabase({ leadCreatedAt: old }),
      { allowLocalhostOrigins: false },
    );
    assert.equal('status' in result && result.status, 409);
  });
});
