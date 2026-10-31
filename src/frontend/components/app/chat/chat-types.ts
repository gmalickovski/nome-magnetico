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
  momento: number;
  objetivo: number;
  uso: number;
  apego_sobrenome: number;
  urgencia: number;
}

export interface ReadingSummaryItem {
  label: string;
  value: string;
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
  | 'birth_card'
  | 'guess'
  | 'pills'
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
  tipo: 'texto' | 'escolha' | 'palpite' | 'nome_data' | 'conclusao';
  prompt: string;
  eyebrow?: string;
  wide?: boolean;
  options?: Array<{ id: string; label: string; p?: number }>;
  palpiteTexto?: string;
}

export interface DecideLiveResponse {
  next_step: string;
  remaining: number;
  reading: string;
  radarAxes: RadarAxesData;
  summary: ReadingSummaryItem[];
  panel: ResultPanelData;
  previewTop3: CandidateSuggestion[];
  analysisId?: string;
  next_question?: NextQuestionSpec;
}
