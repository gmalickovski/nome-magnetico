import Stripe from 'stripe';
import { z } from 'zod';
import { readServerEnv } from '../env/runtime';
import {
  accounts, aggregateMatureCampaigns, BRAND_MARKER, brandBlock, shiftDay,
  type BrandArtifact, type CampaignDay, type CampaignMetrics, type PaidChannel,
} from './paid-operations';

type Period = { start: string; end: string };
type NotionProperty = { number?: number | null; date?: { start: string; end?: string | null } | null };
type NotionPage = { id: string; properties: Record<string, NotionProperty> };
const NOTION_VERSION = '2025-09-03';
const HOST = 'https://us.posthog.com';
const MAX_ROWS = 5000;

function setting(name: string): string {
  const value = readServerEnv(name);
  if (!value) throw new Error(`Configuração ausente: ${name}`);
  return value;
}

async function requestJson<T>(url: string, headers: Record<string, string>, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method, headers: { ...headers, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Resposta ${response.status} de ${new URL(url).hostname}`);
  return response.json() as Promise<T>;
}

function notion<T>(path: string, method?: string, body?: unknown) {
  const headers = { Authorization: `Bearer ${setting('NM_MEDIA_NOTION_TOKEN')}`, 'Notion-Version': NOTION_VERSION };
  return requestJson<T>(`https://api.notion.com/v1/${path}`, headers, method, body);
}

async function warehouse(query: string): Promise<unknown[][]> {
  const project = z.string().regex(/^\d+$/).parse(setting('NM_MEDIA_POSTHOG_PROJECT'));
  const headers = { Authorization: `Bearer ${setting('NM_MEDIA_POSTHOG_READ_KEY')}` };
  const result = await requestJson<{ results?: unknown[][] }>(`${HOST}/api/projects/${project}/query/`, headers, 'POST', {
    query: { kind: 'HogQLQuery', query: `${query} LIMIT ${MAX_ROWS + 1}` },
  });
  if (!Array.isArray(result.results) || result.results.length > MAX_ROWS) throw new Error('Consulta PostHog incompleta ou acima do limite');
  return result.results;
}

function nonNegative(value: unknown) {
  const number = typeof value === 'number' || typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(number) || number < 0) throw new Error('Métrica inválida na fonte');
  return number;
}

function day(value: unknown) {
  return z.string().date().parse(String(value).slice(0, 10));
}

function campaignDay(channel: PaidChannel, account: unknown, campaign: unknown, date: unknown): CampaignDay {
  return {
    channel,
    account: z.string().regex(/^\d{1,24}$/).parse(String(account)),
    campaign: z.string().regex(/^\d{1,24}$/).parse(String(campaign)),
    day: day(date),
  };
}

async function fetchSpend(channel: PaidChannel, { start, end }: Period) {
  const google = channel === 'google_ads';
  const table = google ? 'google_ads_campaign_stats' : 'meta_ads_campaign_stats';
  const account = google ? 'customer_id' : 'account_id';
  const date = google ? 'segments_date' : 'date_start';
  const value = google ? 'metrics_cost_micros' : 'spend';
  const rows = await warehouse(`
    SELECT toString(${account}), toString(campaign_id), toDate(${date}), sum(toFloat64(${value}))
    FROM ${table}
    WHERE toString(${account}) = '${accounts[channel]}'
      AND toDate(${date}) >= toDate('${start}') AND toDate(${date}) < toDate('${end}')
    GROUP BY 1, 2, 3`);
  return rows.map((row) => ({
    ...campaignDay(channel, row[0], row[1], row[2]),
    spendCents: Math.round(nonNegative(row[3]) * (google ? 1 / 10000 : 100)),
  }));
}

async function fetchFunnel({ start, end }: Period) {
  const click = "toDate(parseDateTimeBestEffortOrNull(toString(properties.paid_click_at)), 'America/Sao_Paulo')";
  const common = `timestamp >= toDateTime('${start} 00:00:00', 'America/Sao_Paulo')
    AND timestamp < toDateTime('${shiftDay(end, 7)} 00:00:00', 'America/Sao_Paulo')
    AND ${click} >= toDate('${start}') AND ${click} < toDate('${end}')
    AND properties.paid_channel IN ('google_ads','meta_ads')`;
  const dimensions = `properties.paid_channel, properties.paid_account_id, properties.paid_campaign_id, ${click}`;
  const [analysisRows, paidRows] = await Promise.all([
    warehouse(`SELECT ${dimensions}, uniqExact(uuid) FROM events
      WHERE ${common} AND event = 'paid_analysis_completed'
      GROUP BY 1, 2, 3, 4`),
    warehouse(`SELECT DISTINCT ${dimensions}, properties.session_id, toDate(timestamp, 'America/Sao_Paulo') FROM events
      WHERE ${common} AND event = 'purchase' AND properties.purchase_kind = 'new'`),
  ]);
  const dimensionsFromRow = (row: unknown[]) => campaignDay(
    z.enum(['google_ads', 'meta_ads']).parse(row[0]), row[1], row[2], row[3],
  );
  return {
    analyses: analysisRows.map((row) => ({ ...dimensionsFromRow(row), analyses: nonNegative(row[4]) })),
    attributed: paidRows.map((row) => ({
      ...dimensionsFromRow(row), order: z.string().regex(/^cs_(?:test|live)_[a-zA-Z0-9]+$/).parse(row[4]), paidDay: day(row[5]),
    })),
  };
}

async function confirmedStripe({ start, end }: Period, wanted: ReadonlySet<string>) {
  if (wanted.size === 0) return [];
  const key = setting('NM_MEDIA_STRIPE_READ_KEY');
  const production = readServerEnv('APP_ENV') === 'production';
  if (!(production ? /^rk_live_/ : /^rk_test_/).test(key)) throw new Error('Chave restrita Stripe incompatível com o ambiente');
  const stripe = new Stripe(key, { maxNetworkRetries: 0, timeout: 8000 });
  const localSeconds = (value: string) => Math.floor(Date.parse(`${value}T00:00:00-03:00`) / 1000);
  const orders = [];
  let inspected = 0;
  for await (const session of stripe.checkout.sessions.list({
    limit: 100, created: { gte: localSeconds(start), lt: localSeconds(shiftDay(end, 7)) },
    expand: ['data.payment_intent.latest_charge'],
  })) {
    if (++inspected > MAX_ROWS) throw new Error('Reconciliação Stripe acima do limite');
    if (!wanted.has(session.id) || session.payment_status !== 'paid') continue;
    const intent = session.payment_intent;
    if (!intent || typeof intent === 'string' || intent.status !== 'succeeded') continue;
    const charge = intent.latest_charge;
    if (!charge || typeof charge === 'string' || !charge.paid) continue;
    orders.push({ order: session.id, paidCents: charge.amount_captured, refundedCents: charge.amount_refunded, currency: charge.currency });
    if (orders.length === wanted.size) break;
  }
  return orders;
}

function notionMetrics(row: CampaignMetrics, { start, end }: Period) {
  return {
    'Gasto (BRL)': { number: row.spendCents / 100 },
    'Análises concluídas': { number: row.analyses },
    'Compras confirmadas atribuídas': { number: row.paid },
    'Receita líquida atribuída (BRL)': { number: row.netCents / 100 },
    'Período dos dados': { date: { start, end: shiftDay(end, -1) } },
  };
}

async function updateCampaign(row: CampaignMetrics, period: Period) {
  const id = z.string().uuid().parse(setting('NM_MEDIA_NOTION_DATA_SOURCE'));
  const { results, has_more } = await notion<{ results: NotionPage[]; has_more: boolean }>(`data_sources/${id}/query`, 'POST', {
    filter: { property: 'Chave de sincronização', rich_text: { equals: row.key } }, page_size: 2,
  });
  if (has_more || results.length !== 1) return results.length === 0 ? 'missing' : 'duplicate';
  const [page] = results;
  const properties = notionMetrics(row, period);
  const previous = page.properties['Período dos dados']?.date;
  if (previous && (previous.end ?? previous.start) > properties['Período dos dados'].date.end) return 'older';
  if (Object.entries(properties).every(([key, property]) => 'number' in property
    ? page.properties[key]?.number === property.number
    : previous?.start === property.date.start && previous?.end === property.date.end)) return 'unchanged';
  await notion(`pages/${page.id}`, 'PATCH', {
    properties: { ...properties, 'Última sincronização': { date: { start: new Date().toISOString() } } },
  });
  return 'updated';
}

export async function syncCampaigns(period: Period, apply: boolean) {
  const channels = Object.keys(accounts) as PaidChannel[];
  const sources = await Promise.allSettled(channels.map((channel) => fetchSpend(channel, period)));
  const covered = channels.filter((_, index) => {
    const result = sources[index];
    return result.status === 'fulfilled' && result.value.length > 0;
  });
  const unavailable = channels.filter((channel) => !covered.includes(channel));
  if (covered.length === 0) return { status: 'no_data', unavailable, period };
  const spend = sources.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  const funnel = await fetchFunnel(period);
  const wanted = new Set(funnel.attributed.filter((row) => covered.includes(row.channel)).map((row) => row.order));
  const stripe = await confirmedStripe(period, wanted);
  const report = aggregateMatureCampaigns({ period, spend, ...funnel, stripe, covered });
  if (report.missingOrders > 0) return { status: 'reconciliation_error', unavailable, period, missingOrders: report.missingOrders };
  const writes = [];
  if (apply) {
    for (const row of report.rows) writes.push({ key: row.key, result: await updateCampaign(row, period) });
  }
  const issues = unavailable.length > 0 || writes.some((write) => write.result === 'missing' || write.result === 'duplicate');
  return { status: issues ? 'partial' : 'ok', unavailable, period, ...report, writes };
}

export async function syncBrand(artifact: BrandArtifact, apply: boolean) {
  const id = z.string().uuid().parse(setting('NM_MEDIA_NOTION_BRAND_BLOCK'));
  const { paragraph } = await notion<{ paragraph?: { rich_text: { plain_text: string }[] } }>(`blocks/${id}`);
  const current = paragraph?.rich_text.map((text) => text.plain_text).join('') ?? '';
  if (!current.startsWith(BRAND_MARKER)) throw new Error('Bloco gerenciado não reconhecido');
  const next = brandBlock(artifact);
  if (current.startsWith(next.comparison)) return { status: 'unchanged', sha: artifact.sha };
  if (!apply) return { status: 'would_update', sha: artifact.sha };
  await notion(`blocks/${id}`, 'PATCH', {
    paragraph: { rich_text: [{ type: 'text', text: { content: next.content } }] },
  });
  return { status: 'updated', sha: artifact.sha };
}
