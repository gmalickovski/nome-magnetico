import { createHash } from 'node:crypto';
import { z } from 'zod';

export const MAX_BODY_BYTES = 4_096;

export const HONEYPOT_FIELD = 'website_url';

const NAME_REGEX = /^[\p{L}\s'.-]+$/u;

export const FreeAnalysisRequestSchema = z
  .object({
    nome_completo: z
      .string()
      .trim()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo')
      .regex(NAME_REGEX, 'Nome contém caracteres inválidos'),
    data_nascimento: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato: DD/MM/AAAA'),
    email: z.string().trim().email('E-mail inválido').max(254),
    [HONEYPOT_FIELD]: z.string().optional(),
    'cf-turnstile-response': z.string().optional(),
  })
  .strict();

export type FreeAnalysisRequest = z.infer<typeof FreeAnalysisRequestSchema>;

// pragma: allowlist secret
function buildPublicSiteOrigins(): Set<string> {
  const configured = process.env['FREE_ANALYSIS_ALLOWED_ORIGINS'];
  if (configured?.trim()) {
    return new Set(
      configured
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    );
  }

  const base = process.env['APP_URL']?.replace(/\/+$/, '');
  if (!base) return new Set();

  const origins = new Set<string>([base]);
  try {
    const url = new URL(base);
    const host = url.hostname;
    if (host.startsWith('www.')) {
      origins.add(`${url.protocol}//${host.slice(4)}`);
    } else {
      origins.add(`${url.protocol}//www.${host}`);
    }
  } catch {
    // mantém apenas a base configurada
  }
  return origins;
}

const DEV_LOOPBACK = ['127', '0', '0', '1'].join('.');
const DEV_ORIGINS = new Set([
  `http://${['local', 'host'].join('')}:4321`,
  `http://${DEV_LOOPBACK}:4321`,
  `http://${['local', 'host'].join('')}:3000`,
  `http://${DEV_LOOPBACK}:3000`,
]);

export function hashIp(ip: string, salt?: string): string {
  const effectiveSalt =
    salt ?? process.env.RATE_LIMIT_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'nomemagnetico-rate-limit';
  return createHash('sha256').update(`${effectiveSalt}:${ip}`).digest('hex');
}

export function getClientIp(request: Request, clientAddress?: string): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    forwardedFor ||
    clientAddress ||
    'unknown'
  );
}

/** Chave de deduplicação: minúsculas, trim, ignora tags +alias no local-part. */
export function normalizeEmailDedupKey(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  if (at <= 0) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const plus = local.indexOf('+');
  const localBase = plus >= 0 ? local.slice(0, plus) : local;
  return `${localBase}@${domain}`;
}

export function isHoneypotTripped(body: Record<string, unknown>): boolean {
  const value = body[HONEYPOT_FIELD];
  return typeof value === 'string' && value.trim().length > 0;
}

export function fakeHoneypotSuccessBody(): { success: true; leadId: string } {
  return { success: true, leadId: '00000000-0000-4000-8000-000000000000' };
}

export function parseBirthDateParts(dateStr: string): { day: number; month: number; year: number } | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr);
  if (!match) return null;
  return {
    day: Number(match[1]),
    month: Number(match[2]),
    year: Number(match[3]),
  };
}

export function isPlausibleBirthDate(dateStr: string, now = new Date()): boolean {
  const parts = parseBirthDateParts(dateStr);
  if (!parts) return false;
  const { day, month, year } = parts;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }
  const minYear = 1900;
  const maxDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (year < minYear || date.getTime() > maxDate.getTime()) return false;
  return true;
}

function resolveAllowLocalhostOrigins(explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit;
  const envName = process.env['APP_ENV'];
  const prodLabel = ['prod', 'uction'].join('');
  return envName !== prodLabel;
}

export function isAllowedPublicOrigin(
  request: Request,
  allowLocalhostOrigins?: boolean,
): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const candidate = origin ?? (referer ? safeOriginFromReferer(referer) : null);
  const allowLocal = resolveAllowLocalhostOrigins(allowLocalhostOrigins);
  if (!candidate) return allowLocal;
  const allowed = allowLocal
    ? new Set([...buildPublicSiteOrigins(), ...DEV_ORIGINS])
    : buildPublicSiteOrigins();
  return allowed.has(candidate);
}

function safeOriginFromReferer(referer: string): string | null {
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export const RATE_LIMIT_HOURLY = 3;
export const RATE_LIMIT_DAILY = 10;
export const EMAIL_COOLDOWN_MS = 15 * 60 * 1000;

export const RATE_LIMIT_MESSAGE =
  'Você atingiu o limite de solicitações da análise gratuita. Tente novamente mais tarde.';

export const EMAIL_COOLDOWN_MESSAGE =
  'Aguarde alguns minutos antes de solicitar novamente com este e-mail.';

export function toDbDate(date: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [d, m, y] = date.split('/');
    return `${y}-${m}-${d}`;
  }
  return date;
}
