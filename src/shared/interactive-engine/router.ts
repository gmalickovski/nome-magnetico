/**
 * Roteador Determinístico em Código (DEV-235 · questionário adaptativo 8 + palpite).
 */

import type { PassoChatId } from './partitura';
import type { AreaFocoNomeMagnetico } from './copy';
import {
  getQuestionSpec,
  QUESTIONNAIRE_STEP_ORDER,
  isQuestionnaireStepSkipped,
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
  /** DEV-303 */
  ondeAssinaRaw?: string[];
  preferenciasDecididas?: boolean;
  prioridadeConflito?: string | null;
  /** DEV-320 */
  fluxoMotivoAtivo?: boolean;
  motivoHarmonizacao?: string | null;
  areaArtistica?: string | null;
  detalheArtisticoDecidido?: boolean;
  generoPersona?: string | null;
  imagemArtisticaDecidida?: boolean;
  tipoNomeArtistico?: string | null;
  outrosUsosDecididos?: boolean;
}

function isStepAnswered(step: QuestionnaireStepId, state: RouterState): boolean {
  switch (step) {
    case 'motivo_harmonizacao':
      return Boolean(state.motivoHarmonizacao);
    case 'area_artistica':
      return Boolean(state.areaArtistica);
    case 'detalhe_artistico':
      return Boolean(state.detalheArtisticoDecidido);
    case 'genero_persona':
      return Boolean(state.generoPersona);
    case 'imagem_artistica':
      return Boolean(state.imagemArtisticaDecidida);
    case 'tipo_nome_artistico':
      return Boolean(state.tipoNomeArtistico);
    case 'outros_usos':
      return Boolean(state.outrosUsosDecididos);
    case 'nome_uso':
      return Boolean(state.nomeUsoDefinido);
    case 'sobrenomes_uso':
      return Boolean(state.sobrenomesDecididos);
    case 'relacao_nome':
      return Boolean(state.relacaoNome);
    case 'onde_assina':
      return Boolean(state.ondeAssinaDecidido);
    case 'estilo_presenca':
      return Boolean(state.estiloPresencaDecidido);
    case 'area_foco':
      return Boolean(state.areaFoco);
    case 'subfoco':
      return Boolean(state.subfocoDecidido);
    case 'abertura_mudanca':
      return Boolean(state.aberturaMudanca);
    case 'preferencias_assinatura':
      return Boolean(state.preferenciasDecididas);
    case 'prioridade_conflito':
      return Boolean(state.prioridadeConflito);
    default:
      return true;
  }
}

/** DEV-303: pula o que já está inferido (ex.: "Não me representa" dispensa a abertura para mudar). */
function nextQuestionnaireStep(state: RouterState): QuestionnaireStepId | null {
  for (const step of QUESTIONNAIRE_STEP_ORDER) {
    if (isStepAnswered(step, state)) continue;
    if (isQuestionnaireStepSkipped(step, state)) continue;
    return step;
  }
  return null;
}

const PROMPTS: Record<QuestionnaireStepId, string> = {
  motivo_harmonizacao: 'Qual é o motivo principal para harmonizar o seu nome?',
  area_artistica: 'Em qual área artística você vai usar o nome?',
  detalhe_artistico: 'Conte um pouco mais sobre o seu trabalho artístico.',
  genero_persona: 'Como o nome artístico deve soar?',
  imagem_artistica: 'Qual imagem você quer passar com esse nome?',
  tipo_nome_artistico:
    'Você aceita um nome próximo do seu, um nome totalmente diferente ou as duas coisas?',
  outros_usos: 'Vai usar esse nome em mais algum lugar?',
  nome_uso: 'Como as pessoas te chamam no dia a dia?',
  sobrenomes_uso: 'Quais sobrenomes você usa quando assina?',
  relacao_nome: 'Como você se sente com o seu nome hoje?',
  onde_assina: 'Onde você mais usa a sua assinatura?',
  estilo_presenca: 'Como você quer que te percebam?',
  area_foco: 'O que mais pede a sua atenção agora?',
  subfoco: 'O que mais combina com esse foco agora?',
  abertura_mudanca: 'Quanto você topa mudar na assinatura?',
  preferencias_assinatura: 'Tem algo que você quer manter ou evitar na assinatura?',
  prioridade_conflito: 'Se for preciso escolher, o que pesa mais para você?',
};

export function questionnaireStepsRemaining(state: RouterState): number {
  let n = 0;
  for (const step of QUESTIONNAIRE_STEP_ORDER) {
    if (isStepAnswered(step, state)) continue;
    if (isQuestionnaireStepSkipped(step, state)) continue;
    n++;
  }
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
      // DEV-320: o detalhe artístico muda de pergunta conforme a área.
      promptSugestao:
        qStep === 'detalhe_artistico'
          ? getQuestionSpec(qStep, {
              nomeCompleto: state.nomeCompleto ?? '',
              sobrenomes: [],
              areaFoco: null,
              areaArtistica: state.areaArtistica ?? null,
            }).prompt
          : PROMPTS[qStep],
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
