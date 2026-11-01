import type { ChatMessage } from './chat-types.js';

export function isOnboardingStepId(stepId?: string): boolean {
  return Boolean(stepId?.startsWith('onboarding_'));
}

/**
 * Controla se a mensagem do assistente ainda deve exibir inputs inline (pills/campo).
 * Onboarding: só antes de birthConfirmed. Pós-certidão: passo atual sem resposta.
 */
export function isInteractionPending(
  msg: ChatMessage,
  currentStepId: string,
  answers: Record<string, string>,
  birthConfirmed: boolean
): boolean {
  if (!msg.stepId) return false;

  if (isOnboardingStepId(msg.stepId)) {
    if (birthConfirmed) return false;
    return !answers[msg.stepId];
  }

  if (!birthConfirmed) return false;

  return msg.stepId === currentStepId && !answers[msg.stepId];
}
