/**
 * Navegação “voltar” no fluxo do chat (questionário + palpite + sugestões).
 */

import {
  DEV320_STEPS,
  QUESTIONNAIRE_STEP_ORDER,
  isQuestionnaireStepSkipped,
  type QuestionnaireStepId,
} from '../../../../shared/interactive-engine/questionnaire-adaptive.js';
import type { ChatCollectState } from './decide-live-bridge.js';
import type { ChatMessage } from './chat-types.js';
import { isOnboardingStepId } from './chat-interaction-pending.js';

export const POST_BIRTH_FLOW_STEPS = [
  ...QUESTIONNAIRE_STEP_ORDER,
  'palpite',
] as const;

export type PostBirthFlowStep = (typeof POST_BIRTH_FLOW_STEPS)[number];

export function isFirstQuestionnaireStep(
  stepId: string,
  state?: Partial<Pick<ChatCollectState, 'fluxoMotivoAtivo'>>
): boolean {
  // DEV-320: sem o fluxo com motivo, o primeiro passo efetivo continua sendo `nome_uso`.
  if (stepId === 'nome_uso') return !state?.fluxoMotivoAtivo;
  return stepId === QUESTIONNAIRE_STEP_ORDER[0];
}

/**
 * Passo anterior no fluxo. Com o estado da coleta, pula perguntas que o roteiro não fez
 * por já estarem inferidas (DEV-303), para o "voltar" não abrir uma pergunta nunca feita.
 */
export function getPreviousFlowStep(
  currentStepId: string,
  state?: Pick<ChatCollectState, 'relacaoNome' | 'aberturaMudanca' | 'ondeAssinaRaw'> &
    Partial<Pick<ChatCollectState, 'fluxoMotivoAtivo' | 'motivoHarmonizacao' | 'areaArtistica' | 'bebeSituacao'>>
): PostBirthFlowStep | 'suggestions' | null {
  let idx: number;
  if (currentStepId === 'fim_coleta' || currentStepId === 'conclusao') {
    idx = POST_BIRTH_FLOW_STEPS.length - 1;
    if (!state) return POST_BIRTH_FLOW_STEPS[idx]!;
  } else {
    idx = POST_BIRTH_FLOW_STEPS.indexOf(currentStepId as PostBirthFlowStep);
    if (idx <= 0) return null;
    idx -= 1;
  }
  const pulado = (candidato: PostBirthFlowStep): boolean => {
    // DEV-326: o caminho do bebê não tem palpite.
    if (candidato === 'palpite') return Boolean(state?.fluxoMotivoAtivo) && state?.motivoHarmonizacao === 'bebe';
    const step = candidato as QuestionnaireStepId;
    // Sem estado: só os passos da DEV-320 contam como pulados (fluxo desligado).
    if (!state) return DEV320_STEPS.includes(step);
    return isQuestionnaireStepSkipped(step, state);
  };
  while (idx > 0 && pulado(POST_BIRTH_FLOW_STEPS[idx]!)) {
    idx -= 1;
  }
  const anterior = POST_BIRTH_FLOW_STEPS[idx]!;
  // DEV-320: o primeiro passo (motivo) pode ter sido pulado com o fluxo desligado.
  if (idx === 0 && pulado(anterior)) return null;
  return anterior;
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
      state.areaFocoOutro = null;
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
    case 'preferencias_assinatura':
      state.preferenciasAssinatura = [];
      break;
    case 'prioridade_conflito':
      state.prioridadeConflito = null;
      break;
    case 'palpite':
      state.palpiteStatus = null;
      break;
    // DEV-320
    case 'motivo_harmonizacao':
      state.motivoHarmonizacao = null;
      state.bebeMae = null;
      state.bebePai = null;
      state.bebeSituacao = null;
      state.bebeDataTipo = null;
      state.bebeSexo = null;
      state.bebeData = null;
      state.bebeSobrenomes = [];
      state.bebeNomesPais = [];
      state.bebeNomeRegistrado = null;
      state.bebeEstilos = [];
      if (state.ondeAssinaRaw.length === 1 && state.ondeAssinaRaw[0] === 'arte_criativo') {
        state.ondeAssinaRaw = [];
        state.ondeAssina = [];
        state.estiloPreferido = null;
      }
      break;
    case 'area_artistica':
      state.areaArtistica = null;
      state.areaArtisticaOutro = null;
      break;
    case 'detalhe_artistico':
      state.detalheArtistico = [];
      break;
    case 'genero_persona':
      state.generoPersona = null;
      break;
    case 'imagem_artistica':
      state.imagemArtistica = [];
      break;
    case 'tipo_nome_artistico':
      state.tipoNomeArtistico = null;
      break;
    case 'outros_usos':
      state.outrosUsos = [];
      break;
    // DEV-326
    case 'bebe_pais':
      state.bebeMae = null;
      state.bebePai = null;
      break;
    case 'bebe_situacao':
      state.bebeSituacao = null;
      break;
    case 'bebe_data_tipo':
      state.bebeDataTipo = null;
      break;
    case 'bebe_sexo':
      state.bebeSexo = null;
      break;
    case 'bebe_dados':
      state.bebeData = null;
      state.bebeSobrenomes = [];
      state.bebeNomesPais = [];
      state.bebeNomeRegistrado = null;
      break;
    case 'bebe_estilo':
      state.bebeEstilos = [];
      break;
    default:
      break;
  }
}

export function stepForPosthog(stepId: string): string {
  return stepId;
}

export interface BackNavigationPlan {
  /** Mensagens que ficam (termina na pergunta de destino, que volta a ser a pendente). */
  kept: ChatMessage[];
  /** Respostas desfeitas: somam de volta ao contador de passos restantes. */
  removedAnswers: number;
  /** Chaves de `answers` a apagar (o destino e tudo que veio depois). */
  undoneStepIds: Set<string>;
}

/**
 * DEV-324: o que cortar ao voltar para `target`. Puro, sem estado do React.
 * Devolve `null` quando o chat não tem o cartão de pergunta do destino
 * (nesse caso o "Voltar" não faz nada).
 */
export function planBackNavigation(
  messages: readonly ChatMessage[],
  target: PostBirthFlowStep
): BackNavigationPlan | null {
  let idx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.sender === 'assistant' && m.stepId === target && (m.type === 'questionnaire' || m.type === 'guess')) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return null;
  const removedAnswers = messages
    .slice(idx + 1)
    .filter((m) => m.sender === 'user' && m.stepId && !isOnboardingStepId(m.stepId)).length;
  const targetIdx = POST_BIRTH_FLOW_STEPS.indexOf(target);
  const undoneStepIds = new Set<string>([
    ...POST_BIRTH_FLOW_STEPS.slice(targetIdx),
    'fim_coleta',
    'conclusao',
  ]);
  return { kept: messages.slice(0, idx + 1) as ChatMessage[], removedAnswers, undoneStepIds };
}
