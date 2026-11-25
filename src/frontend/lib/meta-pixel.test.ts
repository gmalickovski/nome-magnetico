import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initializeMetaPixel, mayLoadMetaPixel } from './meta-pixel';

const pixelId = '123456789012345';
const landing = 'https://www.nomemagnetico.com.br/analise-gratuita';

test('Pixel fica restrito à landing e a URLs que podem ser compartilhadas', () => {
  assert.equal(mayLoadMetaPixel(new URL(landing), ''), true);
  assert.equal(mayLoadMetaPixel(new URL(landing + '/?utm_source=meta&utm_medium=paid_social&utm_id=201&fbclid=fixture-clid'), 'https://l.facebook.com/'), true);
  for (const url of [
    landing + '?email=a%40b.com',
    landing + '?utm_campaign=a%40b.com',
    landing + '?utm_id=100&utm_id=101',
    landing + '#token',
    'https://www.nomemagnetico.com.br/app/resultado/123',
  ]) {
    assert.equal(mayLoadMetaPixel(new URL(url), ''), false, url);
  }
  assert.equal(mayLoadMetaPixel(new URL(landing), 'https://www.nomemagnetico.com.br/?email=a%40b.com'), false);
});

function fixture() {
  const settings = new Map([['nm-cookie-consent', 'all']]);
  const browser = Object.assign(new EventTarget(), {
    location: new URL(landing),
    localStorage: { getItem: (key: string) => settings.get(key) ?? null },
    fbq: undefined as (undefined | { queue: unknown[][] }),
  });
  const scripts: HTMLScriptElement[] = [];
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const doc = {
    referrer: '',
    createElement: () => ({}),
    head: { appendChild: (script: HTMLScriptElement) => scripts.push(script) },
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: doc });
  const restore = () => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else Reflect.deleteProperty(globalThis, 'document');
  };
  return {
    browser, scripts, restore,
    ads(value: 'granted' | 'denied', event = 'nm-cookie-preferences-changed') {
      settings.set('nm-ad-measurement', value);
      browser.dispatchEvent(Object.assign(new Event(event), { key: 'nm-ad-measurement' }));
    },
  };
}

test('apenas o aceite de anúncios carrega o SDK e dispara um PageView', (t) => {
  const f = fixture();
  t.after(f.restore);
  initializeMetaPixel(pixelId);
  assert.equal(f.scripts.length, 0);
  f.ads('granted');
  f.ads('granted');
  assert.equal(f.scripts.length, 1);
  assert.equal(f.scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
  f.scripts[0].onload?.(new Event('load'));
  assert.deepEqual(f.browser.fbq?.queue, [
    ['consent', 'grant'],
    ['set', 'autoConfig', false, pixelId],
    ['init', pixelId],
    ['trackSingle', pixelId, 'PageView'],
  ]);
  f.ads('denied', 'storage');
  f.ads('granted');
  assert.deepEqual(f.browser.fbq?.queue.slice(-2), [['consent', 'revoke'], ['consent', 'grant']]);
  assert.equal(f.browser.fbq?.queue.filter((args) => args.includes('PageView')).length, 1);
});

test('revogar o consentimento enquanto o SDK carrega impede a inicialização e o PageView', (t) => {
  const f = fixture();
  t.after(f.restore);
  initializeMetaPixel(pixelId);
  f.ads('granted');
  f.ads('denied');
  f.scripts[0].onload?.(new Event('load'));
  assert.deepEqual(f.browser.fbq?.queue, []);
});
