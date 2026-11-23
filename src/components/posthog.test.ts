import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it, mock } from 'node:test';
import { runInNewContext } from 'node:vm';

const snippet = readFileSync(new URL('./posthog.astro', import.meta.url), 'utf8')
  .match(/<script is:inline define:vars=.*?>\r?\n([\s\S]*?)<\/script>/)?.[1];
assert.ok(snippet);

function storage(seed?: Record<string, string>) {
  const entries = new Map(Object.entries(seed ?? {}));
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  };
}

type Event = { properties: Record<string, unknown> };
type Config = { before_send: (event: Event) => Event | null; loaded: (sdk: unknown) => void };

function page(localStorage = storage(), sessionStorage = storage()) {
  const listeners = new Map<string, () => void>();
  const configs: Config[] = [];
  const identities: unknown[][] = [];
  const posthog = {
    __SV: 1,
    init: (_key: string, config: Config) => configs.push(config),
  };
  const window = {
    location: new URL('https://www.nomemagnetico.com.br/auth/login?utm_source=campaign'),
    posthog,
    addEventListener: (name: string, handler: () => void) => listeners.set(name, handler),
    dispatchEvent() {},
  };
  runInNewContext(snippet!, { window, posthog, document: {}, URL, URLSearchParams, Event, localStorage, sessionStorage,
    posthogKey: 'fixture', posthogHost: 'https://example.test' });
  const identify = (window as unknown as { nmIdentifyPostHog: (id: string) => void }).nmIdentifyPostHog;
  const sdk = {
    get_distinct_id: () => 'anon-fixture',
    identify: (...args: unknown[]) => identities.push(args),
    startSessionRecording() {},
  };
  return { configs, identities, identify, sdk, consentGranted: () => listeners.get('consentGranted')?.() };
}

it('sem aceite não inicializa, grava UTM ou guarda o id entre páginas', () => {
  const local = storage({ 'nm-cookie-consent': 'essential' });
  const session = storage();
  const browser = page(local, session);
  browser.identify('fixture');
  assert.equal(browser.configs.length, 0);
  assert.equal(local.getItem('nm-utm-first-touch'), null);
  assert.equal(session.getItem('nm-posthog-pending-identify'), null);
  local.setItem('nm-cookie-consent', 'all');
  browser.consentGranted();
  browser.consentGranted();
  assert.equal(browser.configs.length, 1);
  browser.configs[0].loaded(browser.sdk);
  assert.equal(browser.identities[0][0], 'fixture');
});

it('reaplica a identidade no destino, sem e-mail e com as duas versões de UTM', () => {
  const local = storage({ 'nm-cookie-consent': 'all' });
  const session = storage();
  page(local, session).identify('fixture');
  const next = page(local, session);
  next.configs[0].loaded(next.sdk);
  assert.equal(next.identities[0][0], 'fixture');
  assert.equal(next.identities[0][1], undefined);
  const utm = next.identities[0][2] as Record<string, string>;
  assert.equal(utm.initial_utm_source, 'campaign');
  assert.equal(utm.$initial_utm_source, 'campaign');
  assert.equal(session.getItem('nm-posthog-pending-identify'), null);
});

it('remove referrer interno e dados de autenticação sem apagar a origem externa', () => {
  const local = storage({ 'nm-cookie-consent': 'all' });
  const [config] = page(local).configs;
  const event = config.before_send({ properties: {
    $referrer: 'https://www.nomemagnetico.com.br/auth/login',
    $referring_domain: 'nomemagnetico.com.br',
    $current_url: 'https://www.nomemagnetico.com.br/auth/login?email=fixture&utm_source=campaign#token',
    $set_once: { $initial_referrer: 'https://example.test/entrada', email: 'fixture' },
  } });
  assert.ok(event);
  assert.equal(event.properties.$referrer, undefined);
  assert.equal(event.properties.$referring_domain, undefined);
  assert.equal(event.properties.$current_url, 'https://www.nomemagnetico.com.br/auth/login?utm_source=campaign');
  const initial = event.properties.$set_once as Record<string, string>;
  assert.equal(initial.$initial_referrer, 'https://example.test/entrada');
  assert.equal(initial.email, undefined);
  local.setItem('nm-cookie-consent', 'essential');
  assert.equal(config.before_send(event), null);
});

it('emite begin_checkout uma vez após confirmar o preço e criar a sessão Stripe', async () => {
  const events: unknown[][] = [];
  const requests: Array<Record<string, unknown>> = [];
  const id = '019af9f2-48f0-7a88-9a68-3c0202feb366';
  const fixture = mock.module('../frontend/lib/analytics', {
    namedExports: {
      captureBeginCheckout: (...args: unknown[]) => events.push(args),
      getPostHogDistinctId: () => 'visitor',
      getPostHogSessionId: () => id,
    },
  });
  const fetchMock = mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    requests.push(JSON.parse(String(init.body)));
    return requests.length === 1
      ? Response.json({ price_changed: true, effective: { final_cents: 9700 } })
      : Response.json({ url: 'https://example.test/checkout', final_cents: 9700 });
  });
  Reflect.set(globalThis, 'window', { confirm: () => true });
  try {
    const { postCreateCheckoutWithPriceConfirm } = await import('../frontend/lib/checkout-api');
    assert.equal((await postCreateCheckoutWithPriceConfirm({ product_type: 'nome_social' }, String)).ok, true);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].ph_session_id, id);
    assert.equal(requests[1].ph_distinct_id, 'visitor');
    assert.equal(requests[1].ph_analytics_consent, true);
    assert.deepEqual(events, [['nome_social', 'card', 97, id]]);
  } finally {
    fixture.restore();
    fetchMock.mock.restore();
    Reflect.deleteProperty(globalThis, 'window');
  }
});
