/**
 * DEV-274 — feature flag e modo mock-only (sem chamadas pagas).
 */

function readEnv(name: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  const val = (fromProcess ?? '').trim();
  return val.length > 0 ? val : undefined;
}

function isTruthy(name: string): boolean {
  const v = readEnv(name);
  if (!v) return false;
  return v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'yes';
}

/** Entrevista adaptativa JEV+LLM (desligada por padrão). */
export function isAdaptiveInterviewEnabled(): boolean {
  return isTruthy('NM_CHAT_ADAPTIVE_JEV');
}

/**
 * Quando true, `runJevDecision` não chama TypeSafe/Groq/OpenAI (só determinístico).
 * Padrão recomendado em teste e Parte 1 autorizada.
 */
export function isJevMockOnlyMode(): boolean {
  if (isTruthy('NM_JEV_MOCK_ONLY')) return true;
  if (isTruthy('NM_JEV_MOCK_ONLY_DEFAULT_OFF')) return false;
  // Parte 1: com adaptativo ligado, assume mock até autorização de chamadas reais
  return isAdaptiveInterviewEnabled();
}

export const ADAPTIVE_MAX_QUESTIONS = 12;
export const ADAPTIVE_MAX_SESSION_MS = 15 * 60 * 1000;
/** Unidades de “custo” simulado por decisão JEV mock (observabilidade). */
export const ADAPTIVE_MAX_COST_UNITS = 24;
export const ADAPTIVE_DECISION_TIMEOUT_MS = 1500;
