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
import { readServerEnv } from '../env/runtime';

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
  | 'marketing.payment_confirmed';

interface NotificationPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  accessUrl?: string;
  resetUrl?: string;
  analysisId?: string;
  analysisUrl?: string;
  amount?: number;
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

async function sendToWebhook(url: string, event: NotificationEvent | MarketingEvent, payload: NotificationPayload | MarketingPayload): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        payload,
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

