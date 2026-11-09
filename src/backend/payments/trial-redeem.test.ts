import assert from 'node:assert/strict';
import { beforeEach, it, mock } from 'node:test';
let response: { data: unknown; error: unknown };
let throws = false;
const calls: unknown[] = [];
const invalidated: string[] = [];
mock.module('../db/supabase', { namedExports: { supabase: {
  async rpc(name: string, args: unknown) {
    calls.push({ name, args });
    if (throws) throw new Error('synthetic transport failure');
    return response;
  },
  from() { throw new Error('resgate não deve escrever fora da transação'); },
} } });
mock.module('../cache/memo', { namedExports: {
  invalidateUserSubscriptionsCache(userId: string) { invalidated.push(userId); },
} });
const { redeemAccessTrial } = await import('./trial-redeem');
const params = { trialCode: ' TESTE ', userId: 'user-synthetic', userEmail: ' fixture@example.invalid ' };
beforeEach(() => {
  response = { data: { ok: true, status: 200, endsAt: '2026-11-15T12:00:00+00:00', skippedActiveProducts: [] }, error: null };
  throws = false; calls.length = 0; invalidated.length = 0;
});
it('concede acesso somente após confirmar a RPC transacional', async () => {
  assert.equal((await redeemAccessTrial(params)).ok, true);
  assert.deepEqual(calls, [{ name: 'redeem_access_trial', args: {
    p_trial_code: 'TESTE', p_user_id: params.userId, p_user_email: 'fixture@example.invalid',
  } }]);
  assert.deepEqual(invalidated, [params.userId]);
});
it('não informa sucesso quando a transação falha ao criar assinatura ou uso', async () => {
  response = { data: null, error: { code: '23505', message: 'synthetic subscription failure' } };
  const result = await redeemAccessTrial(params);
  assert.equal(result.ok, false); assert.equal(result.status, 503);
  assert.deepEqual(invalidated, []);
});
it('falha fechada quando o transporte ou formato da resposta falha', async () => {
  throws = true;
  assert.equal((await redeemAccessTrial(params)).status, 503);
  throws = false; response.data = { ok: true, status: 200 };
  assert.equal((await redeemAccessTrial(params)).status, 503);
  assert.deepEqual(invalidated, []);
});
it('preserva recusa por resgate repetido, limite e acesso já ativo', async () => {
  for (const data of [
    { ok: false, status: 409, alreadyRedeemed: true, error: 'Código já resgatado' },
    { ok: false, status: 409, alreadyActive: true, error: 'Acesso ativo' },
    { ok: false, status: 400, error: 'Limite de usos' },
  ]) {
    response.data = data;
    assert.deepEqual(await redeemAccessTrial(params), data);
  }
  assert.deepEqual(invalidated, []);
});
it('rejeita código vazio sem consultar banco', async () => {
  assert.equal((await redeemAccessTrial({ ...params, trialCode: ' ' })).status, 400);
  assert.deepEqual(calls, []);
});
