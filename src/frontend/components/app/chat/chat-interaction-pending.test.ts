import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isInteractionPending } from './chat-interaction-pending.ts';
import type { ChatMessage } from './chat-types.ts';

function msg(partial: Partial<ChatMessage> & Pick<ChatMessage, 'stepId'>): ChatMessage {
  return {
    id: '1',
    sender: 'assistant',
    type: 'text_input',
    content: 'Pergunta?',
    ...partial,
  };
}

describe('isInteractionPending', () => {
  it('mostra controles pós-certidão no passo sobrenomes_uso', () => {
    const m = msg({ stepId: 'sobrenomes_uso', type: 'questionnaire' });
    assert.equal(
      isInteractionPending(m, 'sobrenomes_uso', {}, true),
      true
    );
  });

  it('esconde controles pós-certidão quando o passo já foi respondido', () => {
    const m = msg({ stepId: 'sobrenomes_uso', type: 'questionnaire' });
    assert.equal(
      isInteractionPending(m, 'relacao_nome', { sobrenomes_uso: 'ok' }, true),
      false
    );
  });

  it('não mostra onboarding após birthConfirmed', () => {
    const m = msg({ stepId: 'onboarding_nome', type: 'text_input' });
    assert.equal(isInteractionPending(m, 'sobrenomes_uso', {}, true), false);
  });

  it('mostra onboarding antes de birthConfirmed', () => {
    const m = msg({ stepId: 'onboarding_confirm', type: 'profile_confirm' });
    assert.equal(isInteractionPending(m, 'nome_nascimento', {}, false), true);
  });
});
