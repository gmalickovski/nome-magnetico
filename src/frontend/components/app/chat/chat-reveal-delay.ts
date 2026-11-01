/** Atraso máximo do indicador de “digitação” antes de revelar a próxima mensagem do assistente. */
export const CHAT_TYPING_DELAY_MS = 600;

export function prefersReducedMotionChat(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Tempo restante a aguardar após a API responder, para simular digitação (≤600 ms).
 */
export function computeChatRevealDelayMs(
  submittedAtMs: number,
  nowMs: number = Date.now(),
  reducedMotion: boolean = prefersReducedMotionChat()
): number {
  if (reducedMotion) return 0;
  const elapsed = nowMs - submittedAtMs;
  return Math.max(0, CHAT_TYPING_DELAY_MS - elapsed);
}

export function sleepMs(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
