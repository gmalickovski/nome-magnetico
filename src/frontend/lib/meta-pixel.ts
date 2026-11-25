import { clickIdPattern, numericIdPattern, PAID_ADS_PREFERENCE, paidMedia, paidSources } from '../../shared/paid-attribution';
import { readLocalStorage } from '../../utils/browser-storage';

const LANDING = '/analise-gratuita';
const consentKey = 'nm-cookie-consent';
const sdkUrl = 'https://connect.facebook.net/en_US/fbevents.js';

const campaignParams = new Map<string, (value: string) => boolean>([
  ['fbclid', (value) => clickIdPattern.test(value)],
  ['utm_id', (value) => numericIdPattern.test(value)],
  ['ad_id', (value) => numericIdPattern.test(value)],
  ['utm_source', (value) => paidSources.some((source) => source === value)],
  ['utm_medium', (value) => paidMedia.some((medium) => medium === value)],
]);

export function mayLoadMetaPixel(location: URL, referrer: string): boolean {
  if (location.pathname.replace(/\/$/, '') !== LANDING || location.hash) return false;
  const seen = new Set<string>();
  for (const [key, value] of location.searchParams) {
    if (seen.has(key) || !campaignParams.get(key)?.(value)) return false;
    seen.add(key);
  }

  if (!referrer) return true;
  try {
    const previous = new URL(referrer);
    return !previous.search && !previous.hash && (
      previous.pathname === '/' || (
        previous.origin === location.origin && previous.pathname.replace(/\/$/, '') === LANDING
      )
    );
  } catch {
    return false;
  }
}

type PixelQueue = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: (...args: unknown[]) => void;
  loaded: boolean;
  version: string;
};

export function initializeMetaPixel(pixelId: string) {
  const browser = window as Window & { fbq?: PixelQueue; _fbq?: PixelQueue };
  if (!/^\d{10,24}$/.test(pixelId) || browser.fbq) return;

  let loading = false;
  let sdkReady = false;
  let pageViewSent = false;
  let granted = false;
  let pixel: PixelQueue;

  function canTrack() {
    return readLocalStorage(consentKey) === 'all' &&
      readLocalStorage(PAID_ADS_PREFERENCE) === 'granted' &&
      mayLoadMetaPixel(new URL(browser.location.href), document.referrer);
  }

  function updateConsent() {
    const allowed = canTrack();
    if (sdkReady) {
      if (granted !== allowed) {
        pixel('consent', allowed ? 'grant' : 'revoke');
        granted = allowed;
      }
      if (allowed && !pageViewSent) {
        pageViewSent = true;
        pixel('set', 'autoConfig', false, pixelId);
        pixel('init', pixelId);
        pixel('trackSingle', pixelId, 'PageView');
      }
      return;
    }
    if (!allowed || loading) return;

    loading = true;
    const queue: unknown[][] = [];
    function capture(...args: unknown[]) {
      if (pixel.callMethod) pixel.callMethod(...args);
      else queue.push(args);
    }
    pixel = Object.assign(capture, { queue, push: capture, loaded: true, version: '2.0' });
    browser.fbq = pixel;
    browser._fbq = pixel;
    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.referrerPolicy = 'origin';
    script.onload = () => {
      sdkReady = true;
      updateConsent();
    };
    script.onerror = () => {
      delete browser.fbq;
      delete browser._fbq;
      script.remove();
      loading = false;
    };
    document.head.appendChild(script);
  }

  browser.addEventListener('nm-cookie-preferences-changed', updateConsent);
  browser.addEventListener('storage', (event) => {
    if (event.key === null || event.key === consentKey || event.key === PAID_ADS_PREFERENCE) updateConsent();
  });
  updateConsent();
}
