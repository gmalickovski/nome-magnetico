/**
 * Navegação “voltar” no fluxo do chat (questionário + palpite + sugestões).
 */

import { QUESTIONNAIRE_STEP_ORDER, type QuestionnaireStepId } from '../../../../shared/interactive-engine/questionnaire-adaptive.js';
import type { ChatCollectState } from './decide-live-bridge.js';

export const POST_BIRTH_FLOW_STEPS = [
  ...QUESTIONNAIRE_STEP_ORDER,
  'palpite',
] as const;

export type PostBirthFlowStep = (typeof POST_BIRTH_FLOW_STEPS)[number];

export function isFirstQuestionnaireStep(stepId: string): boolean {
  return stepId === QUESTIONNAIRE_STEP_ORDER[0];
}

export function getPreviousFlowStep(currentStepId: string): PostBirthFlowStep | 'suggestions' | null {
  if (currentStepId === 'fim_coleta' || currentStepId === 'conclusao') {
    return 'palpite';
  }
  const idx = POST_BIRTH_FLOW_STEPS.indexOf(currentStepId as PostBirthFlowStep);
  if (idx <= 0) return null;
  return POST_BIRTH_FLOW_STEPS[idx - 1]!;
}

/** Limpa respostas do passo atual e posteriores (estado antes de re-responder o passo anterior). */
export function rewindCollectStateToStep(
  state: ChatCollectState,
  targetStep: PostBirthFlowStep
): ChatCollectState {
  const next: ChatCollectState = { ...state };
  const targetIdx = POST_BIRTH_FLOW_STEPS.indexOf(targetStep);

  for (let i = POST_BIRTH_FLOW_STEPS.length - 1; i > targetIdx; i--) {
    clearStepFields(next, POST_BIRTH_FLOW_STEPS[i]!);
  }
  clearStepFields(next, targetStep);
  return next;
}

function clearStepFields(state: ChatCollectState, stepId: string): void {
  switch (stepId) {
    case 'nome_uso':
      state.nomeUsoBase = null;
      break;
    case 'sobrenomes_uso':
      state.sobrenomesDecididos = false;
      state.sobrenomesObrigatorios = [];
      state.sobrenomesExcluidos = [];
      break;
    case 'relacao_nome':
      state.relacaoNome = null;
      break;
    case 'onde_assina':
      state.ondeAssinaRaw = [];
      state.ondeAssina = [];
      state.nomeArtistico = null;
      break;
    case 'estilo_presenca':
      state.estiloPresenca = [];
      break;
    case 'area_foco':
      state.areaFoco = null;
      state.subfocoMomento = null;
      break;
    case 'subfoco':
      state.subfocoMomento = null;
      state.subfocosOrdenados = [];
      break;
    case 'abertura_mudanca':
      state.aberturaMudanca = null;
      state.estiloPreferido = null;
      break;
    case 'palpite':
      state.palpiteStatus = null;
      break;
    default:
      break;
  }
}

export function stepForPosthog(stepId: string): string {
  return stepId;
}
