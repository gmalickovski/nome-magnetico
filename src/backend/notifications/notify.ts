/**
 * Sistema de notificações via n8n.
 * NUNCA enviar email diretamente — sempre via este módulo.
 *
 * Roteamento:
 *   marketing.* → N8N_WEBHOOK_MARKETING
 *   demais eventos → N8N_WEBHOOK_TRANSACIONAL
 *
 * Erros do sistema → tabela Supabase `error_logs` via error-logger.ts
 */

type NotificationEvent =
  | 'user.welcome'
  | 'user.password_reset'
  | 'user.analysis_complete'
  | 'marketing.free_analysis_completed'
  | 'payment.confirmed'
  | 'payment.failed'
  | 'subscription.expiring_soon'
  | 'subscription.expired'
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

async function sendToWebhook(url: string, event: NotificationEvent | MarketingEvent, payload: NotificationPayload | MarketingPayload): Promise<void> {
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
    }
  } catch (err) {
    console.error(`[notify] Erro ao enviar evento ${event}:`, err);
  }
}

/**
 * Envia um evento transacional para o n8n (emails de sistema).
 */
export async function notify(
  event: NotificationEvent,
  payload: NotificationPayload
): Promise<void> {
  const isMarketing = event.startsWith('marketing.');
  const webhookUrl = isMarketing
    ? process.env.N8N_WEBHOOK_MARKETING
    : process.env.N8N_WEBHOOK_TRANSACIONAL;

  if (!webhookUrl) {
    const envName = isMarketing ? 'N8N_WEBHOOK_MARKETING' : 'N8N_WEBHOOK_TRANSACIONAL';
    console.warn(`[notify] ${envName} não configurado — notificação ignorada`);
    return;
  }

  await sendToWebhook(webhookUrl, event, payload);
}

/**
 * Envia um evento de marketing para o n8n.
 * O n8n normaliza os dados e cria/atualiza o subscriber no MailerLite,
 * que cuida das automações, templates e métricas de email marketing.
 */
export async function notifyMarketing(
  event: MarketingEvent,
  payload: MarketingPayload
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_MARKETING;

  if (!webhookUrl) {
    console.warn('[notifyMarketing] N8N_WEBHOOK_MARKETING não configurado — evento ignorado');
    return;
  }

  await sendToWebhook(webhookUrl, event, payload);
}

