import assert from 'node:assert/strict';
import { after, beforeEach, it, mock } from 'node:test';
import * as sdk from '@typesafe-ai/sdk';
const keys = ['TYPESAFE_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY'] as const;
const previous = new Map(keys.map(key => [key, process.env[key]]));
let behavior: 'success' | 'empty' | number | 'timeout' = 'success';
let calls = 0;
let options: any;
let networkAttempts = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = (async () => { networkAttempts++; throw new Error('External network forbidden in mock test'); }) as typeof fetch;
class FakeTypeSafeClient {
 constructor(config: any) { options = config; }
 async systemOne() {
  calls++;
  if (behavior === 'empty') return {};
  if (behavior !== 'success') throw Object.assign(new Error('synthetic provider failure'), { status: behavior });
  return { answers: {
   escopo_pronto: { noul: 0.8 }, alerta_compliance_legal: { noul: 0.1 }, clareza_relato: { score: 0.9 },
   area_foco: { choice: 'carreira_negocios' }, onde_assina: { choice: 'rotina_trabalho' },
   estilo_presenca: { choice: 'sobrenome_forte' }, subfoco_momento: { choice: 'lideranca_promocao' },
  } };
 }
}
const named = Object.fromEntries(Object.entries(sdk).filter(([name]) => name !== 'default'));
mock.module('@typesafe-ai/sdk', { namedExports: { ...named, TypeSafeClient: FakeTypeSafeClient } });
const { runJevDecision } = await import('./jev-provider');
const state = { nome_completo: 'Pessoa Exemplo', numero_destino: 3, nota_hoje: 60, potencial: 85, bloqueios_triangulos: [], relato_consulente: 'Quero clareza para minha carreira.' };
beforeEach(() => { keys.forEach(key => delete process.env[key]); process.env.TYPESAFE_API_KEY = 'synthetic-mock-key'; behavior = 'success'; calls = 0; networkAttempts = 0; });
after(() => { globalThis.fetch = originalFetch; keys.forEach(key => { const value = previous.get(key); if(value === undefined) delete process.env[key]; else process.env[key] = value; }); });
it('identifica sucesso do JEV mockado sem acesso externo', async () => {
 const result = await runJevDecision(state);
 assert.equal(result.providerUsed, 'typesafe-jev'); assert.equal(calls, 1); assert.equal(networkAttempts, 0);
 assert.equal(options.defaultModel, 'jev-latest'); assert.equal(options.timeout, 1500); assert.equal(options.retry.maxRetries, 0);
});
it('ausência de chave usa regras locais sem instanciar chamada JEV', async () => {
 delete process.env.TYPESAFE_API_KEY;
 assert.equal((await runJevDecision(state)).providerUsed, 'deterministic'); assert.equal(calls, 0); assert.equal(networkAttempts, 0);
});
for (const failure of [401, 402, 403, 429, 500, 'timeout'] as const) {
 it('falha simulada ' + failure + ' retorna fallback local sem provider pago', async () => {
  behavior = failure;
  assert.equal((await runJevDecision(state)).providerUsed, 'deterministic'); assert.equal(calls, 1); assert.equal(networkAttempts, 0);
 });
}
it('resposta vazia do SDK usa fallback local', async () => {
 behavior = 'empty';
 assert.equal((await runJevDecision(state)).providerUsed, 'deterministic'); assert.equal(calls, 1); assert.equal(networkAttempts, 0);
});
