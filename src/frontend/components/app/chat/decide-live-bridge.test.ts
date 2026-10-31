import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyQuestionnaireStep,
  buildNextQuestion,
  buildSobrenomePillOptions,
  INITIAL_COLLECT_STATE,
} from './decide-live-bridge.js';

describe('buildNextQuestion · sobrenomes_uso', () => {
  it('labels só conteúdo, sem verbo Manter', () => {
    const pills = buildSobrenomePillOptions(['Malickovski', 'Correa']);
    assert.deepEqual(
      pills.map((p) => p.label),
      ['Malickovski', 'Correa']
    );
  });

  it('questionário nome_uso inclui options', () => {
    const q = buildNextQuestion(
      {
        next_step: 'nome_uso',
        remaining: 8,
        promptSugestao: 'Como as pessoas te chamam no dia a dia?',
      },
      'Guilherme Malickovski Correa',
      INITIAL_COLLECT_STATE,
      ['Malickovski', 'Correa']
    );
    assert.equal(q?.id, 'nome_uso');
    assert.equal(q?.tipo, 'questionnaire');
    assert.ok(q?.options?.some((o) => o.label === 'Guilherme'));
    assert.ok(q?.options?.some((o) => o.label === 'Outro jeito'));
  });

  it('múltipla escolha preserva ordem dos toques em subfoco', () => {
    const next = applyQuestionnaireStep(
      { ...INITIAL_COLLECT_STATE, areaFoco: 'carreira_negocios' },
      'subfoco',
      {
        optionIds: ['lideranca_promocao', 'foco_execucao'],
        labels: ['Buscando reconhecimento', 'Quero crescer onde estou'],
      }
    );
    assert.deepEqual(next.subfocosOrdenados, ['lideranca_promocao', 'foco_execucao']);
  });
});
