import { PRODUCT_LABELS } from '../../shared/product-labels';
import { captureServerEvent } from '../analytics/posthog-server';
import { supabase } from '../db/supabase';
import { authorizeInternalRequest } from '../env/internal-auth';
import { readServerEnv } from '../env/runtime';
import { notify } from '../notifications/notify';
import { RENEWAL_ETAPAS, renewalUtmCampaign, type RenewalEtapa } from '../payments/renewal';

/**
 * Jornada de acesso (DEV-152).
 * O dia é o dia civil em America/Sao_Paulo, via Intl — sem offset fixo.
 * Quem decide é código puro; o handler só busca, grava a idempotência e envia.
 */

export const SAO_PAULO_TZ = 'America/Sao_Paulo';

export type LifecycleEtapa = RenewalEtapa;

export type LifecycleVariant = 'ativacao' | 'dica' | null;

export interface EtapaCount {
  eligible: number;
  sent: number;
  skipped_duplicate: number;
  skipped_no_optin: number;
  skipped_renewed: number;
  errors: number;
}

export interface LifecycleRecipientPreview {
  etapa: LifecycleEtapa;
  variant: LifecycleVariant;
  subscription_id: string;
  user_id: string;
  email: string;
  is_trial_or_gift: boolean;
}

export interface LifecycleRunResult {
  dry_run: boolean;
  date_sp: string;
  counts: Record<LifecycleEtapa, EtapaCount>;
  recipients?: LifecycleRecipientPreview[];
}

export interface AccessLifecyclePayload {
  etapa: LifecycleEtapa;
  variant: LifecycleVariant;
  email: string;
  firstName: string;
  productType: string;
  productName: string;
  startsAt: string;
  endsAt: string;
  acessoFim: string;
  daysLeft: number;
  isTrialOrGift: boolean;
  renewUrl: string;
  subscriptionId: string;
  attributes: {
    STATUS_ACESSO: 'ativo' | 'expirado';
    ACESSO_FIM: string;
  };
  [key: string]: unknown;
}

export interface LifecycleSubscriptionRef {
  id: string;
  userId: string;
  productType: string;
  endsAt: string;
  refundedAt?: string | null;
}

export interface LifecycleQueryWindow {
  etapa: LifecycleEtapa;
  column: 'starts_at' | 'ends_at';
  start: Date;
  end: Date;
}

export type LifecycleDecision =
  | { kind: 'skip_renewed' }
  | { kind: 'skip_no_optin' }
  | { kind: 'error' }
  | { kind: 'send'; variant: LifecycleVariant };

const RENEWED_FILTER_ETAPAS = new Set<LifecycleEtapa>(['d-7', 'd-2', 'd0', 'd+7']);

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function saoPauloISODate(date: Date): string {
  const formatted = date.toLocaleString('en-CA', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const match = formatted.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    throw new Error(`data de São Paulo inválida: ${formatted}`);
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function addCalendarDays(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`data inválida: ${isoDate}`);
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  const year = utc.getUTCFullYear();
  const month = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function diffCalendarDays(fromIso: string, toIso: string): number {
  const start = Date.parse(`${fromIso}T00:00:00.000Z`);
  const end = Date.parse(`${toIso}T00:00:00.000Z`);
  return Math.round((end - start) / 86_400_000);
}

/** Dias civis de SP até o fim. Negativo depois que o dia de ends_at passou. */
export function daysLeftInSaoPaulo(now: Date, endsAt: Date): number {
  return diffCalendarDays(saoPauloISODate(now), saoPauloISODate(endsAt));
}

export function acessoStatus(daysLeft: number): 'ativo' | 'expirado' {
  return daysLeft <= 0 ? 'expirado' : 'ativo';
}

function saoPauloParts(date: Date): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SAO_PAULO_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const num = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 'NaN');
  return {
    year: num('year'),
    month: num('month'),
    day: num('day'),
    hour: num('hour'),
    minute: num('minute'),
    second: num('second'),
  };
}

/** Instante UTC em que o relógio de São Paulo marca essa data e hora. */
function saoPauloWallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, second: number): Date {
  let utc = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 3; i++) {
    const parts = saoPauloParts(new Date(utc));
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const desired = Date.UTC(year, month - 1, day, hour, minute, second);
    const diff = desired - asUtc;
    if (diff === 0) break;
    utc += diff;
  }
  return new Date(utc);
}

export function saoPauloDayBounds(isoDate: string): { start: Date; end: Date } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`data inválida: ${isoDate}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const next = addCalendarDays(isoDate, 1);
  const nextMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(next);
  if (!nextMatch) throw new Error(`data inválida: ${next}`);
  return {
    start: saoPauloWallTimeToUtc(year, month, day, 0, 0, 0),
    end: saoPauloWallTimeToUtc(Number(nextMatch[1]), Number(nextMatch[2]), Number(nextMatch[3]), 0, 0, 0),
  };
}

/**
 * Janelas do cron: um dia civil de SP por etapa.
 * d+1 / d+15 filtram starts_at. As demais filtram ends_at.
 */
export function lifecycleQueryWindows(now: Date): LifecycleQueryWindow[] {
  const today = saoPauloISODate(now);
  const specs: Array<{ etapa: LifecycleEtapa; column: 'starts_at' | 'ends_at'; day: string }> = [
    { etapa: 'd+1', column: 'starts_at', day: addCalendarDays(today, -1) },
    { etapa: 'd+15', column: 'starts_at', day: addCalendarDays(today, -15) },
    { etapa: 'd-7', column: 'ends_at', day: addCalendarDays(today, 7) },
    { etapa: 'd-2', column: 'ends_at', day: addCalendarDays(today, 2) },
    { etapa: 'd0', column: 'ends_at', day: today },
    { etapa: 'd+7', column: 'ends_at', day: addCalendarDays(today, -7) },
  ];
  return specs.map((spec) => {
    const bounds = saoPauloDayBounds(spec.day);
    return { etapa: spec.etapa, column: spec.column, start: bounds.start, end: bounds.end };
  });
}

/** Etapas cujo dia civil de SP é hoje. Uma assinatura curta pode cair em mais de uma. */
export function matchingEtapas(input: { now: Date; startsAt: Date; endsAt: Date }): LifecycleEtapa[] {
  const today = saoPauloISODate(input.now);
  const startDay = saoPauloISODate(input.startsAt);
  const endDay = saoPauloISODate(input.endsAt);
  const found: LifecycleEtapa[] = [];
  if (today === addCalendarDays(startDay, 1)) found.push('d+1');
  if (today === addCalendarDays(startDay, 15)) found.push('d+15');
  if (today === addCalendarDays(endDay, -7)) found.push('d-7');
  if (today === addCalendarDays(endDay, -2)) found.push('d-2');
  if (today === endDay) found.push('d0');
  if (today === addCalendarDays(endDay, 7)) found.push('d+7');
  return found;
}

export function isSubscriptionActive(endsAt: Date, now: Date): boolean {
  return endsAt.getTime() > now.getTime();
}

/** d+1 e d+15 só seguem se o acesso ainda não acabou. */
export function passesStageActivityRule(etapa: LifecycleEtapa, endsAt: Date, now: Date): boolean {
  if (etapa === 'd+1' || etapa === 'd+15') return isSubscriptionActive(endsAt, now);
  return true;
}

export function skipsWhenRenewed(etapa: LifecycleEtapa): boolean {
  return RENEWED_FILTER_ETAPAS.has(etapa);
}

export function shouldSkipRenewed(etapa: LifecycleEtapa, hasLaterSameProduct: boolean): boolean {
  return skipsWhenRenewed(etapa) && hasLaterSameProduct;
}

/**
 * Outra assinatura do mesmo usuário e product_type, não reembolsada, com ends_at maior.
 * Empate de ends_at não conta: a pessoa não estendeu o acesso.
 */
export function hasLaterSameProductSubscription(
  current: LifecycleSubscriptionRef,
  others: LifecycleSubscriptionRef[],
): boolean {
  const currentEnds = Date.parse(current.endsAt);
  if (!Number.isFinite(currentEnds)) return false;
  return others.some((other) => {
    if (other.id === current.id) return false;
    if (other.userId !== current.userId) return false;
    if (other.productType !== current.productType) return false;
    if (other.refundedAt) return false;
    const ends = Date.parse(other.endsAt);
    return Number.isFinite(ends) && ends > currentEnds;
  });
}

/** trial_ no session ou amount_paid nulo/0. O texto do e-mail usa essa flag. */
export function isTrialOrGift(input: {
  stripeSessionId?: string | null;
  amountPaid?: number | string | null;
}): boolean {
  if ((input.stripeSessionId ?? '').startsWith('trial_')) return true;
  if (input.amountPaid == null || input.amountPaid === '') return true;
  const amount = typeof input.amountPaid === 'number' ? input.amountPaid : Number(input.amountPaid);
  return amount === 0;
}

/** d+15 sem nenhuma linha em analyses → ativacao. Com uso → dica. Nas outras etapas, null. */
export function lifecycleVariant(etapa: LifecycleEtapa, hasAnalysis: boolean): LifecycleVariant {
  if (etapa !== 'd+15') return null;
  return hasAnalysis ? 'dica' : 'ativacao';
}

export function isDeliverableEmail(email: string | null | undefined): boolean {
  const trimmed = email?.trim() ?? '';
  const at = trimmed.indexOf('@');
  return at > 0 && at < trimmed.length - 1 && !/\s/.test(trimmed);
}

/** g***@dominio.com — só a primeira letra do local-part. */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return '***';
  return `${trimmed[0]}***@${trimmed.slice(at + 1)}`;
}

export function firstNameFromNome(nome: string | null | undefined): string {
  const trimmed = (nome ?? '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  return trimmed.split(' ')[0] ?? '';
}

export function buildRenewUrl(appUrl: string, etapa: LifecycleEtapa): string {
  const base = appUrl.trim().replace(/\/+$/, '');
  const query = new URLSearchParams({
    etapa,
    utm_source: 'brevo',
    utm_medium: 'email',
    utm_campaign: renewalUtmCampaign(etapa),
  });
  return `${base}/app/renovar?${query.toString()}`;
}

export function buildAccessLifecyclePayload(input: {
  etapa: LifecycleEtapa;
  variant: LifecycleVariant;
  email: string;
  firstName: string;
  productType: string;
  productName: string;
  startsAt: string;
  endsAt: string;
  now: Date;
  isTrialOrGift: boolean;
  appUrl: string;
  subscriptionId: string;
}): AccessLifecyclePayload {
  const ends = new Date(input.endsAt);
  const daysLeft = daysLeftInSaoPaulo(input.now, ends);
  const acessoFim = saoPauloISODate(ends);
  return {
    etapa: input.etapa,
    variant: input.variant,
    email: input.email,
    firstName: input.firstName,
    productType: input.productType,
    productName: input.productName,
    startsAt: new Date(input.startsAt).toISOString(),
    endsAt: ends.toISOString(),
    acessoFim,
    daysLeft,
    isTrialOrGift: input.isTrialOrGift,
    renewUrl: buildRenewUrl(input.appUrl, input.etapa),
    subscriptionId: input.subscriptionId,
    attributes: {
      STATUS_ACESSO: acessoStatus(daysLeft),
      ACESSO_FIM: acessoFim,
    },
  };
}

export function lifecycleAnalyticsEvent(etapa: LifecycleEtapa): 'access_expiring' | 'access_expired' | null {
  if (etapa === 'd-7' || etapa === 'd-2') return 'access_expiring';
  if (etapa === 'd0') return 'access_expired';
  return null;
}

export function decideLifecycle(input: {
  etapa: LifecycleEtapa;
  renewed: boolean;
  hasAnalysis: boolean;
  optIn: boolean;
  email: string | null | undefined;
}): LifecycleDecision {
  if (shouldSkipRenewed(input.etapa, input.renewed)) return { kind: 'skip_renewed' };
  if (input.etapa === 'd+7' && !input.optIn) return { kind: 'skip_no_optin' };
  const email = input.email?.trim() ?? '';
  if (!isDeliverableEmail(email)) return { kind: 'error' };
  return { kind: 'send', variant: lifecycleVariant(input.etapa, input.hasAnalysis) };
}

/** Envio real só com a flag exatamente "true" e sem ?dry_run=1. */
export function shouldActuallySend(input: { sendEnabled: string | undefined; dryRunParam: string | null }): boolean {
  return input.sendEnabled === 'true' && input.dryRunParam !== '1';
}

export function emptyLifecycleCounts(): Record<LifecycleEtapa, EtapaCount> {
  const counts = {} as Record<LifecycleEtapa, EtapaCount>;
  for (const etapa of RENEWAL_ETAPAS) {
    counts[etapa] = {
      eligible: 0,
      sent: 0,
      skipped_duplicate: 0,
      skipped_no_optin: 0,
      skipped_renewed: 0,
      errors: 0,
    };
  }
  return counts;
}

function json(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function dryRunQuery(request: Request): string | null {
  try {
    return new URL(request.url).searchParams.get('dry_run');
  } catch {
    return null;
  }
}

function normalizeProductType(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'nome_social';
}

function productNameOf(productType: string): string {
  return PRODUCT_LABELS[productType] ?? productType;
}

interface SubscriptionWindowRow {
  id: string;
  user_id: string;
  product_type: string | null;
  stripe_session_id: string | null;
  amount_paid: number | string | null;
  starts_at: string;
  ends_at: string;
}

interface LaterSubscriptionRow {
  id: string;
  user_id: string;
  product_type: string | null;
  ends_at: string;
  refunded_at: string | null;
}

interface ProfileRow {
  id: string;
  email: string | null;
  nome: string | null;
}

interface AnalysisFlagRow {
  user_id: string;
  opt_in: boolean | null;
}

interface SentRow {
  subscription_id: string;
  etapa: string;
}

interface Candidate {
  id: string;
  userId: string;
  productType: string;
  stripeSessionId: string | null;
  amountPaid: number | string | null;
  startsAt: string;
  endsAt: string;
  etapa: LifecycleEtapa;
}

const PAGE_SIZE = 500;
const IN_CHUNK = 80;
const MAX_PAGES = 100;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function chunks<T>(values: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < values.length; index += size) out.push(values.slice(index, index + size));
  return out;
}

function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return error.code === '23505' || (error.message ?? '').toLowerCase().includes('duplicate key');
}

async function fetchPages<T>(
  load: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await load(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
    from += PAGE_SIZE;
  }
  throw new Error('paginação excedeu o limite');
}

async function fetchSubscriptionWindow(window: LifecycleQueryWindow): Promise<SubscriptionWindowRow[]> {
  return fetchPages((from, to) =>
    supabase
      .from('subscriptions')
      .select('id, user_id, product_type, stripe_session_id, amount_paid, starts_at, ends_at')
      .is('refunded_at', null)
      .gte(window.column, window.start.toISOString())
      .lt(window.column, window.end.toISOString())
      .order('id', { ascending: true })
      .range(from, to) as PromiseLike<{ data: SubscriptionWindowRow[] | null; error: { message: string } | null }>,
  );
}

async function fetchLaterSubscriptions(userIds: string[], minEndsIso: string): Promise<LifecycleSubscriptionRef[]> {
  const refs: LifecycleSubscriptionRef[] = [];
  for (const chunk of chunks(unique(userIds), IN_CHUNK)) {
    const rows = await fetchPages((from, to) =>
      supabase
        .from('subscriptions')
        .select('id, user_id, product_type, ends_at, refunded_at')
        .in('user_id', chunk)
        .is('refunded_at', null)
        .gt('ends_at', minEndsIso)
        .order('id', { ascending: true })
        .range(from, to) as PromiseLike<{ data: LaterSubscriptionRow[] | null; error: { message: string } | null }>,
    );
    for (const row of rows) {
      refs.push({
        id: row.id,
        userId: row.user_id,
        productType: normalizeProductType(row.product_type),
        endsAt: row.ends_at,
        refundedAt: row.refunded_at,
      });
    }
  }
  return refs;
}

async function fetchProfiles(userIds: string[]): Promise<Map<string, ProfileRow>> {
  const map = new Map<string, ProfileRow>();
  for (const chunk of chunks(unique(userIds), IN_CHUNK)) {
    const rows = await fetchPages((from, to) =>
      supabase
        .from('profiles')
        .select('id, email, nome')
        .in('id', chunk)
        .order('id', { ascending: true })
        .range(from, to) as PromiseLike<{ data: ProfileRow[] | null; error: { message: string } | null }>,
    );
    for (const row of rows) map.set(row.id, row);
  }
  return map;
}

async function fetchAnalysisFlags(userIds: string[]): Promise<Map<string, { hasAnalysis: boolean; optIn: boolean }>> {
  const flags = new Map<string, { hasAnalysis: boolean; optIn: boolean }>();
  for (const id of unique(userIds)) flags.set(id, { hasAnalysis: false, optIn: false });
  for (const chunk of chunks(unique(userIds), IN_CHUNK)) {
    const rows = await fetchPages((from, to) =>
      supabase
        .from('analyses')
        .select('user_id, opt_in')
        .in('user_id', chunk)
        .order('id', { ascending: true })
        .range(from, to) as PromiseLike<{ data: AnalysisFlagRow[] | null; error: { message: string } | null }>,
    );
    for (const row of rows) {
      const current = flags.get(row.user_id) ?? { hasAnalysis: false, optIn: false };
      current.hasAnalysis = true;
      if (row.opt_in === true) current.optIn = true;
      flags.set(row.user_id, current);
    }
  }
  return flags;
}

async function fetchSentKeys(subscriptionIds: string[]): Promise<Set<string>> {
  const keys = new Set<string>();
  for (const chunk of chunks(unique(subscriptionIds), IN_CHUNK)) {
    const rows = await fetchPages((from, to) =>
      supabase
        .from('access_lifecycle_sends')
        .select('subscription_id, etapa')
        .in('subscription_id', chunk)
        .order('id', { ascending: true })
        .range(from, to) as PromiseLike<{ data: SentRow[] | null; error: { message: string } | null }>,
    );
    for (const row of rows) keys.add(`${row.subscription_id}:${row.etapa}`);
  }
  return keys;
}

function collectCandidates(windows: LifecycleQueryWindow[], groups: SubscriptionWindowRow[][], now: Date): Candidate[] {
  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  windows.forEach((window, index) => {
    for (const row of groups[index] ?? []) {
      const startsAt = new Date(row.starts_at);
      const endsAt = new Date(row.ends_at);
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) continue;
      if (!matchingEtapas({ now, startsAt, endsAt }).includes(window.etapa)) continue;
      if (!passesStageActivityRule(window.etapa, endsAt, now)) continue;
      const key = `${row.id}:${window.etapa}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        id: row.id,
        userId: row.user_id,
        productType: normalizeProductType(row.product_type),
        stripeSessionId: row.stripe_session_id,
        amountPaid: row.amount_paid,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        etapa: window.etapa,
      });
    }
  });

  const order = new Map(RENEWAL_ETAPAS.map((etapa, index) => [etapa, index]));
  candidates.sort((a, b) => {
    const byEtapa = (order.get(a.etapa) ?? 0) - (order.get(b.etapa) ?? 0);
    if (byEtapa !== 0) return byEtapa;
    return a.id.localeCompare(b.id);
  });
  return candidates;
}

async function rollbackSend(subscriptionId: string, etapa: LifecycleEtapa): Promise<void> {
  const { error } = await supabase
    .from('access_lifecycle_sends')
    .delete()
    .eq('subscription_id', subscriptionId)
    .eq('etapa', etapa);
  if (error) {
    console.error('[access-lifecycle] falha ao apagar envio para nova tentativa', subscriptionId, etapa, error.message);
  }
}

export async function handleAccessLifecycle(request: Request, now = new Date()): Promise<Response> {
  const auth = authorizeInternalRequest(request.headers.get('X-Internal-Secret'));
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const dryRun = !shouldActuallySend({
    sendEnabled: readServerEnv('ACCESS_LIFECYCLE_SEND_ENABLED'),
    dryRunParam: dryRunQuery(request),
  });
  const appUrl = readServerEnv('APP_URL') ?? 'http://localhost:4321';

  try {
    const result = await runAccessLifecycle({ now, dryRun, appUrl });
    return json(result, 200);
  } catch (err) {
    console.error('[access-lifecycle]', err);
    const message = err instanceof Error && err.message ? err.message : 'database error';
    return json({ error: message }, 500);
  }
}

async function runAccessLifecycle(input: { now: Date; dryRun: boolean; appUrl: string }): Promise<LifecycleRunResult> {
  const windows = lifecycleQueryWindows(input.now);
  const groups = await Promise.all(windows.map((window) => fetchSubscriptionWindow(window)));
  const candidates = collectCandidates(windows, groups, input.now);
  const counts = emptyLifecycleCounts();
  const recipients: LifecycleRecipientPreview[] = [];

  if (candidates.length === 0) {
    const empty: LifecycleRunResult = {
      dry_run: input.dryRun,
      date_sp: saoPauloISODate(input.now),
      counts,
    };
    if (input.dryRun) empty.recipients = recipients;
    return empty;
  }

  const expiry = candidates.filter((candidate) => skipsWhenRenewed(candidate.etapa));
  let laterRefs: LifecycleSubscriptionRef[] = [];
  if (expiry.length > 0) {
    const minEnds = expiry.reduce((min, candidate) => {
      const time = Date.parse(candidate.endsAt);
      return Number.isFinite(time) && time < min ? time : min;
    }, Number.POSITIVE_INFINITY);
    laterRefs = await fetchLaterSubscriptions(
      expiry.map((candidate) => candidate.userId),
      new Date(minEnds).toISOString(),
    );
  }
  const laterByUser = new Map<string, LifecycleSubscriptionRef[]>();
  for (const ref of laterRefs) {
    const list = laterByUser.get(ref.userId) ?? [];
    list.push(ref);
    laterByUser.set(ref.userId, list);
  }

  const flagIds = candidates
    .filter((candidate) => candidate.etapa === 'd+15' || candidate.etapa === 'd+7')
    .map((candidate) => candidate.userId);
  const flags = flagIds.length > 0 ? await fetchAnalysisFlags(flagIds) : new Map<string, { hasAnalysis: boolean; optIn: boolean }>();
  const profiles = await fetchProfiles(candidates.map((candidate) => candidate.userId));
  const sentKeys = input.dryRun ? await fetchSentKeys(candidates.map((candidate) => candidate.id)) : new Set<string>();

  for (const candidate of candidates) {
    const profile = profiles.get(candidate.userId);
    const flag = flags.get(candidate.userId) ?? { hasAnalysis: false, optIn: false };
    const renewed = hasLaterSameProductSubscription(
      {
        id: candidate.id,
        userId: candidate.userId,
        productType: candidate.productType,
        endsAt: candidate.endsAt,
        refundedAt: null,
      },
      laterByUser.get(candidate.userId) ?? [],
    );
    const email = profile?.email?.trim() ?? '';
    const decision = decideLifecycle({
      etapa: candidate.etapa,
      renewed,
      hasAnalysis: flag.hasAnalysis,
      optIn: flag.optIn,
      email,
    });

    const bucket = counts[candidate.etapa];
    bucket.eligible += 1;

    if (decision.kind === 'skip_renewed') {
      bucket.skipped_renewed += 1;
      continue;
    }
    if (decision.kind === 'skip_no_optin') {
      bucket.skipped_no_optin += 1;
      continue;
    }
    if (decision.kind === 'error') {
      bucket.errors += 1;
      continue;
    }

    const trial = isTrialOrGift({
      stripeSessionId: candidate.stripeSessionId,
      amountPaid: candidate.amountPaid,
    });

    if (input.dryRun) {
      if (sentKeys.has(`${candidate.id}:${candidate.etapa}`)) {
        bucket.skipped_duplicate += 1;
        continue;
      }
      recipients.push({
        etapa: candidate.etapa,
        variant: decision.variant,
        subscription_id: candidate.id,
        user_id: candidate.userId,
        email: maskEmail(email),
        is_trial_or_gift: trial,
      });
      continue;
    }

    const { error: insertError } = await supabase.from('access_lifecycle_sends').insert({
      subscription_id: candidate.id,
      etapa: candidate.etapa,
      variant: decision.variant,
    });
    if (insertError) {
      if (isUniqueViolation(insertError)) {
        bucket.skipped_duplicate += 1;
        continue;
      }
      throw new Error(insertError.message || 'falha ao registrar envio');
    }

    const payload = buildAccessLifecyclePayload({
      etapa: candidate.etapa,
      variant: decision.variant,
      email,
      firstName: firstNameFromNome(profile?.nome),
      productType: candidate.productType,
      productName: productNameOf(candidate.productType),
      startsAt: candidate.startsAt,
      endsAt: candidate.endsAt,
      now: input.now,
      isTrialOrGift: trial,
      appUrl: input.appUrl,
      subscriptionId: candidate.id,
    });

    let notified = false;
    try {
      notified = await notify('access.lifecycle', payload);
    } catch (err) {
      console.error('[access-lifecycle] notify', candidate.id, candidate.etapa, err);
      notified = false;
    }

    if (!notified) {
      await rollbackSend(candidate.id, candidate.etapa);
      bucket.errors += 1;
      continue;
    }

    const analyticsEvent = lifecycleAnalyticsEvent(candidate.etapa);
    if (analyticsEvent) {
      await captureServerEvent({
        distinctId: candidate.userId,
        event: analyticsEvent,
        properties: {
          etapa: candidate.etapa,
          days_left: payload.daysLeft,
          product_type: candidate.productType,
          is_trial_or_gift: trial,
        },
      });
    }

    bucket.sent += 1;
  }

  const result: LifecycleRunResult = {
    dry_run: input.dryRun,
    date_sp: saoPauloISODate(input.now),
    counts,
  };
  if (input.dryRun) result.recipients = recipients;
  return result;
}
