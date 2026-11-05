import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chatSuggestionsToExportNames } from './chat-export-suggestions.ts';
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
