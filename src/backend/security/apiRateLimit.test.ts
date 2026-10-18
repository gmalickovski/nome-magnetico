import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { enforceApiRateLimits } from './apiRateLimit';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('enforceApiRateLimits', () => {
  it('permite requisições abaixo do limite e bloqueia a 11ª com 429 e retryAfterSeconds', async () => {
    let selectCount = 0;
    const insertedKeys: string[] = [];

    const fakeClient = {
      from: (table: string) => {
        assert.equal(table, 'public_analysis_rate_limits');
        return {
          select: (_cols: string, opts: any) => {
            assert.equal(opts.count, 'exact');
            assert.equal(opts.head, true);
            return {
              eq: (_col: string, val: string) => ({
                gte: (_timeCol: string, _since: string) => {
                  return Promise.resolve({
                    count: selectCount,
                    error: null,
                  });
                },
              }),
            };
          },
          insert: (payload: any) => {
            insertedKeys.push(payload.ip_hash);
            return Promise.resolve({ error: null });
          },
        };
      },
    } as unknown as SupabaseClient;

    // Chamadas 1 a 10 (count 0 a 9)
    for (let i = 0; i < 10; i++) {
      selectCount = i;
      const res = await enforceApiRateLimits(
        fakeClient,
        [{ key: 'test:key:1', limit: 10, windowSeconds: 600 }]
      );
      assert.equal(res.allowed, true);
    }

    assert.equal(insertedKeys.length, 10);

    // 11ª chamada: count já atingiu 10 (>= 10)
    selectCount = 10;
    const resBlocked = await enforceApiRateLimits(
      fakeClient,
      [{ key: 'test:key:1', limit: 10, windowSeconds: 600 }]
    );

    assert.equal(resBlocked.allowed, false);
    if (!resBlocked.allowed) {
      assert.equal(resBlocked.status, 429);
      assert.equal(resBlocked.retryAfterSeconds, 600);
      assert.match(resBlocked.message, /muitas tentativas/i);
    }
  });
});
