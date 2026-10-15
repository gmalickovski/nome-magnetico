import { timingSafeEqual } from 'node:crypto';
import { readServerEnv } from './runtime';

export type InternalAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Compara o header X-Internal-Secret com INTERNAL_API_SECRET.
 * Sem variável configurada devolve 503, para não confundir com segredo errado (401).
 * A comparação usa crypto.timingSafeEqual. Tamanhos diferentes não vazam o segredo:
 * a chamada ainda roda, e o resultado é falso.
 */
export function authorizeInternalRequest(headerValue: string | null | undefined): InternalAuthResult {
  const secret = readServerEnv('INTERNAL_API_SECRET');
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
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}
