export type RateLimitType = 'read' | 'action';

export type RateLimitConfig = {
  maxReadsPerMinute: number;
  maxActionsPerHour: number;
};

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxReadsPerMinute: 60,
  maxActionsPerHour: 10,
};

export class TokenRateLimiter {
  private readTimestamps = new Map<string, number[]>();
  private actionTimestamps = new Map<string, number[]>();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxReadsPerMinute: config.maxReadsPerMinute ?? DEFAULT_RATE_LIMITS.maxReadsPerMinute,
      maxActionsPerHour: config.maxActionsPerHour ?? DEFAULT_RATE_LIMITS.maxActionsPerHour,
    };
  }

  /**
   * Verifica se a requisição está dentro do limite e consome 1 token se permitida.
   * Retorna { allowed: true } ou { allowed: false, retryAfterSeconds: number }.
   */
  check(
    tokenHash: string,
    type: RateLimitType,
    now = Date.now(),
  ): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
    if (type === 'read') {
      const windowMs = 60 * 1000;
      const limit = this.config.maxReadsPerMinute;
      return this.checkWindow(this.readTimestamps, tokenHash, windowMs, limit, now);
    } else {
      const windowMs = 60 * 60 * 1000;
      const limit = this.config.maxActionsPerHour;
      return this.checkWindow(this.actionTimestamps, tokenHash, windowMs, limit, now);
    }
  }

  private checkWindow(
    store: Map<string, number[]>,
    key: string,
    windowMs: number,
    limit: number,
    now: number,
  ): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
    let timestamps = store.get(key);
    if (!timestamps) {
      timestamps = [];
      store.set(key, timestamps);
    }

    const cutoff = now - windowMs;
    // Remove registros antigos
    const active = timestamps.filter((t) => t > cutoff);
    store.set(key, active);

    if (active.length >= limit) {
      const oldestActive = active[0] ?? now;
      const retryAfterMs = oldestActive + windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    active.push(now);
    return { allowed: true };
  }

  /**
   * Limpeza de memória de tokens inativos há mais de 1 hora.
   */
  cleanup(now = Date.now()): void {
    const readCutoff = now - 60 * 1000;
    for (const [key, list] of this.readTimestamps.entries()) {
      const filtered = list.filter((t) => t > readCutoff);
      if (filtered.length === 0) {
        this.readTimestamps.delete(key);
      } else {
        this.readTimestamps.set(key, filtered);
      }
    }

    const actionCutoff = now - 60 * 60 * 1000;
    for (const [key, list] of this.actionTimestamps.entries()) {
      const filtered = list.filter((t) => t > actionCutoff);
      if (filtered.length === 0) {
        this.actionTimestamps.delete(key);
      } else {
        this.actionTimestamps.set(key, filtered);
      }
    }
  }
}
