import type { ErrorEvent } from '@sentry/astro';

const FILTERED = '[Filtered]';
const MAX_STRING = 2000;

const SENSITIVE_KEY =
  /(email|e-mail|password|passwd|senha|token|authorization|cookie|secret|api[-_]?key|service[-_]?role|private[-_]?key|stripe|webhook|dsn|pdf|analys|an[aá]lise|conte[uú]do|content|texto|mensagem|relat[oó]rio|prompt|completion|(^|_|-)body($|_)|(^|_|-)vars($|_))/i;

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SECRET_LITERAL =
  /\b(?:(?:sk_live|sk_test|rk_live|rk_test|whsec|gsk)_[A-Za-z0-9_\-]+|sk-ant-[A-Za-z0-9_\-]+)/g;
const BEARER = /bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

export function scrubString(value: string): string {
  if (value.length > 4000) return FILTERED;
  const redacted = value
    .replace(EMAIL, FILTERED)
    .replace(SECRET_LITERAL, FILTERED)
    .replace(BEARER, FILTERED);
  if (redacted.length <= MAX_STRING) return redacted;
  return `${redacted.slice(0, MAX_STRING)}…[truncated]`;
}

function stripUrl(url: string): string {
  const withoutHash = url.split('#')[0] ?? url;
  return withoutHash.split('?')[0] ?? withoutHash;
}

function scrubUnknown(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth > 6) return FILTERED;
  if (typeof value === 'string') return scrubString(value);
  if (typeof value !== 'object' || value === null) return value;
  if (seen.has(value)) return FILTERED;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => scrubUnknown(item, depth + 1, seen));
  }

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    output[key] = isSensitiveKey(key) ? FILTERED : scrubUnknown(child, depth + 1, seen);
  }
  return output;
}

function scrubRecord<T extends Record<string, unknown>>(record: T): T {
  return scrubUnknown(record, 0, new WeakSet()) as T;
}

/**
 * Remove e-mail, tokens, cookies, chaves e corpo de análise/PDF antes do envio.
 * Falha de scrubbing não pode derrubar o reporte: nesse caso o request é esvaziado.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  try {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
      delete event.user.geo;
    }

    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
      delete event.request.data;
      delete event.request.env;
      delete event.request.query_string;
      if (typeof event.request.url === 'string') {
        event.request.url = stripUrl(event.request.url);
      }
    }

    const metadata = event.sdkProcessingMetadata as { request?: unknown; normalizedRequest?: unknown } | undefined;
    if (metadata) {
      delete metadata.request;
      delete metadata.normalizedRequest;
    }

    if (typeof event.message === 'string') event.message = scrubString(event.message);
    if (event.logentry && typeof event.logentry.message === 'string') {
      event.logentry.message = scrubString(event.logentry.message);
    }

    if (event.extra) event.extra = scrubRecord(event.extra);
    if (event.contexts) event.contexts = scrubRecord(event.contexts as Record<string, unknown>) as typeof event.contexts;
    if (event.tags) {
      for (const [key, value] of Object.entries(event.tags)) {
        if (isSensitiveKey(key)) {
          event.tags[key] = FILTERED;
        } else if (typeof value === 'string') {
          event.tags[key] = scrubString(value);
        }
      }
    }

    if (event.breadcrumbs) {
      for (const crumb of event.breadcrumbs) {
        if (typeof crumb.message === 'string') crumb.message = scrubString(crumb.message);
        if (crumb.data && typeof crumb.data === 'object') {
          crumb.data = scrubRecord(crumb.data as Record<string, unknown>);
          if (typeof crumb.data.url === 'string') crumb.data.url = stripUrl(crumb.data.url);
        }
      }
    }

    for (const exception of event.exception?.values ?? []) {
      if (typeof exception.value === 'string') exception.value = scrubString(exception.value);
      for (const frame of exception.stacktrace?.frames ?? []) {
        if (frame.vars) frame.vars = undefined;
        if (typeof frame.context_line === 'string' && frame.context_line.length > MAX_STRING) {
          frame.context_line = FILTERED;
        }
      }
    }
  } catch {
    if (event.request) {
      event.request = {
        method: event.request.method,
        url: typeof event.request.url === 'string' ? stripUrl(event.request.url) : undefined,
      };
    }
    delete event.extra;
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }
  }

  return event;
}
