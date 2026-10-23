/**
 * Cache em memória por processo (Node.js SSR) com TTL e invalidação explícita.
 * Utilizado para reduzir seq_scans repetidos em tabelas pequenas e de leitura frequente
 * (faq_items, product_prices, subscriptions no AppLayout).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Executa `fn` e armazena o resultado em memória pelo tempo `ttlMs`.
 * Se chamado concorrentemente enquanto a busca está ativa, reutiliza a Promise em andamento.
 */
export async function memoize<T>(key: string, ttlMs: number, fn: () => Promise<T> | PromiseLike<T>): Promise<T> {
  const now = Date.now();
  const existing = store.get(key);

  if (existing && existing.expiresAt > now) {
    return existing.value as T;
  }

  const running = inFlight.get(key);
  if (running) {
    return running as Promise<T>;
  }

  const promise = (async () => {
    try {
      const result = await fn();
      store.set(key, { value: result, expiresAt: Date.now() + ttlMs });
      return result;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/** Invalida uma chave exata do cache */
export function invalidate(key: string): void {
  store.delete(key);
  inFlight.delete(key);
}

/** Invalida todas as chaves que começam com o prefixo informado */
export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
  for (const key of inFlight.keys()) {
    if (key.startsWith(prefix)) {
      inFlight.delete(key);
    }
  }
}

/** Limpa todo o cache (útil para testes unitários) */
export function clearCache(): void {
  store.clear();
  inFlight.clear();
}

/** Invalida o cache do catálogo de preços */
export function invalidateProductPricesCache(): void {
  invalidate('product_prices:rows');
}

/** Invalida todos os caches de FAQ */
export function invalidateFaqCache(): void {
  invalidatePrefix('faq:');
}

/** Invalida o cache de assinaturas ativas de um usuário */
export function invalidateUserSubscriptionsCache(userId: string): void {
  if (userId) {
    invalidate(`user_subs:${userId}`);
  }
}
