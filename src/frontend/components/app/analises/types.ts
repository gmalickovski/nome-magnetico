import type {
  ChatReadingSummary,
  RadarAxesData,
  ResultPanelData,
} from '../chat/chat-types.js';
import type { HarmonySuggestionCardData } from '../../landing/ProductResultFrame.js';

export interface SavedAnalysisCandidateRow {
  nome: string;
  score: number;
  compatibilidade: string;
  expressao: number;
  motivacao: number;
  impressao: number;
  missao: number;
  bloqueios: number;
}

export interface SavedAnalysisPanelData {
  birthPanel: ResultPanelData | null;
  harmonizedPanel: ResultPanelData | null;
  showScoreCard: boolean;
  showStarDetail: boolean;
  starPanelData: ResultPanelData | null;
  isSuggestion: boolean;
  radarAxes: RadarAxesData | null;
  radarOverlayAxes: RadarAxesData | null;
  radarLabels?: Record<string, string>;
  radarShowNumericLabels: boolean;
  contextChips: string[];
  showRadar: boolean;
  readingSummary: ChatReadingSummary | null;
  showReadingSummary: boolean;
  chosenScore: number | null;
  baseScore: number | null;
  candidateSummary?: SavedAnalysisCandidateRow[];
}

export interface SavedAnalysisItem {
  id: string;
  pdfAnalysisId?: string | null;
  isSynthetic?: boolean;
  productType: string;
  productName: string;
  status: string;
  createdAt: string;
  dateFormatted: string;
  nomeExibido: string;
  birthName: string | null;
  birthDateFormatted: string | null;
  score: number | null;
  isV3: boolean;
  isFree: boolean;
  isFavorite: boolean;
  canFavorite: boolean;
  canDelete: boolean;
  isAnalystGenerated: boolean;
  /** DEV-317: de onde veio o nome do card (tag visível em Minhas análises). */
  origemNome?: 'nascimento' | 'sistema' | 'teste';
  recalculatedFromVersion: string | null;
  parentAnalysisId: string | null;
  errorMessage: string | null;
  cardData: HarmonySuggestionCardData | null;
  panelData: SavedAnalysisPanelData;
}
