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

/** Bump quando copy/fluxo do palpite mudar (invalida sessões antigas com leitura duplicada). */
export const CHAT_SESSION_STORAGE_VERSION = 7 as const;

const STORAGE_VERSION = CHAT_SESSION_STORAGE_VERSION;
export const CHAT_SESSION_CHANGED_EVENT = 'nm-chat-session-change';
function notifyChatSessionChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHAT_SESSION_CHANGED_EVENT));
}

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
  manualChatKey?: string;
  manualSessionId?: string;
  manualUsed?: number;
  analysisId?: string;
  chatPhase?: 'onboarding' | 'free_paywall' | 'subscriber';
  freePdfDownloaded?: boolean;
  freeAnalysisId?: string;
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
      clearChatSession(userId);
      return null;
    }
    if (parsed.version !== STORAGE_VERSION) {
      clearChatSession(userId);
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

export type ChatSessionSnapshotFields = Omit<PersistedChatSession, 'version' | 'savedAt'>;

export function buildPersistedChatSession(
  fields: ChatSessionSnapshotFields
): PersistedChatSession {
  return {
    version: STORAGE_VERSION,
    savedAt: Date.now(),
    ...fields,
  };
}

export function saveChatSession(userId: string, session: PersistedChatSession): void {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(session));
    notifyChatSessionChanged();
  } catch {
    // quota / private mode — falha silenciosa
  }
}

export function clearChatSession(userId: string): void {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(userId));
    notifyChatSessionChanged();
  } catch {
    // ignore
  }
}

/**
 * Indica se há uma entrevista de Nome Social iniciada e ainda não concluída
 * no localStorage para trocar dinamicamente "+ Nova Análise" por "Retomar Análise".
 */
export function hasUnfinishedChatSession(userId: string): boolean {
  const session = loadChatSession(userId);
  if (!session) return false;
  if (session.analysisId || session.currentStepId === 'conclusao') {
    return false;
  }
  return Boolean(
    session.birthConfirmed ||
      Object.keys(session.answers ?? {}).length > 0 ||
      (session.messages?.length ?? 0) > 1 ||
      (session.stepIndex ?? 0) > 0,
  );
}

/**
 * Sincroniza todos os links `[data-nm-header-cta="analise"]` da página atual
 * com o estado de entrevista em andamento no localStorage.
 */
export function syncAnaliseCtaLabels(
  root: ParentNode | null = typeof document !== 'undefined' ? document : null,
): boolean {
  if (!root || typeof localStorage === 'undefined') return false;
  const links = root.querySelectorAll<HTMLAnchorElement>('[data-nm-header-cta="analise"]');
  let anyUnfinished = false;
  links.forEach((link) => {
    const uid = link.dataset.userId ?? '';
    const unfinished = hasUnfinishedChatSession(uid);
    if (unfinished) anyUnfinished = true;
    const defaultLabel = link.dataset.defaultLabel || '+ Nova Análise';
    const resumeLabel = link.dataset.resumeLabel || 'Retomar Análise';
    const nextLabel = unfinished ? resumeLabel : defaultLabel;
    if (link.textContent?.trim() !== nextLabel) {
      link.textContent = nextLabel;
    }
  });
  return anyUnfinished;
}
