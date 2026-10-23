import { createHmac } from 'node:crypto';
import { readServerEnv } from '../env/runtime';
import { safeCompareSecrets } from './internalSecret';

export type HmacVerifyResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

export const DEFAULT_HMAC_MAX_DRIFT_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Assina um payload com HMAC-SHA256 usando o padrão timestamp.rawBody.
 */
export function signInternalPayload({
  rawBody,
  timestamp,
  secret,
}: {
  rawBody: string;
  timestamp: number;
  secret: string;
}): string {
  const message = `${timestamp}.${rawBody}`;
  return createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Valida a assinatura HMAC de uma requisição interna.
 * Headers esperados:
 *   - X-Internal-Signature: <hex>
 *   - X-Internal-Timestamp: <unix_epoch_ms>
 *
 * Utiliza INTERNAL_HMAC_SECRET (ou INTERNAL_API_SECRET como fallback seguro).
 */
export function verifyInternalHmacRequest({
  rawBody,
  signatureHeader,
  timestampHeader,
  secretOverride,
  maxDriftMs = DEFAULT_HMAC_MAX_DRIFT_MS,
  now = Date.now(),
}: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  timestampHeader: string | null | undefined;
  secretOverride?: string;
  maxDriftMs?: number;
  now?: number;
}): HmacVerifyResult {
  const secret = (
    secretOverride ??
    readServerEnv('INTERNAL_HMAC_SECRET') ??
    readServerEnv('INTERNAL_API_SECRET')
  )?.trim();

  if (!secret) {
    return { ok: false, status: 503, error: 'internal hmac secret not configured' };
  }

  const signature = signatureHeader?.trim();
  if (!signature) {
    return { ok: false, status: 401, error: 'missing internal signature header' };
  }

  const rawTimestamp = timestampHeader?.trim();
  if (!rawTimestamp) {
    return { ok: false, status: 401, error: 'missing internal timestamp header' };
  }

  const timestamp = Number(rawTimestamp);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return { ok: false, status: 401, error: 'invalid internal timestamp header' };
  }

  const drift = Math.abs(now - timestamp);
  if (drift > maxDriftMs) {
    return { ok: false, status: 401, error: 'internal request expired or clock skew' };
  }

  const expectedSignature = signInternalPayload({ rawBody, timestamp, secret });

  if (!safeCompareSecrets(expectedSignature, signature)) {
    return { ok: false, status: 401, error: 'invalid internal signature' };
  }

  return { ok: true };
}
