import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { EMAIL_COOLDOWN_MS } from '../public-free-analysis/guards';
import { HONEYPOT_FIELD } from '../public-free-analysis/guards';
import { runFreeAnalysisPreflight } from '../public-free-analysis/preflight';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolvePublicFreeAnalysisMarketingConsent } from './free-analysis-completed';

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

function buildRequest(body: Record<string, unknown>, origin = TEST_ORIGIN) {
  return new Request(`${origin}/api/teste-bloqueio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin },
    body: JSON.stringify(body),
  });
}

function mockSupabase(options?: { hourCount?: number; dayCount?: number; leadCreatedAt?: string | null }) {
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

describe('marketing da rota pública /api/teste-bloqueio (preflight)', () => {
  it('honeypot não chega ao fluxo de marketing (preflight encerra antes)', async () => {
    const result = await runFreeAnalysisPreflight(
      buildRequest({
        nome_completo: 'Maria Silva',
        data_nascimento: '01/01/1990',
        email: 'maria@test.com',
        [HONEYPOT_FIELD]: 'http://spam.test',
      }),
      mockSupabase(),
      { allowLocalhostOrigins: false },
    );
    assert.ok(!('ok' in result));
    assert.equal(result.status, 200);
    assert.equal(resolvePublicFreeAnalysisMarketingConsent(undefined).send, true);
  });

  it('409 already_requested não prossegue para insert/marketing', async () => {
    const oldLead = new Date(Date.now() - EMAIL_COOLDOWN_MS - 60_000).toISOString();
    const result = await runFreeAnalysisPreflight(
      buildRequest({
        nome_completo: 'Maria Silva',
        data_nascimento: '01/01/1990',
        email: 'maria@test.com',
      }),
      mockSupabase({ leadCreatedAt: oldLead }),
      { allowLocalhostOrigins: false },
    );
    assert.ok(!('ok' in result));
    assert.equal(result.status, 409);
    assert.equal(result.body.error, 'already_requested');
  });

  it('429 rate limit não prossegue para insert/marketing', async () => {
    const result = await runFreeAnalysisPreflight(
      buildRequest({
        nome_completo: 'Maria Silva',
        data_nascimento: '01/01/1990',
        email: 'maria@test.com',
      }),
      mockSupabase({ hourCount: 3 }),
      { allowLocalhostOrigins: false },
    );
    assert.ok(!('ok' in result));
    assert.equal(result.status, 429);
  });

  it('sucesso no preflight expõe opt_in para consentimento DOI quando ausente', async () => {
    const result = await runFreeAnalysisPreflight(
      buildRequest({
        nome_completo: 'Maria Silva',
        data_nascimento: '01/01/1990',
        email: 'maria@test.com',
      }),
      mockSupabase(),
      { allowLocalhostOrigins: false, now: Date.UTC(2020, 0, 15) },
    );
    assert.ok('ok' in result && result.ok);
    const consent = resolvePublicFreeAnalysisMarketingConsent(result.opt_in);
    assert.deepEqual(consent, { send: true, optIn: false, optInEm: null });
  });
});
