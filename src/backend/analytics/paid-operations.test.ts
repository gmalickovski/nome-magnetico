import assert from 'node:assert/strict';
import { test } from 'node:test';
import { paidTouchFromSearch } from '../../shared/paid-attribution';
import { accounts, aggregateMatureCampaigns, brandBlock, matureCampaignPeriod, PaidOperationBusy, withPaidOperationLock } from './paid-operations';
import { syncBrand, syncCampaigns } from './paid-sync';

const row = { channel: 'google_ads' as const, account: accounts.google_ads, campaign: '100', day: '2026-11-12' };
const period = { start: '2026-11-11', end: '2026-11-18' };

test('captura primeiro clique pago com chave estável, filtrando parâmetros de dados pessoais', () => {
  assert.equal(paidTouchFromSearch('?utm_source=app_chat&utm_medium=cpc&utm_id=100'), undefined);
  assert.deepEqual(paidTouchFromSearch('?utm_source=google&utm_medium=cpc&utm_id=100&utm_content=teste%40example.com&gclid=clid_ABC&email=a%40b.com'), {
    channel: 'google_ads', campaign_id: '100', ad_id: undefined, utm_source: 'google', utm_medium: 'cpc',
    utm_campaign: undefined, utm_content: undefined, gclid: 'clid_ABC', fbclid: undefined,
  });
});

test('agrega gasto uma vez por dia, conta pedidos únicos e concilia reembolso parcial ou total', () => {
  const report = aggregateMatureCampaigns({
    period, covered: ['google_ads'],
    spend: [{ ...row, spendCents: 2500 }, { ...row, campaign: '200', spendCents: 0 }],
    analyses: [{ ...row, analyses: 3 }],
    attributed: [
      { ...row, order: 'one', paidDay: '2026-11-13' },
      { ...row, order: 'one', paidDay: '2026-11-13' },
      { ...row, order: 'two', paidDay: '2026-11-18' },
    ],
    stripe: [
      { order: 'one', paidCents: 9900, refundedCents: 1500, currency: 'BRL' },
      { order: 'two', paidCents: 9900, refundedCents: 9900, currency: 'BRL' },
    ],
  });
  assert.equal(report.missingOrders, 0);
  assert.equal(report.rows[0].spendCents, 2500);
  assert.equal(report.rows[0].paid, 2);
  assert.equal(report.rows[0].netCents, 8400);
  assert.equal(report.rows[0].cpaCents, 1250);
  assert.equal(report.rows[1].cpaCents, null);
  assert.deepEqual(report.paidRevenueByDay, { '2026-11-13': 8400, '2026-11-18': 0 });
  assert.deepEqual(matureCampaignPeriod(new Date('2026-11-25T08:00:00Z')), period);
});

test('trava recusa execução concorrente e libera na falha', async () => {
  let unlock!: () => void;
  const wait = new Promise<void>((resolve) => { unlock = resolve; });
  await assert.rejects(withPaidOperationLock('campaigns', async () => {
    try {
      await assert.rejects(withPaidOperationLock('campaigns', async () => 'unexpected'), PaidOperationBusy);
    } finally {
      unlock();
    }
    await wait;
    throw new Error('falha simulada');
  }), /falha simulada/);
  assert.equal(await withPaidOperationLock('campaigns', async () => 'reprocessado'), 'reprocessado');
});

test('tokens escrevem só no bloco gerenciado e não escrevem novamente com os mesmos valores', async () => {
  const first = {
    tag: 'v1.1.0', sha: '1'.repeat(40), deployed_at: '2026-11-25T00:00:00.000Z',
    tokens: { primary: '#d4af37', background: '#1a1a1a', deep_background: '#111111', heading: 'Cinzel, serif', body: 'Inter, sans-serif' },
  };
  let managed = brandBlock(first).content;
  const originalFetch = globalThis.fetch;
  const patches: string[] = [];
  process.env.NM_MEDIA_NOTION_TOKEN = 'synthetic-test';
  process.env.NM_MEDIA_NOTION_BRAND_BLOCK = 'afc9c942-2bf5-4a77-b3f3-5220277ffe09';
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /\/blocks\/afc9c942-2bf5-4a77-b3f3-5220277ffe09$/);
    if (init?.method === 'PATCH') {
      const body = JSON.parse(String(init.body));
      patches.push(String(url));
      managed = body.paragraph.rich_text[0].text.content;
    }
    return Response.json({ paragraph: { rich_text: [{ plain_text: managed }] } });
  };
  try {
    const second = { ...first, sha: '2'.repeat(40), tokens: { ...first.tokens, primary: '#cba234' } };
    assert.equal((await syncBrand(second, true)).status, 'updated');
    assert.equal((await syncBrand({ ...second, sha: '3'.repeat(40) }, true)).status, 'unchanged');
    assert.equal(patches.length, 1);
    assert.match(managed, /#cba234/);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.NM_MEDIA_NOTION_TOKEN;
    delete process.env.NM_MEDIA_NOTION_BRAND_BLOCK;
  }
});

test('sincronização manual é idempotente e mantém as métricas anteriores se as fontes falharem', async () => {
  const originalFetch = globalThis.fetch;
  const env = {
    NM_MEDIA_POSTHOG_PROJECT: '123',
    NM_MEDIA_POSTHOG_READ_KEY: 'synthetic-test',
    NM_MEDIA_NOTION_TOKEN: 'synthetic-test',
    NM_MEDIA_NOTION_DATA_SOURCE: 'afc9c942-2bf5-4a77-b3f3-5220277ffe09',
  };
  Object.assign(process.env, env);
  const approvals = { name: 'Aguardando OK' };
  const page = { id: 'campaign-fixture', properties: { Status: approvals } as Record<string, unknown> };
  let patches = 0;
  let failed = false;
  globalThis.fetch = async (url, init) => {
    const address = new URL(String(url));
    const body = JSON.parse(String(init?.body ?? '{}'));
    if (address.hostname === 'us.posthog.com') {
      if (failed) return new Response(null, { status: 503 });
      const query = String(body.query.query);
      if (query.includes('meta_ads_campaign_stats')) return Response.json({ results: [] });
      if (query.includes('google_ads_campaign_stats')) return Response.json({ results: [[row.account, row.campaign, row.day, 25_000_000]] });
      if (query.includes('paid_analysis_completed')) return Response.json({ results: [[row.channel, row.account, row.campaign, row.day, 2]] });
      return Response.json({ results: [] });
    }
    assert.equal(address.hostname, 'api.notion.com');
    if (init?.method === 'PATCH') {
      assert.equal(address.pathname, '/v1/pages/campaign-fixture');
      assert.equal(body.properties.Status, undefined);
      assert.equal(body.properties['CPA (BRL)'], undefined);
      Object.assign(page.properties, body.properties);
      patches += 1;
      return Response.json(page);
    }
    assert.equal(body.filter.rich_text.equals, `nome-magnetico:google_ads:${row.account}:${row.campaign}`);
    return Response.json({ results: [page], has_more: false });
  };
  try {
    const first = await syncCampaigns(period, true);
    const second = await syncCampaigns(period, true);
    assert.equal(first.writes?.[0].result, 'updated');
    assert.equal(second.writes?.[0].result, 'unchanged');
    assert.equal(second.rows?.[0].cpaCents, null);
    failed = true;
    assert.equal((await syncCampaigns(period, true)).status, 'no_data');
    assert.equal(patches, 1);
    assert.equal(page.properties.Status, approvals);
    assert.deepEqual(page.properties['Gasto (BRL)'], { number: 25 });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(env)) delete process.env[key];
  }
});
