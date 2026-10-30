export const BACKOFF_DELAYS_SECONDS = [5, 10, 20, 40, 60] as const;
export const MAX_BACKOFF_DELAY_SECONDS = 60;
export const MAX_POLL_DURATION_SECONDS = 15 * 60; // 15 minutos = 900s

/**
 * Retorna o intervalo em segundos para a tentativa informada (0-indexada).
 * Sequência: 5, 10, 20, 40, 60, 60... s
 */
export function getBackoffDelay(attempt: number): number {
  if (attempt <= 0) return BACKOFF_DELAYS_SECONDS[0];
  if (attempt < BACKOFF_DELAYS_SECONDS.length) {
    return BACKOFF_DELAYS_SECONDS[attempt];
  }
  return MAX_BACKOFF_DELAY_SECONDS;
}

/**
 * Retorna true se o status da análise for terminal ('complete', 'done' ou 'error').
 */
export function isTerminalStatus(status: string | null | undefined): boolean {
  return status === 'complete' || status === 'done' || status === 'error';
}
