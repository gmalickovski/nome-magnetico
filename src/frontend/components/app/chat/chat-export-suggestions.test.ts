import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  chatSuggestionsToExportNames,
  mergeChatSuggestionsCumulative,
  chatSuggestionsExportFingerprint,
} from './chat-export-suggestions.ts';
import type { CandidateSuggestion } from './chat-types.js';

function sug(nome: string, id: string): CandidateSuggestion {
  return {
    id,
    nome,
    score: 80,
    expressao: 1,
    compatibilidade: 'neutro',
    bloqueiosEliminados: 0,
    bloqueiosRestantes: 0,
    arcanosPositivos: 0,
    dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
    panel: {
      nome,
      score: 80,
      expressao: 1,
      destino: 1,
      motivacao: 1,
      missao: 1,
      impressao: 1,
      potencial: 90,
      bloqueiosCount: 0,
      bloqueios: [],
      trianguloVida: { topo: 1, base: [1] },
    },
  };
}

describe('chatSuggestionsToExportNames', () => {
  it('preserva ordem cumulativa e remove duplicatas', () => {
    const names = chatSuggestionsToExportNames([
      sug('Alêxandra', '1'),
      sug('Alexandra M. Vale', '2'),
      sug('Alêxandra', '3'),
      sug('Maria Silva', '4'),
    ]);
    assert.deepEqual(names, ['Alêxandra', 'Alexandra M. Vale', 'Maria Silva']);
  });
});

describe('mergeChatSuggestionsCumulative', () => {
  it('simula 3 iniciais + 3 novas sem substituir (6 cumulativos)', () => {
    const initial = [sug('Ana Vale', '1'), sug('Bia Costa', '2'), sug('Cássia Lima', '3')];
    const round2 = [sug('Dora Melo', '4'), sug('Eva Rios', '5'), sug('Fabi Nunes', '6')];
    const merged = mergeChatSuggestionsCumulative(initial, round2);
    assert.equal(merged.length, 6);
    assert.deepEqual(
      merged.map((s) => s.nome),
      ['Ana Vale', 'Bia Costa', 'Cássia Lima', 'Dora Melo', 'Eva Rios', 'Fabi Nunes'],
    );
  });

  it('dedupe quando a API repete nome', () => {
    const merged = mergeChatSuggestionsCumulative(
      [sug('Ana Vale', '1')],
      [sug('Ana Vale', '2'), sug('Bia Costa', '3')],
    );
    assert.deepEqual(merged.map((s) => s.nome), ['Ana Vale', 'Bia Costa']);
    assert.equal(merged[0].id, '2');
  });
});

describe('chatSuggestionsExportFingerprint', () => {
  it('muda quando a lista exportada muda', () => {
    const a = chatSuggestionsExportFingerprint(['A', 'B']);
    const b = chatSuggestionsExportFingerprint(['A', 'B', 'C']);
    assert.notEqual(a, b);
  });
});
