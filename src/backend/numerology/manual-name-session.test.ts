import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ManualNameSessions, ManualNameSessionError } from './manual-name-session';
import { buildClientBirthNamePanel } from './birth-name-panel';
import { normalizarChaveNome, validarNomeManual } from '../../shared/nome-social/manual-name-limits';
import type { CandidateSuggestion } from '../../frontend/components/app/chat/chat-types';

const context = { nomeNascimento: 'Alexandra Mendes Vale', dataNascimento: '07/03/1992', areaFoco: 'carreira_negocios', ondeAssinaRaw: ['contratos'] };
function candidate(nome: string): CandidateSuggestion {
  const panel = buildClientBirthNamePanel(nome, context.dataNascimento);
  return { id: nome, nome, origem: 'manual', score: panel.score, expressao: panel.expressao, compatibilidade: panel.compatibilidade ?? 'neutro', bloqueiosEliminados: 0, bloqueiosRestantes: panel.bloqueiosCount, arcanosPositivos: 0, dimensoes: { amor: 0, carreira: 0, espiritual: 0 }, panel };
}

describe('DEV-299 avaliação manual por sessão', () => {
  it('mantém acentos relevantes e rejeita entrada inválida', () => {
    assert.notEqual(normalizarChaveNome('Ana'), normalizarChaveNome('Aná'));
    assert.equal(normalizarChaveNome(' Ana '), normalizarChaveNome('ANA'));
    for (const name of ['A', 'Ana 123', 'Ana Ⅷ', '<img>', 'Åna', 'Ǻna', 'A\u030Ana', 'Ana\nVale', 'A'.repeat(151)]) assert.ok(validarNomeManual(name), name);
    for (const name of ['Ana', 'Aná', 'D’Angelo', 'Maria-Clara']) assert.equal(validarNomeManual(name), null, name);
  });

  it('duplicata e erro não consomem; nota baixa é resultado válido', () => {
    const store = new ManualNameSessions();
    const id = store.start('owner', 'chat', context, ['Ana Vale']);
    let calls = 0;
    assert.equal(store.evaluate('owner', id, 'ANA VALE', () => { calls++; return candidate('ANA VALE'); }).duplicata, true);
    assert.equal(calls, 0);
    assert.throws(() => store.evaluate('owner', id, 'Ana Rosa', () => { throw new Error('fixture'); }));
    assert.equal(store.get('owner', id).results.size, 0);
    const result = store.evaluate('owner', id, 'Ana Rosa', () => ({ ...candidate('Ana Rosa'), score: 1 }));
    assert.equal(result.candidate?.score, 1);
    assert.equal(result.used, 1);
    const again = store.evaluate('owner', id, 'ANA ROSA', () => { throw new Error('Não recalcular'); });
    assert.equal(again.duplicata, true);
    assert.equal(again.candidate?.nome, 'Ana Rosa');
    assert.equal(again.used, 1);
  });

  it('pedidos concorrentes não ultrapassam cinco nem duplicam resultados', async () => {
    const store = new ManualNameSessions(); const id = store.start('owner', 'chat', context, []);
    const results = await Promise.allSettled(['Ana Rosa', 'ANA ROSA', 'Ana Maria', 'Ana Vale', 'Ana Silva', 'Ana Santos', 'Ana Prado'].map(nome => Promise.resolve().then(() => store.evaluate('owner', id, nome, () => candidate(nome)))));
    assert.equal(store.get('owner', id).results.size, 5);
    assert.equal(results.filter(r => r.status === 'rejected').length, 1);
    assert.equal(results.filter(r => r.status === 'fulfilled' && r.value.duplicata).length, 1);
    assert.equal(store.start('owner', 'chat', context, []), id, 'retomar mesma sessão conserva cota');
  });

  it('nega titular diferente, troca de contexto, expiração e worker desconhecido', () => {
    let now = 0; const store = new ManualNameSessions(() => now, 100);
    const id = store.start('owner', 'chat', context, []);
    assert.throws(() => store.get('other', id), ManualNameSessionError);
    assert.throws(() => store.start('owner', 'chat', { ...context, areaFoco: null }, []), ManualNameSessionError);
    assert.throws(() => new ManualNameSessions().get('owner', id), ManualNameSessionError);
    now = 101;
    assert.throws(() => store.get('owner', id), ManualNameSessionError);
  });
});
