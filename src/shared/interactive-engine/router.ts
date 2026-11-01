/**
 * Roteador Determinístico em Código (DEV-235 · questionário adaptativo 8 + palpite).
 */

import type { PassoChatId } from './partitura';
import type { AreaFocoNomeMagnetico } from './copy';
import {
  QUESTIONNAIRE_STEP_ORDER,
  type QuestionnaireStepId,
} from './questionnaire-adaptive';

export interface RouterState {
  nomeCompleto?: string;
  dataNascimento?: string;
  nomeUsoDefinido?: boolean;
  sobrenomesDecididos?: boolean;
  relacaoNome?: string | null;
  ondeAssinaDecidido?: boolean;
  estiloPresencaDecidido?: boolean;
  areaFoco?: AreaFocoNomeMagnetico | null;
  subfocoDecidido?: boolean;
  aberturaMudanca?: string | null;
  palpiteStatus?: 'acertou' | 'parcial' | 'nao' | null;
  /** Legado — preenchido pelo mapeamento da abertura_mudanca */
  estiloPreferido?: string | null;
  detalheInformado?: string | null;
}

function nextQuestionnaireStep(state: RouterState): QuestionnaireStepId | null {
  if (!state.nomeUsoDefinido) return 'nome_uso';
  if (!state.sobrenomesDecididos) return 'sobrenomes_uso';
  if (!state.relacaoNome) return 'relacao_nome';
  if (!state.ondeAssinaDecidido) return 'onde_assina';
  if (!state.estiloPresencaDecidido) return 'estilo_presenca';
  if (!state.areaFoco) return 'area_foco';
  if (!state.subfocoDecidido) return 'subfoco';
  if (!state.aberturaMudanca) return 'abertura_mudanca';
  return null;
}

const PROMPTS: Record<QuestionnaireStepId, string> = {
  nome_uso: 'Como as pessoas te chamam no dia a dia?',
  sobrenomes_uso: 'Quais sobrenomes você usa quando assina?',
  relacao_nome: 'Como você se sente com o seu nome hoje?',
  onde_assina: 'Onde você mais usa a sua assinatura?',
  estilo_presenca: 'Como você quer que te percebam?',
  area_foco: 'O que mais pede a sua atenção agora?',
  subfoco: 'O que mais combina com esse foco agora?',
  abertura_mudanca: 'Quanto você topa mudar na assinatura?',
};

export function questionnaireStepsRemaining(state: RouterState): number {
  let n = 0;
  if (!state.nomeUsoDefinido) n++;
  if (!state.sobrenomesDecididos) n++;
  if (!state.relacaoNome) n++;
  if (!state.ondeAssinaDecidido) n++;
  if (!state.estiloPresencaDecidido) n++;
  if (!state.areaFoco) n++;
  if (!state.subfocoDecidido) n++;
  if (!state.aberturaMudanca) n++;
  if (!state.palpiteStatus) n++;
  return n;
}

export interface NextStepDecision {
  nextStep: PassoChatId;
  remainingSteps: number;
  promptSugestao: string;
  eyebrow?: string;
}

export function determineNextStep(state: RouterState): NextStepDecision {
  if (
    !state.nomeCompleto ||
    state.nomeCompleto.trim().split(/\s+/).length < 2 ||
    !state.dataNascimento
  ) {
    return {
      nextStep: 'nome_nascimento',
      remainingSteps: QUESTIONNAIRE_STEP_ORDER.length + 1,
      promptSugestao: 'Como está seu nome completo na certidão de nascimento?',
    };
  }

  const qStep = nextQuestionnaireStep(state);
  if (qStep) {
    const remaining = questionnaireStepsRemaining(state);
    return {
      nextStep: qStep as PassoChatId,
      remainingSteps: remaining,
      promptSugestao: PROMPTS[qStep],
    };
  }

  if (!state.palpiteStatus) {
    return {
      nextStep: 'palpite',
      remainingSteps: 1,
      promptSugestao: 'Calculando a sua leitura.',
      eyebrow: 'Será que é isso?',
    };
  }

  return {
    nextStep: 'fim_coleta',
    remainingSteps: 0,
    promptSugestao: 'Harmonizamos todas as combinações cabalísticas do seu mapa. Veja suas opções:',
  };
}
