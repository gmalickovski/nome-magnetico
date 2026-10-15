/**
 * Filtros puros do Sentry, sem SDK.
 * Localhost não é produção: o evento é descartado antes do scrub.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

/** Robô que abre o link de verificação de e-mail e procura um id no DOM. */
export const EMAIL_LINK_CHECKER_ERROR = /Object Not Found Matching Id/;

export interface SentryEventLike {
  request?: {
    url?: string;
  };
}

function normalizeHostname(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';
  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    return end > 1 ? trimmed.slice(1, end) : trimmed;
  }
  return trimmed;
}

function isLocalHostname(hostname: string | undefined): boolean {
  if (!hostname) return false;
  return LOCAL_HOSTS.has(normalizeHostname(hostname));
}

function hostnameFromUrl(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

/**
 * True quando o browser está em host local ou quando `event.request.url`
 * aponta para localhost / 127.0.0.1 / ::1 / 0.0.0.0.
 * `hostname` é o `window.location.hostname` no cliente; no servidor fica vazio.
 */
export function isLocalDevEvent(event: SentryEventLike, hostname?: string): boolean {
  if (isLocalHostname(hostname)) return true;
  const requestUrl = event.request?.url;
  if (typeof requestUrl !== 'string' || requestUrl.length === 0) return false;
  return isLocalHostname(hostnameFromUrl(requestUrl));
}
