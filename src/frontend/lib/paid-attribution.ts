import { readLocalStorage, writeLocalStorage } from '../../utils/browser-storage';
import { gaClientIdPattern, PAID_ADS_PREFERENCE, paidTouchFromSearch } from '../../shared/paid-attribution';

const ENDPOINT = '/api/analytics/paid-preferences';
let measurementId = '';
let observation: Promise<void> | undefined;

async function save(body: object): Promise<Response> {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
    signal: AbortSignal.timeout(4000),
  });
}

export async function saveCookiePreferences(analytics: boolean, ads: boolean): Promise<void> {
  const touch = analytics && ads ? paidTouchFromSearch(window.location.search) : undefined;
  const response = await save({ type: 'preferences', analytics, ads, touch });
  if (!response.ok) throw new Error('Preferência indisponível');
  writeLocalStorage('nm-cookie-consent', analytics ? 'all' : 'essential');
  writeLocalStorage(PAID_ADS_PREFERENCE, analytics && ads ? 'granted' : 'denied');
  if (analytics) window.dispatchEvent(new Event('consentGranted'));
  window.dispatchEvent(new Event('nm-cookie-preferences-changed'));
}

function readGaField(field: 'client_id' | 'session_id'): Promise<unknown> {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (!measurementId || !gtag) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(undefined), 300);
    gtag('get', measurementId, field, (value: unknown) => {
      window.clearTimeout(timer);
      resolve(value);
    });
  });
}

async function observe() {
  if (readLocalStorage('nm-cookie-consent') !== 'all') return;
  const ads = readLocalStorage(PAID_ADS_PREFERENCE) === 'granted';
  const touch = ads ? paidTouchFromSearch(window.location.search) : undefined;
  // Guardar o clique assim que a página carrega, antes de esperar o SDK do GA.
  const response = await save({ type: 'observe', touch });
  if (response.status === 428 && readLocalStorage('nm-cookie-consent') === 'all') {
    await save({
      type: 'preferences',
      analytics: true,
      ads: readLocalStorage(PAID_ADS_PREFERENCE) === 'granted',
      touch,
    });
  }

  const [clientId, sessionId] = await Promise.all([readGaField('client_id'), readGaField('session_id')]);
  if (readLocalStorage('nm-cookie-consent') !== 'all') return;
  if (typeof clientId !== 'string' || !gaClientIdPattern.test(clientId)) return;
  const numericSessionId = Number(sessionId);
  await save({ type: 'observe', ga: {
    client_id: clientId,
    session_id: Number.isInteger(numericSessionId) && numericSessionId > 0 && numericSessionId <= 9_999_999_999
      ? numericSessionId : undefined,
  } });
}

export function observePaidAttribution(): Promise<void> {
  observation ??= observe().catch(() => {}).finally(() => { observation = undefined; });
  return observation;
}

export function initializePaidAttribution(id: string, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  measurementId = id;
  window.addEventListener('nm-cookie-preferences-changed', () => void observePaidAttribution());
  void observePaidAttribution();
}
