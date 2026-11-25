import { mkdir, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';

export type PaidChannel = 'google_ads' | 'meta_ads';
type Day = string;
export type CampaignDay = {
  channel: PaidChannel;
  account: string;
  campaign: string;
  day: Day;
};

type Spend = CampaignDay & { spendCents: number };
type Analysis = CampaignDay & { analyses: number };
type AttributedPayment = CampaignDay & { order: string; paidDay: Day };
type StripePayment = { order: string; paidCents: number; refundedCents: number; currency: string };
const daySchema = z.string().date();
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });

export function saoPauloDay(date: Date): Day {
  const parts = Object.fromEntries(dayFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function shiftDay(day: Day, days: number): Day {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function matureCampaignPeriod(now = new Date()) {
  const today = saoPauloDay(now);
  return { start: shiftDay(today, -14), end: shiftDay(today, -7) };
}

export const periodSchema = z.object({ start: daySchema, end: daySchema }).refine(
  ({ start, end }) => start < end && end <= shiftDay(start, 31),
  'Período deve ter de 1 a 31 dias',
);

export const accounts = { google_ads: '3684371046', meta_ads: '1566113224992478' } as const;

export function campaignKey(row: Omit<CampaignDay, 'day'>): string {
  return `nome-magnetico:${row.channel}:${row.account}:${row.campaign}`;
}

export function aggregateMatureCampaigns(input: {
  period: { start: Day; end: Day };
  spend: Spend[];
  analyses: Analysis[];
  attributed: AttributedPayment[];
  stripe: StripePayment[];
  covered: PaidChannel[];
}) {
  const { period, spend, analyses, attributed, stripe, covered } = input;
  const metrics = new Map<string, {
    key: string; spendCents: number; analyses: number; paid: number; netCents: number; cpaCents: number | null;
  }>();
  const paidRevenueByDay: Record<Day, number> = {};
  const missingOrders = new Set<string>();
  const attributedOrders = new Map<string, AttributedPayment>();
  const stripeOrders = new Map(stripe.map((payment) => [payment.order, payment]));
  const eligible = (row: CampaignDay) => covered.includes(row.channel) && accounts[row.channel] === row.account &&
    row.day >= period.start && row.day < period.end;

  for (const row of spend) {
    if (!eligible(row)) continue;
    const key = campaignKey(row);
    const entry = metrics.get(key) ?? { key, spendCents: 0, analyses: 0, paid: 0, netCents: 0, cpaCents: null };
    entry.spendCents += row.spendCents;
    metrics.set(key, entry);
  }
  for (const row of analyses) {
    if (!eligible(row)) continue;
    const entry = metrics.get(campaignKey(row));
    if (entry) entry.analyses += row.analyses;
  }
  for (const row of attributed) {
    if (!eligible(row)) continue;
    const existing = attributedOrders.get(row.order);
    if (existing && (campaignKey(existing) !== campaignKey(row) || existing.day !== row.day || existing.paidDay !== row.paidDay)) {
      throw new Error('Pedido possui atribuição conflitante');
    }
    attributedOrders.set(row.order, row);
  }
  for (const row of attributedOrders.values()) {
    const entry = metrics.get(campaignKey(row));
    const payment = stripeOrders.get(row.order);
    if (!entry || payment?.currency.toLowerCase() !== 'brl' || payment.paidCents <= 0) {
      missingOrders.add(row.order);
      continue;
    }
    const net = Math.max(0, payment.paidCents - payment.refundedCents);
    entry.paid += 1;
    entry.netCents += net;
    paidRevenueByDay[row.paidDay] = (paidRevenueByDay[row.paidDay] ?? 0) + net;
  }
  for (const entry of metrics.values()) {
    if (entry.paid > 0) entry.cpaCents = entry.spendCents / entry.paid;
  }
  return { rows: [...metrics.values()], paidRevenueByDay, missingOrders: missingOrders.size };
}

export type CampaignMetrics = ReturnType<typeof aggregateMatureCampaigns>['rows'][number];

export class PaidOperationBusy extends Error {}

// Os workers PM2 da aplicação compartilham o mesmo diretório temporário na VPS.
export async function withPaidOperationLock<T>(name: 'campaigns' | 'brand', run: () => Promise<T>): Promise<T> {
  const path = join(tmpdir(), `nm-dev353-${name}.lock`);
  try {
    await mkdir(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new PaidOperationBusy('Já existe uma sincronização em curso');
    throw error;
  }
  try {
    return await run();
  } finally {
    await rmdir(path);
  }
}

const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const font = z.string().regex(/^[a-zA-Z ,'-]{1,80}$/);
export const brandArtifactSchema = z.object({
  tag: z.string().regex(/^v\d+\.\d+\.\d+$/),
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  deployed_at: z.string().datetime(),
  tokens: z.object({ primary: color, background: color, deep_background: color, heading: font, body: font }).strict(),
}).strict();

export type BrandArtifact = z.infer<typeof brandArtifactSchema>;
export const BRAND_MARKER = 'Referência técnica de tokens · DEV-353';

export function brandBlock(artifact: BrandArtifact) {
  const { tokens } = artifact;
  const values = `Dourado principal ${tokens.primary}\nFundo ${tokens.background}\nFundo profundo ${tokens.deep_background}\nTítulos ${tokens.heading}\nTexto ${tokens.body}`;
  return {
    comparison: `${BRAND_MARKER}\n${values}\n`,
    content: `${BRAND_MARKER}\n${values}\n\nVersão ${artifact.tag} · ${artifact.sha}\nDeploy ${artifact.deployed_at}`,
  };
}
