import assert from 'node:assert/strict';
import { beforeEach, it, mock } from 'node:test';
let failUse = false;
const events: string[] = [];
mock.module('../db/supabase', { namedExports: { supabase: { from(table: string) {
 const query: any = { select() { return query; }, eq() { return query; }, in() { return query; }, gt() { return query; },
 maybeSingle: async () => ({ data: null, error: null }),
 then(resolve: any) { return Promise.resolve({ data: [], error: null }).then(resolve); },
 update() { events.push('write:' + table); return query; },
 insert: async () => { events.push('write:' + table); return { error: null }; } };
 return query;
} } } });
mock.module('./prices', { namedExports: {
 validateAccessTrial: async () => ({ valid: true, trialDays: 7, productTypes: ['nome_social'] }),
 recordAccessTrialUse: async () => { events.push('record-use'); if (failUse) throw new Error('synthetic write failure'); },
} });
mock.module('../cache/memo', { namedExports: { invalidateUserSubscriptionsCache() {} } });
const { redeemAccessTrial } = await import('./trial-redeem');
beforeEach(() => { failUse = false; events.length = 0; });
it('não concede acesso nem informa sucesso se o uso não for persistido', async () => {
 failUse = true;
 const result = await redeemAccessTrial({ trialCode: 'TESTE', userId: 'user-synthetic' });
 assert.equal(result.ok, false); assert.equal(result.status, 503);
 assert.deepEqual(events, ['record-use']);
});
it('contabiliza o uso antes de conceder o acesso', async () => {
 const result = await redeemAccessTrial({ trialCode: 'TESTE', userId: 'user-synthetic' });
 assert.equal(result.ok, true); assert.equal(events[0], 'record-use');
 assert.ok(events.includes('write:subscriptions'));
});
