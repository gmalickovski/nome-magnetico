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
 * `ttlMs` pode ser um número fixo (em ms) ou uma função `(result: T) => number`,
 * permitindo definir TTL por resultado (ex.: 5 min para sucesso, 30 s para falha/fallback).
 * Se chamado concorrentemente enquanto a busca está ativa, reutiliza a Promise em andamento.
 */
export async function memoize<T>(
  key: string,
  ttlMs: number | ((result: T) => number),
  fn: () => Promise<T> | PromiseLike<T>,
): Promise<T> {
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
      const resolvedTtl = typeof ttlMs === 'function' ? ttlMs(result) : ttlMs;
      store.set(key, { value: result, expiresAt: Date.now() + resolvedTtl });
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

/** Retorna a entrada do cache (útil para testes de TTL e expiração) */
export function getCacheEntry(key: string): { value: unknown; expiresAt: number } | undefined {
  return store.get(key);
}

/** Invalida o cache do catálogo de preços */
export function invalidateProductPricesCache(): void {
  invalidate('product_prices:rows');
}

/** Invalida todos os caches de FAQ */
export function invalidateFaqCache(): void {
  invalidatePrefix('faq:');
}

/** Invalida o cache de promoções ativas */
export function invalidatePromotionsCache(): void {
  invalidatePrefix('promotions:');
}

/** Invalida o cache de assinaturas ativas de um usuário */
export function invalidateUserSubscriptionsCache(userId: string): void {
  if (userId) {
    invalidatePrefix(`user_subs:${userId}`);
  }
}
