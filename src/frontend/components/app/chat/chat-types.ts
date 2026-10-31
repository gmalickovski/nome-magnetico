/**
 * DEV-235 · Tipos centrais do Chat Conversacional Nome Magnético (v2)
 */

import type { ReactNode } from 'react';

export interface ResultPanelData {
  nome: string;
  score: number;
  expressao: number;
  destino: number;
  motivacao: number;
  missao: number;
  impressao: number;
  potencial: number;
  bloqueiosCount: number;
  bloqueios: Array<{
    codigo: string;
    titulo: string;
    triangulos?: string[];
  }>;
  trianguloVida: {
    topo: number;
    base: number[];
  };
  compatibilidade?: string;
  isHarmonized?: boolean;
}

export interface RadarAxesData {
  expressao: number;
  motivacao: number;
  destino: number;
  harmonia_triangulo: number;
  sequencias: number;
}

export interface ReadingSummaryItem {
  label: string;
  value: string;
}

/** Blocos numerológicos completos (painel lateral / drawer) — espelha buildChatReadingSummary. */
export interface ChatReadingSummary {
  nomeExibido: string;
  triangulos: {
    vida: ChatTrianguloData;
    pessoal: ChatTrianguloData;
    social: ChatTrianguloData;
    destino: ChatTrianguloData;
  };
  bloqueios: ChatBloqueioData[];
  licoesCarmicas: ChatLicaoCarmica[];
  tendenciasOcultas: ChatTendenciaOculta[];
  debitosCarmicos: ChatDebitoCarmico[];
  frequencias: Record<number, number>;
  arcanos: Record<
    number,
    {
      numero: number;
      nome: string;
      palavraChave: string;
      descricao: string;
      desafio: string;
    }
  >;
}

export interface ChatTrianguloData {
  tipo: string;
  linhas: number[][];
  arcanoRegente: number | null;
  arcanosDoMinantes: number[];
  sequenciasNegativas: string[];
  arcanosDePassagem?: number[];
  arcanoAtual?: {
    numero: number | null;
    periodo: string;
    idadeInicio: number;
    idadeFim: number;
  } | null;
  contagemSequencias?: Record<string, number>;
}

export interface ChatBloqueioData {
  codigo: string;
  titulo: string;
  descricao: string;
  triangulos: string[];
  aspectoSaude?: string;
  repeticoesPortriangulo?: Partial<Record<string, number>>;
  totalOcorrencias?: number;
}

export interface ChatLicaoCarmica {
  numero: number;
  titulo: string;
  descricao: string;
  comoTrabalhar: string;
}

export interface ChatTendenciaOculta {
  numero: number;
  frequencia: number;
  titulo: string;
  descricao: string;
  comoEquilibrar: string;
}

export interface ChatDebitoCarmico {
  numero: number;
  titulo: string;
  descricao: string;
  fontes?: string[];
  fixo?: boolean;
}

export interface CandidateSuggestion {
  id: string;
  nome: string;
  score: number;
  expressao: number;
  compatibilidade: string;
  bloqueiosEliminados: number;
  bloqueiosRestantes: number;
  arcanosPositivos: number;
  dimensoes: {
    amor: number;
    carreira: number;
    espiritual: number;
  };
  destaque?: string;
  panel: ResultPanelData;
}

export type MessageSender = 'assistant' | 'user';

export type MessageType =
  | 'text'
  | 'text_input'
  | 'date_input'
  | 'profile_confirm'
  | 'birth_card'
  | 'guess'
  | 'pills'
  | 'questionnaire'
  | 'suggestions'
  | 'custom';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  eyebrow?: string;
  wide?: boolean;
  stepId?: string;
  timestamp?: number;
  options?: Array<{ id: string; label: string; p?: number }>;
  hypotheticalText?: string;
  customNode?: ReactNode;
}

export interface NextQuestionSpec {
  id: string;
  tipo: 'texto' | 'escolha' | 'palpite' | 'nome_data' | 'conclusao' | 'questionnaire';
  prompt: string;
  eyebrow?: string;
  wide?: boolean;
  options?: Array<{ id: string; label: string; p?: number }>;
  palpiteTexto?: string;
  mode?: 'single' | 'multi';
  maxSelect?: number;
  minSelect?: number;
  allowOther?: boolean;
  otherMaxLength?: number;
  caption?: string;
  needsArtisticName?: boolean;
}

export interface DecideLiveResponse {
  next_step: string;
  remaining: number;
  reading: string;
  radarAxes: RadarAxesData | null;
  summary: ReadingSummaryItem[];
  readingSummary?: ChatReadingSummary;
  panel?: ResultPanelData;
  previewTop3: CandidateSuggestion[];
  analysisId?: string;
  next_question?: NextQuestionSpec;
  providerUsed?: string;
}
