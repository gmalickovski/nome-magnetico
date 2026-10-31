/**
 * Persistência local do chat v2 (DEV-235) — retoma após reload; zera só em reinício ou "Gerar análise".
 */

import type {
  ChatMessage,
  ChatReadingSummary,
  CandidateSuggestion,
  RadarAxesData,
  ReadingSummaryItem,
  ResultPanelData,
} from './chat-types.js';
import type { ChatCollectState } from './decide-live-bridge.js';

const STORAGE_VERSION = 2 as const;

export interface PersistedChatSession {
  version: typeof STORAGE_VERSION;
  savedAt: number;
  messages: ChatMessage[];
  answers: Record<string, string>;
  confirmedName: string;
  confirmedDate: string;
  draftNome: string;
  draftDate: string;
  draftGender: string;
  stepIndex: number;
  currentStepId: string;
  remaining: number;
  birthConfirmed: boolean;
  collectState: ChatCollectState;
  sobrenomesDetectados: string[];
  radarAxes: RadarAxesData | null;
  summaryItems: ReadingSummaryItem[];
  basePanel: ResultPanelData | null;
  birthReadingSummary?: ChatReadingSummary | null;
  harmonizedSummaries?: Record<string, ChatReadingSummary>;
  activeSuggestionId: string | null;
  suggestions: CandidateSuggestion[];
  analysisId?: string;
}

function storageKey(userId: string): string {
  return `nm-chat-v2:${userId}`;
}

export function loadChatSession(userId: string): PersistedChatSession | null {
  if (!userId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedChatSession;
    if (!Array.isArray(parsed.messages)) {
      return null;
    }
    if (parsed.version !== 1 && parsed.version !== STORAGE_VERSION) {
      return null;
    }
    return {
      ...parsed,
      version: STORAGE_VERSION,
      birthReadingSummary: parsed.birthReadingSummary ?? null,
      harmonizedSummaries: parsed.harmonizedSummaries ?? {},
    };
  } catch {
    return null;
  }
}

export function saveChatSession(userId: string, session: PersistedChatSession): void {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(session));
  } catch {
    // quota / private mode — falha silenciosa
  }
}

export function clearChatSession(userId: string): void {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
