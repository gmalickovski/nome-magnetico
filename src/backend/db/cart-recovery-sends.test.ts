import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

let insertError: { code?: string; message?: string } | null = null;
const deleteCalls: { userId: string; productType: string }[] = [];
let sentryCalls = 0;

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
          delete() {
            const filters: Record<string, string> = {};
            const chain = {
              eq(col: string, val: string) {
                filters[col] = val;
                return chain;
              },
              then(onFulfilled: (v: { error: null }) => unknown) {
                if (filters.user_id && filters.product_type) {
                  deleteCalls.push({ userId: filters.user_id, productType: filters.product_type });
                }
                return Promise.resolve({ error: null }).then(onFulfilled);
              },
            };
            return chain;
          },
        };
      },
    },
  },
});

mock.module('../../sentry/fluxo', {
  namedExports: {
    captureFluxoException: () => {
      sentryCalls += 1;
    },
  },
});

const { claimCartRecoverySend, releaseCartRecoverySend } = await import('./cart-recovery-sends');

describe('cart-recovery-sends · claim', () => {
  beforeEach(() => {
    insertError = null;
    deleteCalls.length = 0;
    sentryCalls = 0;
  });

  it('retorna claimed quando o insert é novo', async () => {
    assert.equal(await claimCartRecoverySend('user-1', 'nome_social'), 'claimed');
  });

  it('retorna duplicate em duplicata (23505)', async () => {
    insertError = { code: '23505', message: 'duplicate' };
    assert.equal(await claimCartRecoverySend('user-1', 'nome_social'), 'duplicate');
    assert.equal(sentryCalls, 0);
  });

  it('fail closed em erro de banco e alerta Sentry', async () => {
    insertError = { code: '42501', message: 'permission denied' };
    assert.equal(await claimCartRecoverySend('user-1', 'nome_social'), 'error');
    assert.equal(sentryCalls, 1);
  });
});

describe('cart-recovery-sends · release', () => {
  beforeEach(() => {
    deleteCalls.length = 0;
  });

  it('remove a reserva por user_id e product_type', async () => {
    await releaseCartRecoverySend('user-1', 'nome_social');
    assert.deepEqual(deleteCalls, [{ userId: 'user-1', productType: 'nome_social' }]);
  });
});
