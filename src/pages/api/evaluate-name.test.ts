import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { avaliarNome } from '../../backend/numerology/score';
let hasAccess = true;
mock.module('../../backend/db/subscriptions', { namedExports: { hasActiveSubscription: async () => hasAccess } });
mock.module('../../backend/db/supabase', { namedExports: { supabase: { auth: { getUser: async () => ({ data: { user: null }, error: null }) } } } });
mock.module('../../backend/db/analyses', { namedExports: { getAnalysis: async () => ({ user_id: 'other', product_type: 'nome_social' }) } });
const { POST } = await import('./evaluate-name');
const startBody = () => ({ action: 'start', chatKey: randomUUID(), nomeNascimento: 'Alexandra Mendes Vale', dataNascimento: '07/03/1992', areaFoco: 'carreira_negocios', ondeAssinaRaw: ['contratos'], sugestoesExistentes: ['Ana Vale'] });
async function request(body: unknown, user: string | null = 'owner') {
  const response = await POST({ request: new Request('https://app.example.com/api/evaluate-name', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://app.example.com' }, body: JSON.stringify(body) }), locals: { user: user ? { id: user } : undefined } } as never);
  return { status: response.status, data: await response.json() };
}
describe('DEV-299 /api/evaluate-name (sem banco e sem LLM)', () => {
  beforeEach(() => { hasAccess = true; });
  it('exige sessão, acesso e titularidade', async () => {
    assert.equal((await request(startBody(), null)).status, 401);
    hasAccess = false; assert.equal((await request(startBody())).status, 403); hasAccess = true;
    assert.equal((await request({ ...startBody(), analysisId: randomUUID() })).status, 404);
  });
  it('valida data real e caracteres antes do cálculo', async () => {
    assert.equal((await request({ ...startBody(), dataNascimento: '31/02/1992' })).status, 400);
    const { data } = await request(startBody());
    for (const nome of ['A', 'Ana123', 'Ana\nVale', 'Åna']) assert.equal((await request({ action: 'evaluate', sessionId: data.sessionId, nome })).status, 400);
  });
  it('duplica sem consumo e retorna a nota oficial sem filtro de melhoria', async () => {
    const { data } = await request(startBody());
    const duplicate = await request({ action: 'evaluate', sessionId: data.sessionId, nome: 'ANA VALE' });
    assert.equal(duplicate.data.duplicata, true); assert.equal(duplicate.data.used, 0);
    const nome = 'Aaaaaaa';
    const result = await request({ action: 'evaluate', sessionId: data.sessionId, nome });
    assert.equal(result.status, 200);
    assert.equal(result.data.candidate.score, avaliarNome(nome, '07/03/1992').score_v3);
    assert.equal(result.data.candidate.origem, 'manual');
    assert.equal(result.data.candidate.nome, nome);
    assert.equal(result.data.used, 1);
    assert.equal((await request({ action: 'evaluate', sessionId: data.sessionId, nome: 'AAAAAAA' })).data.used, 1);
    assert.equal((await request({ action: 'evaluate', sessionId: data.sessionId, nome }, 'other')).status, 410);
  });
  it('cinco únicos e retry idempotente, sem confiar em contador do cliente', async () => {
    const { data } = await request(startBody());
    for (const nome of ['Ana Rosa', 'Ana Silva', 'Ana Maria', 'Ana Prado', 'Ana Santos']) assert.equal((await request({ action: 'evaluate', sessionId: data.sessionId, nome, used: 0 })).status, 200);
    assert.equal((await request({ action: 'evaluate', sessionId: data.sessionId, nome: 'Ana Rosa' })).data.used, 5);
    assert.equal((await request({ action: 'evaluate', sessionId: data.sessionId, nome: 'Ana Souza' })).status, 429);
  });
});
