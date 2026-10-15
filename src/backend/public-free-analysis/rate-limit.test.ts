import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { checkPublicFreeAnalysisIpRateLimit } from './rate-limit';

function mockSupabase(counts: { hour: number; day: number }) {
  let call = 0;
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                gte: async () => {
                  call += 1;
                  const count = call === 1 ? counts.hour : counts.day;
                  return { count, error: null };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe('checkPublicFreeAnalysisIpRateLimit', () => {
  it('retorna 429 quando excede limite horário', async () => {
    const result = await checkPublicFreeAnalysisIpRateLimit(mockSupabase({ hour: 3, day: 1 }), 'hash');
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.equal(result.status, 429);
    }
  });

  it('retorna 429 quando excede limite diário', async () => {
    const result = await checkPublicFreeAnalysisIpRateLimit(mockSupabase({ hour: 1, day: 10 }), 'hash');
    assert.equal(result.allowed, false);
  });

  it('permite quando abaixo dos limites', async () => {
    const result = await checkPublicFreeAnalysisIpRateLimit(mockSupabase({ hour: 2, day: 9 }), 'hash');
    assert.deepEqual(result, { allowed: true });
  });
});
