import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { findLeadPrefill } from './lead-prefill';

function fakeAdmin(rows: unknown[] | null, error: unknown = null) {
  const calls: { in?: [string, string[]] } = {};
  const chain: Record<string, unknown> = {
    select: () => chain,
    in: (col: string, vals: string[]) => {
      calls.in = [col, vals];
      return chain;
    },
    order: () => chain,
    limit: async () => ({ data: rows, error }),
  };
  const admin = { from: () => chain } as unknown as SupabaseClient;
  return { admin, calls };
}

describe('pré-preenchimento do chat com o lead (DEV-343)', () => {
  it('devolve nome e data em dd/mm/aaaa para e-mail confirmado', async () => {
    const { admin, calls } = fakeAdmin([{ nome_completo: '  Maria   da Silva ', data_nascimento: '1990-03-07' }]);
    const r = await findLeadPrefill(admin, 'Maria+teste@Exemplo.com', true);
    assert.deepEqual(r, { nome: 'Maria da Silva', data: '07/03/1990' });
    assert.deepEqual(calls.in, ['email', ['maria+teste@exemplo.com', 'maria@exemplo.com']]);
  });

  it('não lê nada quando o e-mail não está confirmado', async () => {
    const { admin, calls } = fakeAdmin([{ nome_completo: 'Maria da Silva', data_nascimento: '1990-03-07' }]);
    assert.equal(await findLeadPrefill(admin, 'maria@exemplo.com', false), null);
    assert.equal(calls.in, undefined);
  });

  it('sem lead, erro ou dados incompletos: null', async () => {
    assert.equal(await findLeadPrefill(fakeAdmin([]).admin, 'a@b.com', true), null);
    assert.equal(await findLeadPrefill(fakeAdmin(null, { message: 'x' }).admin, 'a@b.com', true), null);
    assert.equal(await findLeadPrefill(fakeAdmin([{ nome_completo: 'Ana', data_nascimento: null }]).admin, 'a@b.com', true), null);
    assert.equal(await findLeadPrefill(fakeAdmin([]).admin, '', true), null);
  });
});
