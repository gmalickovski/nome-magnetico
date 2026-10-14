/**
 * First-touch de UTM: a primeira combinação vista na URL fica no localStorage
 * e não é substituída por visitas seguintes.
 */

export const UTM_FIRST_TOUCH_KEY = 'nm-utm-first-touch';

export interface FirstTouchUtm {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

const EMPTY_UTM: FirstTouchUtm = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
};

function sanitizeUtm(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 200);
  return trimmed || null;
}

function hasAnyUtm(utm: FirstTouchUtm): boolean {
  return Boolean(utm.utm_source || utm.utm_medium || utm.utm_campaign);
}

export function parseUtmSearch(search: string): FirstTouchUtm {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return {
    utm_source: sanitizeUtm(params.get('utm_source')),
    utm_medium: sanitizeUtm(params.get('utm_medium')),
    utm_campaign: sanitizeUtm(params.get('utm_campaign')),
  };
}

function readStored(): FirstTouchUtm | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(UTM_FIRST_TOUCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    const utm: FirstTouchUtm = {
      utm_source: sanitizeUtm(record.utm_source),
      utm_medium: sanitizeUtm(record.utm_medium),
      utm_campaign: sanitizeUtm(record.utm_campaign),
    };
    return hasAnyUtm(utm) ? utm : null;
  } catch {
    return null;
  }
}

function writeStored(utm: FirstTouchUtm): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(UTM_FIRST_TOUCH_KEY, JSON.stringify(utm));
  } catch {
    // Storage indisponível não pode impedir o envio do formulário.
  }
}

/** Grava a primeira passagem com UTM. Se já houver first-touch, devolve o valor salvo. */
export function captureFirstTouchUtm(search?: string): FirstTouchUtm {
  if (typeof window === 'undefined') return { ...EMPTY_UTM };
  const existing = readStored();
  if (existing) return existing;

  const fromUrl = parseUtmSearch(search ?? window.location.search);
  if (!hasAnyUtm(fromUrl)) return { ...EMPTY_UTM };
  writeStored(fromUrl);
  return fromUrl;
}

export function readFirstTouchUtm(): FirstTouchUtm {
  return captureFirstTouchUtm();
}

/** Campos de marketing para o body de `/api/analyze`. UTMs só entram quando existem. */
export function marketingBodyFields(optIn: boolean): {
  opt_in: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
} {
  const utm = readFirstTouchUtm();
  return {
    opt_in: optIn,
    ...(utm.utm_source ? { utm_source: utm.utm_source } : {}),
    ...(utm.utm_medium ? { utm_medium: utm.utm_medium } : {}),
    ...(utm.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
  };
}
