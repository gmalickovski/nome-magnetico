/**
 * Roteador Determinístico em Código (DEV-235 · Seção 5A).
 * Regra obrigatória: O roteamento é sempre em código; o Jev nunca decide a rota, só julga.
 */

import type { PassoChatId } from './partitura';
import type { AreaFocoNomeMagnetico } from './copy';

export interface RouterState {
  nomeCompleto?: string;
  dataNascimento?: string;
  sobrenomesDecididos?: boolean;
  ondeVaiUsar?: string[];
  areaFoco?: AreaFocoNomeMagnetico | null;
  subfocoMomento?: string | null;
  palpiteStatus?: 'acertou' | 'parcial' | 'nao' | null;
  estiloPreferido?: string | null;
  detalheInformado?: string | null;
}

export interface NextStepDecision {
  nextStep: PassoChatId;
  remainingSteps: number;
  promptSugestao: string;
  eyebrow?: string;
}

export function determineNextStep(state: RouterState): NextStepDecision {
  // Passo 1: Nome e Data
  if (!state.nomeCompleto || state.nomeCompleto.trim().split(/\s+/).length < 2 || !state.dataNascimento) {
    return {
      nextStep: 'nome_nascimento',
      remainingSteps: 6,
      promptSugestao: 'Como está seu nome completo na certidão de nascimento?',
    };
  }

  // Passo 2: Sobrenomes
  if (!state.sobrenomesDecididos) {
    return {
      nextStep: 'sobrenomes',
      remainingSteps: 5,
      promptSugestao: 'Olhando para os seus sobrenomes, quais você faz questão de manter na sua assinatura?',
    };
  }

  // Passo 3: Onde vai usar
  if (!state.ondeVaiUsar || state.ondeVaiUsar.length === 0) {
    return {
      nextStep: 'onde_vai_usar',
      remainingSteps: 4,
      promptSugestao: 'Onde você pretende usar essa nova assinatura primeiro no dia a dia?',
    };
  }

  // Passo 4: Foco / Momento
  if (!state.areaFoco) {
    return {
      nextStep: 'foco_momento',
      remainingSteps: 3,
      promptSugestao: 'Qual área da sua vida você mais quer movimentar agora com a nova assinatura?',
      eyebrow: 'Uma pergunta para entendermos melhor',
    };
  }

  // Passo 5 & 6: Palpite e Subfoco
  if (!state.palpiteStatus) {
    return {
      nextStep: 'palpite',
      remainingSteps: 2,
      promptSugestao: 'Calculando a sua leitura.',
      eyebrow: 'Será que é isso?',
    };
  }

  // Passo 7: Formato / Estilo
  if (!state.estiloPreferido) {
    return {
      nextStep: 'formato_preferido',
      remainingSteps: 1,
      promptSugestao: 'Como você prefere ser chamado e assinar no dia a dia?',
      eyebrow: 'Só mais um detalhe',
    };
  }

  // Passo 8: Conclusão / Revelação
  return {
    nextStep: 'fim_coleta',
    remainingSteps: 0,
    promptSugestao: 'Harmonizamos todas as combinações cabalísticas do seu mapa. Veja suas opções:',
  };
}
