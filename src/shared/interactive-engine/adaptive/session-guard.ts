/**
 * Limites por sessão para entrevista adaptativa (in-memory, sem DB).
 * Inspirado em LoopGuard; adequado ao endpoint público de preview.
 */

import {
  ADAPTIVE_DECISION_TIMEOUT_MS,
  ADAPTIVE_MAX_COST_UNITS,
  ADAPTIVE_MAX_QUESTIONS,
  ADAPTIVE_MAX_SESSION_MS,
} from './config';

export interface SessionGuardState {
  questionCount: number;
  costUnits: number;
  startedAtMs: number;
  lastDecisionMs?: number;
}

export interface SessionGuardCheck {
  ok: boolean;
  reason?: 'max_questions' | 'max_cost' | 'session_timeout' | 'decision_timeout';
  message?: string;
}

export function createSessionGuardState(startedAtMs: number = Date.now()): SessionGuardState {
  return { questionCount: 0, costUnits: 0, startedAtMs };
}

export function checkSessionGuard(
  state: SessionGuardState,
  nowMs: number = Date.now()
): SessionGuardCheck {
  if (nowMs - state.startedAtMs > ADAPTIVE_MAX_SESSION_MS) {
    return {
      ok: false,
      reason: 'session_timeout',
      message: 'Tempo máximo da entrevista atingido.',
    };
  }
  if (state.questionCount >= ADAPTIVE_MAX_QUESTIONS) {
    return {
      ok: false,
      reason: 'max_questions',
      message: 'Limite de perguntas da entrevista atingido.',
    };
  }
  if (state.costUnits >= ADAPTIVE_MAX_COST_UNITS) {
    return {
      ok: false,
      reason: 'max_cost',
      message: 'Limite de custo simulado da sessão atingido.',
    };
  }
  if (
    state.lastDecisionMs !== undefined &&
    nowMs - state.lastDecisionMs > ADAPTIVE_DECISION_TIMEOUT_MS * 4
  ) {
    return {
      ok: false,
      reason: 'decision_timeout',
      message: 'Decisão excedeu o tempo esperado.',
    };
  }
  return { ok: true };
}

export function recordQuestion(state: SessionGuardState, costUnits = 2): SessionGuardState {
  return {
    ...state,
    questionCount: state.questionCount + 1,
    costUnits: state.costUnits + costUnits,
    lastDecisionMs: Date.now(),
  };
}
