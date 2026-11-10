import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

let insertError: { code?: string; message?: string } | null = null;

mock.module('./supabase', {
  namedExports: {
    supabase: {
      from() {
        return {
          insert() {
            if (insertError) {
              return Promise.resolve({ error: insertError });
            }
            return Promise.resolve({ error: null });
          },
        };
      },
    },
  },
});

const { claimCartRecoverySend } = await import('./cart-recovery-sends');

describe('cart-recovery-sends · claim', () => {
  beforeEach(() => {
    insertError = null;
  });

  it('retorna true quando o insert é novo', async () => {
    assert.equal(await claimCartRecoverySend('user-1', 'nome_social'), true);
  });

  it('retorna false em duplicata (23505)', async () => {
    insertError = { code: '23505', message: 'duplicate' };
    assert.equal(await claimCartRecoverySend('user-1', 'nome_social'), false);
  });

  it('fail closed em erro de banco', async () => {
    insertError = { code: '42501', message: 'permission denied' };
    assert.equal(await claimCartRecoverySend('user-1', 'nome_social'), false);
  });
});
