export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

type Bucket = {
  tokens: number;
  lastRefill: number;
};

export class ClientRateLimiter {
  private buckets = new Map<string, Bucket>();
  private maxTokens: number;
  private refillIntervalMs: number;

  constructor(maxTokens: number = 60, refillIntervalMs: number = 60000) {
    this.maxTokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens - 1, lastRefill: now };
      this.buckets.set(key, bucket);
      return { allowed: true };
    }

    const elapsed = now - bucket.lastRefill;
    if (elapsed >= this.refillIntervalMs) {
      bucket.tokens = this.maxTokens - 1;
      bucket.lastRefill = now;
      return { allowed: true };
    }

    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return { allowed: true };
    }

    const retryAfter = Math.ceil((this.refillIntervalMs - elapsed) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  reset(): void {
    this.buckets.clear();
  }
}
