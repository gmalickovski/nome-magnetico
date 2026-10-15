import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { checkFreeAnalysisEmailEligibility } from './email-lead-guard';

function mockSupabaseWithLead(createdAt: string | null) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                order() {
                  return {
                    limit: async () => ({
                      data: createdAt ? [{ id: 'lead-1', created_at: createdAt }] : [],
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe('checkFreeAnalysisEmailEligibility', () => {
  it('permite e-mail novo', async () => {
    const result = await checkFreeAnalysisEmailEligibility(mockSupabaseWithLead(null), 'a@b.com');
    assert.deepEqual(result, { allowed: true });
  });

  it('retorna cooldown para lead recente', async () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = await checkFreeAnalysisEmailEligibility(
      mockSupabaseWithLead(recent),
      'a@b.com',
    );
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.equal(result.status, 429);
    }
  });

  it('retorna 409 para lead antigo', async () => {
    const old = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = await checkFreeAnalysisEmailEligibility(mockSupabaseWithLead(old), 'a@b.com');
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.equal(result.status, 409);
      assert.equal(result.code, 'already_requested');
    }
  });
});
