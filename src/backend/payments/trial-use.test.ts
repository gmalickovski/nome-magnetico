import assert from 'node:assert/strict';
import { beforeEach, it, mock } from 'node:test';
let row: any;
let insertError: any = null;
const uses: any[] = [];
mock.module('../db/supabase', { namedExports: { supabase: { from(table: string) {
  if (table === 'access_code_uses') return { insert: async (use: any) => { uses.push(use); return { error: insertError }; } };
  const query: any = { select() { return query; }, eq() { return query; }, maybeSingle: async () => ({ data: row, error: null }) };
  return query;
} } } });
const { recordAccessTrialUse } = await import('./prices');
beforeEach(() => { row = { id: 'code-synthetic', kind: 'trial', product_types: [] }; uses.length = 0; insertError = null; });
it('registra trial de um produto com valor aceito pela constraint', async () => {
  await recordAccessTrialUse({ trialCode: 'TESTE', productType: 'nome_social', userId: 'user-synthetic' });
  assert.deepEqual(uses.map(use => use.product_type), ['nome_social']);
});
it('registra uma única utilização all para cobertura total', async () => {
  row.product_types = ['nome_social', 'nome_bebe', 'nome_empresa'];
  await recordAccessTrialUse({ trialCode: 'TESTE', productType: row.product_types.join(','), userId: 'user-synthetic' });
  assert.deepEqual(uses.map(use => use.product_type), ['all']);
});
it('registra subset histórico sem concatenar product_type', async () => {
  row.product_types = ['nome_bebe', 'nome_empresa'];
  await recordAccessTrialUse({ trialCode: 'TESTE', productType: 'nome_bebe,nome_empresa', userId: 'user-synthetic' });
  assert.deepEqual(uses.map(use => use.product_type), ['nome_bebe', 'nome_empresa']);
});
it('usa produtos vendáveis quando a configuração está vazia', async () => {
  await recordAccessTrialUse({ trialCode: 'TESTE', userId: 'user-synthetic' });
  assert.deepEqual(uses.map(use => use.product_type), ['nome_social']);
});
it('propaga falha de persistência', async () => {
  insertError = { code: '23514', message: 'constraint rejected' };
  await assert.rejects(recordAccessTrialUse({ trialCode: 'TESTE', productType: 'nome_social', userId: 'user-synthetic' }), /Falha ao registrar/);
});
it('rejeita produto fora da configuração sem gravar uso', async () => {
  row.product_types = ['nome_social'];
  await assert.rejects(recordAccessTrialUse({ trialCode: 'TESTE', productType: 'nome_empresa', userId: 'user-synthetic' }), /Produto inválido/);
  assert.equal(uses.length, 0);
});
