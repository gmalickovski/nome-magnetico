import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPreviousFlowStep,
  isFirstQuestionnaireStep,
  rewindCollectStateToStep,
} from './chat-dock-step-back.ts';
import { INITIAL_COLLECT_STATE } from './decide-live-bridge.ts';

describe('chat-dock-step-back', () => {
  it('primeira pergunta do questionário', () => {
    assert.equal(isFirstQuestionnaireStep('nome_uso'), true);
    assert.equal(isFirstQuestionnaireStep('relacao_nome'), false);
  });

  it('passo anterior no fluxo', () => {
    assert.equal(getPreviousFlowStep('relacao_nome'), 'sobrenomes_uso');
    assert.equal(getPreviousFlowStep('nome_uso'), null);
    assert.equal(getPreviousFlowStep('fim_coleta'), 'palpite');
  });

  it('rewind limpa palpite ao voltar de fim_coleta', () => {
    const s = {
      ...INITIAL_COLLECT_STATE,
      nomeUsoBase: 'Gui',
      palpiteStatus: 'acertou' as const,
    };
    const rew = rewindCollectStateToStep(s, 'palpite');
    assert.equal(rew.palpiteStatus, null);
    assert.equal(rew.nomeUsoBase, 'Gui');
  });
});
