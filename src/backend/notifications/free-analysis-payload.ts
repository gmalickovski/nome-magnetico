/**
 * Contrato do evento `marketing.free_analysis_completed` enviado ao n8n
 * (`N8N_WEBHOOK_MARKETING`, path `nm-email-marketing`).
 *
 * Função pura: não lê ambiente, não chama rede e não grava nada.
 * As chaves abaixo são o contrato já validado pelo n8n.
 * `analysisUrl`, `offerUrl` e `checkoutUrl` são extras opcionais (links de e-mail
 * com UTM) e só entram no objeto quando informados.
 */

export interface FreeAnalysisMarketingInput {
  email: string;
  nomeCompleto: string;
  /** Instante em que a análise foi concluída. Vira `analise_data` (YYYY-MM-DD em Brasília). */
  concluidaEm: Date | string;
  analiseId: string;
  score: number;
  optIn: boolean;
  /** Instante do consentimento. Ignorado quando `optIn` é false. */
  optInEm?: Date | string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  /** Link do resultado com UTM de e-mail. Omitido do payload quando vazio. */
  analysisUrl?: string | null;
  /** Link da oferta com UTM de e-mail. Omitido do payload quando vazio. */
  offerUrl?: string | null;
  /** Link de checkout com UTM de e-mail. Omitido do payload quando vazio. */
  checkoutUrl?: string | null;
}

export interface FreeAnalysisMarketingPayload {
  email: string;
  nome: string;
  sobrenome: string;
  analise_data: string;
  analise_id: string;
  score: number;
  origem: 'analise_gratis';
  opt_in: boolean;
  opt_in_data: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  analysisUrl?: string;
  offerUrl?: string;
  checkoutUrl?: string;
}

/** Brasília é UTC−3 o ano inteiro desde 2019 (sem horário de verão). */
const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;

function asDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAnaliseData(value: Date | string): string {
  const date = asDate(value);
  if (!date) return '1970-01-01';
  const brasilia = new Date(date.getTime() - BRASILIA_OFFSET_MS);
  const year = brasilia.getUTCFullYear();
  const month = String(brasilia.getUTCMonth() + 1).padStart(2, '0');
  const day = String(brasilia.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function splitNome(nomeCompleto: string): { nome: string; sobrenome: string } {
  const parts = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { nome: '', sobrenome: '' };
  const [nome, ...resto] = parts;
  return { nome: nome ?? '', sobrenome: resto.join(' ') };
}

function cleanUtm(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return trimmed ? trimmed : null;
}

function cleanUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asScore(score: number): number {
  return typeof score === 'number' && Number.isFinite(score) ? score : 0;
}

function optInDataIso(optIn: boolean, optInEm: Date | string | null | undefined): string | null {
  if (!optIn || optInEm == null || optInEm === '') return null;
  const date = asDate(optInEm);
  return date ? date.toISOString() : null;
}

export function buildFreeAnalysisMarketingPayload(
  input: FreeAnalysisMarketingInput,
): FreeAnalysisMarketingPayload {
  const { nome, sobrenome } = splitNome(input.nomeCompleto ?? '');
  const optIn = input.optIn === true;
  const analysisUrl = cleanUrl(input.analysisUrl);
  const offerUrl = cleanUrl(input.offerUrl);
  const checkoutUrl = cleanUrl(input.checkoutUrl);

  return {
    email: (input.email ?? '').trim().toLowerCase(),
    nome,
    sobrenome,
    analise_data: formatAnaliseData(input.concluidaEm),
    analise_id: (input.analiseId ?? '').trim(),
    score: asScore(input.score),
    origem: 'analise_gratis',
    opt_in: optIn,
    opt_in_data: optInDataIso(optIn, input.optInEm),
    utm_source: cleanUtm(input.utmSource),
    utm_medium: cleanUtm(input.utmMedium),
    utm_campaign: cleanUtm(input.utmCampaign),
    ...(analysisUrl ? { analysisUrl } : {}),
    ...(offerUrl ? { offerUrl } : {}),
    ...(checkoutUrl ? { checkoutUrl } : {}),
  };
}
