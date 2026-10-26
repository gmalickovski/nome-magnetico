/**
 * Filtros puros do Sentry, sem SDK.
 * Localhost não é produção: o evento é descartado antes do scrub.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

/** Robô que abre o link de verificação de e-mail e procura um id no DOM. */
export const EMAIL_LINK_CHECKER_ERROR = /Object Not Found Matching Id/;

/** Erro de terceiros do Google Ads em rum_fy2021.js (NOME-MAGNETICO-A) */
export const PAGEAD_INT64_ERROR = /^int64$/;

/** WebViews / browsers com storage bloqueado (issue Sentry storage, DEV-230) */
export const STORAGE_ACCESS_DENIED_ERROR =
  /Failed to read the '(localStorage|sessionStorage)' property from 'Window'/i;

/** Rejeição de Promise sem valor em unload/visibilitychange (DEV-233) */
export const NON_ERROR_UNDEFINED_REJECTION =
  /Non-Error promise rejection captured with value: undefined/i;

/** Falha transitória de chunk após deploy, antes do auto-reload (DEV-233) */
export const CHUNK_DYNAMIC_IMPORT_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

/** Domínios e paths de scripts de anúncios externos (Google Ads / AdSense) */
export const PAGEAD_DENY_URLS = [
  /\/pagead\//,
  /googlesyndication\.com/,
  /googletagservices\.com/,
  /adtrafficquality\.google/,
];

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
