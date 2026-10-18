import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avaliarNome } from './score.ts';
import { obterNivelV3 } from '../../shared/score-v3.ts';

test('recalculo v3: avaliacao consistente de analises legadas para v3', () => {
  // Caso de ouro: Guilherme Malickovski Correa (66 N3, potencial 95)
  const evalV3 = avaliarNome('Guilherme Malickovski Correa', '14/02/1990', { calcularPotencial: true });
  assert.equal(evalV3.score_v3, 66);
  assert.equal(evalV3.nivel.codigo, 'N3');
  assert.equal(evalV3.potencial, 95);

  const nivelInfo = obterNivelV3(evalV3.score_v3);
  assert.equal(nivelInfo.codigo, 'N3');
  assert.equal(nivelInfo.rotulo, 'Equilíbrio Parcial');
});

test('recalculo v3: determinismo e preservacao de regras para analises recalculadas', () => {
  // Teste de caso de transição Lucas Henrique Barbosa (25 N1, potencial 96)
  const evalLucas = avaliarNome('Lucas Henrique Barbosa', '27/04/1991', { calcularPotencial: true });
  assert.equal(evalLucas.score_v3, 25);
  assert.equal(evalLucas.nivel.codigo, 'N1');
  assert.equal(evalLucas.potencial, 96);
});
