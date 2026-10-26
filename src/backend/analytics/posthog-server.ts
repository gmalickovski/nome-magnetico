import { createHash } from 'node:crypto';
import { PostHog } from 'posthog-node';
import { readServerEnv } from '../env/runtime';

const DEFAULT_HOST = 'https://us.i.posthog.com';
/** Namespace fixo para o uuid v5 de event + session_id. */
const EVENT_NAMESPACE = '7c9e2a14-5b3d-4f6a-8c1e-2d4b6a8f0e31';
const MAX_DISTINCT_ID = 200;
const MAX_REMEMBERED_EVENTS = 5000;

let client: PostHog | null = null;
let clientFingerprint: string | null = null;
const deliveredEventIds = new Set<string>();

function resolveConfig(): { apiKey: string; host: string } | null {
  const apiKey = readServerEnv('POSTHOG_API_KEY') ?? readServerEnv('PUBLIC_POSTHOG_KEY');
  if (!apiKey) return null;

  const host = (readServerEnv('POSTHOG_HOST') ?? readServerEnv('PUBLIC_POSTHOG_HOST') ?? DEFAULT_HOST).replace(
    /\/$/,
    '',
  );
  if (!host.startsWith('https://')) return null;
  return { apiKey, host };
}

function isShortLivedRuntime(): boolean {
  return Boolean(
    readServerEnv('AWS_LAMBDA_FUNCTION_NAME') ||
      readServerEnv('VERCEL') ||
      readServerEnv('FUNCTION_NAME'),
  );
}

/**
 * Client único. Sem chave (POSTHOG_API_KEY ou PUBLIC_POSTHOG_KEY) devolve null
 * e o capture vira no-op. Leitura via readServerEnv para a VPS injetar o .env
 * em runtime, sem o Vite gravar undefined no bundle.
 */
export function getPostHogServer(): PostHog | null {
  const config = resolveConfig();
  if (!config) return null;

  const fingerprint = `${config.host}|${config.apiKey}`;
  if (client && clientFingerprint === fingerprint) return client;

  try {
    const previous = client;
    client = new PostHog(config.apiKey, {
      host: config.host,
      flushAt: 1,
      flushInterval: 0,
    });
    clientFingerprint = fingerprint;
    if (previous) {
      void previous.shutdown().catch((err) => {
        console.error('[posthog-server] Falha ao encerrar client anterior:', err);
      });
    }
    return client;
  } catch (err) {
    console.error('[posthog-server] Falha ao criar client:', err);
    client = null;
    clientFingerprint = null;
    return null;
  }
}

export async function shutdownPostHogServer(): Promise<void> {
  const current = client;
  client = null;
  clientFingerprint = null;
  if (!current) return;
  try {
    await current.shutdown();
  } catch (err) {
    console.error('[posthog-server] Falha no shutdown:', err);
  }
}

function rememberDelivered(eventId: string): void {
  deliveredEventIds.add(eventId);
  if (deliveredEventIds.size <= MAX_REMEMBERED_EVENTS) return;
  const oldest = deliveredEventIds.values().next().value;
  if (oldest) deliveredEventIds.delete(oldest);
}

function uuidToBytes(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/i.test(hex)) {
    throw new Error('namespace uuid inválido');
  }
  return Buffer.from(hex, 'hex');
}

/** UUID v5 (SHA-1) estável. O PostHog deduplica pelo uuid do evento. */
export function uuidV5(name: string, namespace: string = EVENT_NAMESPACE): string {
  const hash = createHash('sha1');
  hash.update(uuidToBytes(namespace));
  hash.update(name, 'utf8');
  const bytes = hash.digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Buffer.from(bytes).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function posthogEventUuid(event: string, sessionId: string): string {
  return uuidV5(`${event}:${sessionId}`);
}

export function sanitizeDistinctId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_DISTINCT_ID);
}

function distinctIdFromCookieValue(raw: string): string | undefined {
  let decoded = raw.trim();
  if (decoded.startsWith('"') && decoded.endsWith('"')) {
    decoded = decoded.slice(1, -1);
  }
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // valor já decodificado
  }
  try {
    const parsed = JSON.parse(decoded) as { distinct_id?: unknown };
    return sanitizeDistinctId(parsed?.distinct_id);
  } catch {
    return undefined;
  }
}

/** Cookie do posthog-js: ph_<project_key>_posthog. */
export function readPostHogDistinctIdFromCookie(
  cookieHeader: string | null | undefined,
  _projectKey?: string | null,
): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq).trim();
    if (!/^ph_.+_posthog$/.test(name)) continue;
    const distinctId = distinctIdFromCookieValue(trimmed.slice(eq + 1));
    if (distinctId) return distinctId;
  }
  return undefined;
}

export function resolveCheckoutDistinctId(input: {
  phDistinctId?: string | null;
  userId?: string | null;
  email?: string | null;
}): string | undefined {
  return (
    sanitizeDistinctId(input.phDistinctId) ??
    sanitizeDistinctId(input.userId) ??
    sanitizeDistinctId(input.email)
  );
}

/**
 * Envia um evento e espera a fila esvaziar. Em função curta, faz shutdown.
 * Nunca lança: falha de analytics não pode derrubar o webhook.
 */
export async function captureServerEvent(params: {
  distinctId: string;
  event: string;
  properties?: Record<string, string | number | boolean | null>;
  uuid?: string;
}): Promise<void> {
  const distinctId = sanitizeDistinctId(params.distinctId);
  if (!distinctId) return;

  const eventUuid = params.uuid && /^[0-9a-f-]{36}$/i.test(params.uuid) ? params.uuid : undefined;
  if (eventUuid && deliveredEventIds.has(eventUuid)) return;

  try {
    const ph = getPostHogServer();
    if (!ph) return;

    const properties: Record<string, string | number | boolean | null> = {
      ...(params.properties ?? {}),
    };
    if (eventUuid) properties.$insert_id = eventUuid;

    await ph.captureImmediate({
      distinctId,
      event: params.event,
      properties,
      uuid: eventUuid,
    });

    if (isShortLivedRuntime()) {
      await shutdownPostHogServer();
    } else {
      await ph.flush();
    }

    if (eventUuid) rememberDelivered(eventUuid);
  } catch (err) {
    console.error('[posthog-server] Falha ao capturar:', params.event, err);
    await shutdownPostHogServer();
  }
}
