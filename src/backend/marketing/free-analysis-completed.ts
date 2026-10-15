import { buildFreeAnalysisMarketingPayload } from '../notifications/free-analysis-payload';
import { notify } from '../notifications/notify';
import { captureFluxoException } from '../../sentry/fluxo';
import { EMAIL_CAMPAIGN_FREE_ANALYSIS, withEmailUtm } from '../../utils/utm';

export interface FreeAnalysisMarketingNotifyInput {
  email: string;
  nomeCompleto: string;
  analiseId: string;
  score: number;
  concluidaEm: Date | string;
  optIn: boolean;
  optInEm?: Date | string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  analysisUrl: string;
  offerUrl: string;
  checkoutUrl: string;
}

/**
 * Opt-in explícito no body (`opt_in === true`): marketing com consentimento registrado.
 * Campo ausente: fluxo DOI no n8n/Brevo (`opt_in: false`, sem inscrição silenciosa).
 * `opt_in === false`: não dispara marketing.
 */
export function resolvePublicFreeAnalysisMarketingConsent(
  optInField: unknown,
): { send: true; optIn: boolean; optInEm: string | null } | { send: false } {
  if (optInField === false) return { send: false };
  if (optInField === true) {
    return { send: true, optIn: true, optInEm: new Date().toISOString() };
  }
  return { send: true, optIn: false, optInEm: null };
}

export function buildDefaultFreeAnalysisMarketingUrls(
  appUrl: string,
  analiseId: string,
  options?: { downloadPath?: string },
): { analysisUrl: string; offerUrl: string; checkoutUrl: string } {
  const base = appUrl.replace(/\/+$/, '');
  const analysisPath = options?.downloadPath ?? `/app/resultado/${analiseId}`;
  return {
    analysisUrl: withEmailUtm(`${base}${analysisPath}`, EMAIL_CAMPAIGN_FREE_ANALYSIS),
    offerUrl: withEmailUtm(`${base}/nome-social`, EMAIL_CAMPAIGN_FREE_ANALYSIS),
    checkoutUrl: withEmailUtm(
      `${base}/auth/cadastro?produto=nome_social`,
      EMAIL_CAMPAIGN_FREE_ANALYSIS,
    ),
  };
}

export async function sendFreeAnalysisMarketingEvent(
  input: FreeAnalysisMarketingNotifyInput,
): Promise<void> {
  const email = input.email.trim();
  if (!email || !Number.isFinite(input.score)) {
    console.warn('[marketing] análise grátis sem e-mail ou score — evento ignorado');
    return;
  }

  const payload = buildFreeAnalysisMarketingPayload({
    email,
    nomeCompleto: input.nomeCompleto,
    concluidaEm: input.concluidaEm,
    analiseId: input.analiseId,
    score: input.score,
    optIn: input.optIn,
    optInEm: input.optInEm,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    analysisUrl: input.analysisUrl,
    offerUrl: input.offerUrl,
    checkoutUrl: input.checkoutUrl,
  });

  await notify('marketing.free_analysis_completed', {
    email: payload.email,
    nome: payload.nome,
    sobrenome: payload.sobrenome,
    analise_data: payload.analise_data,
    analise_id: payload.analise_id,
    score: payload.score,
    origem: payload.origem,
    opt_in: payload.opt_in,
    opt_in_data: payload.opt_in_data,
    utm_source: payload.utm_source,
    utm_medium: payload.utm_medium,
    utm_campaign: payload.utm_campaign,
    analysisUrl: payload.analysisUrl,
    offerUrl: payload.offerUrl,
    checkoutUrl: payload.checkoutUrl,
  });
}

export type FreeAnalysisMarketingSender = (
  input: FreeAnalysisMarketingNotifyInput,
) => Promise<void>;

/** Fire-and-forget com captura no Sentry (fluxo `leads`). */
export function createFireFreeAnalysisMarketingEvent(
  sender: FreeAnalysisMarketingSender = sendFreeAnalysisMarketingEvent,
): (input: FreeAnalysisMarketingNotifyInput) => void {
  return (input) => {
    void sender(input).catch((err) => {
      console.error('[marketing] falha ao notificar análise grátis:', err);
      captureFluxoException('leads', err);
    });
  };
}

export const fireFreeAnalysisMarketingEvent = createFireFreeAnalysisMarketingEvent();
