/**
 * Sistema de notificações via n8n.
 * NUNCA enviar email diretamente — sempre via este módulo.
 *
 * Roteamento:
 *   marketing.* → N8N_WEBHOOK_MARKETING
 *   demais eventos (incluindo access.lifecycle) → N8N_WEBHOOK_TRANSACIONAL
 *
 * Erros do sistema → tabela Supabase `error_logs` via error-logger.ts
 */

import { captureFluxoException, type Fluxo } from '../../sentry/fluxo';
import { getAccessAttributesSnapshot } from '../db/access-attributes';
import { readServerEnv } from '../env/runtime';
import {
  buildAccessAttributesPayload,
  type AccessAttributesPayload,
  type AccessAttributeOrigin,
} from './access-attributes-payload';
import { enrichNotificationPayload } from './enrich-payload';

type NotificationEvent =
  | 'user.welcome'
  | 'user.password_reset'
  | 'user.analysis_complete'
  | 'marketing.free_analysis_completed'
  | 'payment.confirmed'
  | 'payment.failed'
  | 'subscription.expiring_soon'
  | 'subscription.expired'
  | 'access.lifecycle'
  | 'admin.new_user'
  | 'admin.new_payment'
  | 'payment.refunded'
  | 'free_analysis.requested'
;

type MarketingEvent =
  | 'marketing.free_analysis_completed'
  | 'marketing.payment_confirmed'
  | 'marketing.access_refunded';

interface NotificationPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  accessUrl?: string;
  resetUrl?: string;
  analysisId?: string;
  analysisUrl?: string;
  amount?: number;
  /** Valor BRL já formatado (centavos → moeda). Preenchido por enrichNotificationPayload. */
  amount_formatted?: string;
  productName?: string;
  daysLeft?: number;
  renewUrl?: string;
  userId?: string;
  productType?: string;
  downloadUrl?: string;
  [key: string]: unknown;
}

interface MarketingPayload {
  email: string;
  firstName: string;
  userId: string;
  analysisId: string;
  analysisUrl: string;
  productType: string;
  productName: string;
  offerUrl: string;
  checkoutUrl: string;
  score: number | null;
  nomeCompleto: string;
  bloqueios: number;
  licoesCarmicas: number;
  tendenciasOcultas: number;
  debitosCarmicos: number;
  source: string;
}

/** Opt-in de marketing e avisos de expiração. O payload não vai no evento do Sentry. */
const FLUXO_DO_EVENTO: Partial<Record<NotificationEvent | MarketingEvent, Fluxo>> = {
  'marketing.free_analysis_completed': 'leads',
  'subscription.expiring_soon': 'notify_expiring',
  'subscription.expired': 'notify_expiring',
};

function reportNotifyFailure(event: NotificationEvent | MarketingEvent, error: unknown): void {
  const fluxo = FLUXO_DO_EVENTO[event];
  if (!fluxo) return;
  captureFluxoException(fluxo, error);
}

function prepareWebhookPayload(
  payload: NotificationPayload | MarketingPayload | AccessAttributesPayload,
): NotificationPayload | MarketingPayload | AccessAttributesPayload {
  if ('amount' in payload && typeof (payload as NotificationPayload).amount === 'number') {
    return enrichNotificationPayload(payload as NotificationPayload);
  }
  return payload;
}

async function sendToWebhook(
  url: string,
  event: NotificationEvent | MarketingEvent,
  payload: NotificationPayload | MarketingPayload | AccessAttributesPayload,
): Promise<boolean> {
  const payloadToSend = prepareWebhookPayload(payload);
  const secret = readServerEnv('N8N_EVENTS_WEBHOOK_SECRET');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) {
    headers.Authorization = secret;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event,
        payload: payloadToSend,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(`[notify] Falha ao enviar evento ${event}: ${response.status}`);
      reportNotifyFailure(event, new Error(`Falha ao enviar evento ${event}`));
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[notify] Erro ao enviar evento ${event}:`, err);
    // Mensagem genérica: o erro do fetch pode trazer a URL do webhook.
    reportNotifyFailure(event, new Error(`Falha ao enviar evento ${event}`));
    return false;
  }
}

function webhookFor(event: string): { url: string | undefined; envName: string } {
  const isMarketing = event.startsWith('marketing.');
  const envName = isMarketing ? 'N8N_WEBHOOK_MARKETING' : 'N8N_WEBHOOK_TRANSACIONAL';
  return { url: readServerEnv(envName), envName };
}

/**
 * Envia um evento transacional para o n8n (emails de sistema).
 */
/** true só quando o webhook aceitou o evento. Sem URL ou com falha de rede, false. */
export async function notify(
  event: NotificationEvent,
  payload: NotificationPayload
): Promise<boolean> {
  const { url, envName } = webhookFor(event);

  if (!url) {
    console.warn(`[notify] ${envName} não configurado — notificação ignorada`);
    return false;
  }

  return sendToWebhook(url, event, payload);
}

/**
 * Envia um evento de marketing para o n8n.
 * O n8n normaliza os dados e cria/atualiza o subscriber no MailerLite,
 * que cuida das automações, templates e métricas de email marketing.
 */
export async function notifyMarketing(
  event: MarketingEvent,
  payload: MarketingPayload
): Promise<boolean> {
  const { url } = webhookFor(event);

  if (!url) {
    console.warn('[notifyMarketing] N8N_WEBHOOK_MARKETING não configurado — evento ignorado');
    return false;
  }

  return sendToWebhook(url, event, payload);
}

export type AccessAttributesEvent = 'marketing.payment_confirmed' | 'marketing.access_refunded';

/**
 * Atributos de acesso do contato (Brevo via n8n).
 * Mesmo envelope de `notify`: `{ event, payload, timestamp }` em N8N_WEBHOOK_MARKETING.
 */
export async function notifyAccessAttributes(
  event: AccessAttributesEvent,
  payload: AccessAttributesPayload,
): Promise<boolean> {
  const { url } = webhookFor(event);

  if (!url) {
    console.warn('[notifyAccessAttributes] N8N_WEBHOOK_MARKETING não configurado — evento ignorado');
    return false;
  }

  return sendToWebhook(url, event, payload);
}

export interface PublishAccessAttributesInput {
  event: AccessAttributesEvent;
  origem: AccessAttributeOrigin;
  userId: string;
  productType: string;
  subscription: {
    id: string;
    purchase_kind?: string | null;
    amount_paid?: number | null;
    starts_at: string;
    ends_at: string;
  };
}

/**
 * Monta o snapshot e envia os atributos. Quem chama envolve em try/catch:
 * falha de leitura ou de rede não pode desfazer o pagamento nem o reembolso.
 */
export async function publishAccessAttributes(input: PublishAccessAttributesInput): Promise<void> {
  const snapshot = await getAccessAttributesSnapshot(input.userId, input.productType);
  if (!snapshot) {
    console.warn(`[notifyAccessAttributes] Sem e-mail para ${input.userId} — ${input.event} ignorado`);
    return;
  }

  const payload = buildAccessAttributesPayload({
    email: snapshot.email,
    nomeCompleto: snapshot.nomeCompleto,
    userId: snapshot.userId,
    origem: input.origem,
    productType: snapshot.productType || input.productType,
    purchaseKind: input.subscription.purchase_kind,
    amountPaidCents: input.subscription.amount_paid,
    subscriptionId: input.subscription.id,
    subscriptionStartsAt: input.subscription.starts_at,
    subscriptionEndsAt: input.subscription.ends_at,
    now: new Date(),
    subscriptions: snapshot.subscriptions,
    optIn: snapshot.optIn,
  });

  await notifyAccessAttributes(input.event, payload);
}
