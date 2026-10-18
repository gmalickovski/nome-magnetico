import { readServerEnv } from './runtime';
import { safeCompareSecrets } from '../security/internalSecret';

export type InternalAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Compara o header X-Internal-Secret com INTERNAL_API_SECRET.
 * Sem variável configurada devolve 503, para não confundir com segredo errado (401).
 * A comparação usa crypto.timingSafeEqual sobre os hashes SHA-256 (tempo constante).
 */
export function authorizeInternalRequest(headerValue: string | null | undefined): InternalAuthResult {
  const secret = readServerEnv('INTERNAL_API_SECRET')?.trim();
  if (!secret) {
    return { ok: false, status: 503, error: 'internal secret not configured' };
  }

  const provided = (headerValue ?? '').trim();
  if (!secretsMatch(secret, provided)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  return { ok: true };
}

export function secretsMatch(expected: string, provided: string): boolean {
  return safeCompareSecrets(expected, provided);
}
