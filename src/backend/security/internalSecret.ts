import { createHash, timingSafeEqual } from 'node:crypto';
import { readServerEnv } from '../env/runtime';

/**
 * Compara dois segredos em tempo constante usando SHA-256 e timingSafeEqual.
 * O hash SHA-256 normaliza ambos para buffers de 32 bytes, eliminando
 * qualquer vazamento de tempo decorrente de tamanhos diferentes.
 */
export function safeCompareSecrets(expected: string, provided: string): boolean {
  if (!expected || !provided) return false;
  const hashExpected = createHash('sha256').update(expected).digest();
  const hashProvided = createHash('sha256').update(provided).digest();
  return timingSafeEqual(hashExpected, hashProvided);
}

/**
 * Valida se o valor fornecido corresponde a INTERNAL_API_SECRET em tempo constante.
 * Falha fechada (retorna false) se INTERNAL_API_SECRET não estiver configurado ou se o valor for vazio.
 */
export function isValidInternalSecret(value: string | null | undefined): boolean {
  const secret = readServerEnv('INTERNAL_API_SECRET')?.trim();
  if (!secret) return false;

  const provided = (value ?? '').trim();
  if (!provided) return false;

  return safeCompareSecrets(secret, provided);
}

/**
 * Valida o header de autorização exigindo estritamente o formato "Bearer <INTERNAL_API_SECRET>".
 */
export function isValidInternalBearerToken(authHeader: string | null | undefined): boolean {
  if (!authHeader) return false;
  const trimmed = authHeader.trim();
  if (!trimmed.startsWith('Bearer ')) return false;

  const token = trimmed.slice(7).trim();
  return isValidInternalSecret(token);
}
