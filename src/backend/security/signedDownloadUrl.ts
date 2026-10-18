import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { readServerEnv } from '../env/runtime';

export const DOWNLOAD_PDF_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dias
export const DOWNLOAD_PDF_LEGACY_CUTOFF_MS = new Date('2026-10-19T00:00:00Z').getTime();

export function getDownloadPdfSecret(): string {
  const secret =
    readServerEnv('DOWNLOAD_PDF_SECRET') ||
    readServerEnv('SUPABASE_SERVICE_ROLE_KEY') ||
    'nome-magnetico-download-pdf-fallback-key';
  return secret.trim();
}

/**
 * Calcula a assinatura HMAC-SHA256 para o par leadId e timestamp de expiração (exp).
 */
export function computeDownloadPdfSignature(
  leadId: string,
  exp: number | string,
  secret: string = getDownloadPdfSecret()
): string {
  const payload = `${leadId.trim()}:${String(exp).trim()}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Monta a URL/caminho assinado para download de PDF com validade de 7 dias por padrão.
 */
export function signDownloadPdfPath(
  leadId: string,
  options?: { nowMs?: number; ttlSeconds?: number; secret?: string }
): string {
  const nowMs = options?.nowMs ?? Date.now();
  const ttlSeconds = options?.ttlSeconds ?? DOWNLOAD_PDF_TTL_SECONDS;
  const exp = Math.floor(nowMs / 1000) + ttlSeconds;
  const sig = computeDownloadPdfSignature(leadId, exp, options?.secret);
  return `/api/download-pdf?id=${encodeURIComponent(leadId)}&exp=${exp}&sig=${sig}`;
}

export type VerifyDownloadSignatureResult =
  | { ok: true; isLegacyTransition: boolean }
  | { ok: false; status: 400 | 403 | 410; reason: string };

/**
 * Valida a assinatura e expiração do link de download em tempo constante antes de qualquer consulta ao banco.
 */
export function verifyDownloadPdfRequest(params: {
  id: string | null | undefined;
  exp: string | null | undefined;
  sig: string | null | undefined;
  leadCreatedAt?: string | Date | null;
  nowMs?: number;
  secret?: string;
  legacyCutoffMs?: number;
}): VerifyDownloadSignatureResult {
  const id = params.id?.trim();
  if (!id) {
    return { ok: false, status: 400, reason: 'ID da análise é obrigatório' };
  }

  const expStr = params.exp?.trim();
  const sig = params.sig?.trim();

  // Caso os parâmetros de assinatura estejam ausentes
  if (!expStr || !sig) {
    const legacyCutoff = params.legacyCutoffMs ?? DOWNLOAD_PDF_LEGACY_CUTOFF_MS;
    const now = params.nowMs ?? Date.now();

    // Se temos a data de criação do lead (período de transição de 7 dias)
    if (params.leadCreatedAt) {
      const createdTime = new Date(params.leadCreatedAt).getTime();
      const maxLegacyExpiry = createdTime + DOWNLOAD_PDF_TTL_SECONDS * 1000;
      if (createdTime < legacyCutoff && now <= maxLegacyExpiry) {
        return { ok: true, isLegacyTransition: true };
      }
    }

    return {
      ok: false,
      status: 403,
      reason: 'Link de download não assinado ou inválido.',
    };
  }

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= 0) {
    return { ok: false, status: 400, reason: 'Parâmetro de expiração inválido.' };
  }

  const nowSeconds = Math.floor((params.nowMs ?? Date.now()) / 1000);
  if (nowSeconds > exp) {
    return {
      ok: false,
      status: 410,
      reason: 'Este link de download expirou (validade máxima de 7 dias). Solicite um novo envio ou refaça sua análise.',
    };
  }

  const expectedSig = computeDownloadPdfSignature(id, exp, params.secret);
  const hashProvided = createHash('sha256').update(sig).digest();
  const hashExpected = createHash('sha256').update(expectedSig).digest();

  if (!timingSafeEqual(hashProvided, hashExpected)) {
    return {
      ok: false,
      status: 403,
      reason: 'Assinatura do link de download inválida.',
    };
  }

  return { ok: true, isLegacyTransition: false };
}
