export function truncateDisplayName(name: string, maxLen = 24): string {
  const t = name.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

export function scoreBucket(score: number | undefined | null): string {
  const s = score ?? 0;
  if (s >= 90) return '90_100';
  if (s >= 70) return '70_89';
  if (s >= 40) return '40_69';
  if (s >= 20) return '20_39';
  return '0_19';
}

export type ChatCheckoutSource = 'card_pdf' | 'paywall_free';

export interface BuildNomeSocialCheckoutHrefOptions {
  campaign?: ChatCheckoutSource;
  chosenSignature?: string | null;
  analysisId?: string | null;
}

export function buildNomeSocialCheckoutHref(options?: BuildNomeSocialCheckoutHrefOptions): string {
  const campaign: ChatCheckoutSource = options?.campaign ?? 'card_pdf';
  const params = new URLSearchParams({
    produto: 'nome_social',
    utm_source: 'app_chat',
    utm_campaign: campaign,
    source: campaign,
  });
  const chosen = options?.chosenSignature?.trim();
  if (chosen) {
    params.set('chosen_signature', chosen.slice(0, 80));
  }
  const analysisId = options?.analysisId?.trim();
  if (analysisId) {
    params.set('analysis_id', analysisId);
  }
  return `/comprar?${params.toString()}`;
}

export type PdfDevice = 'mobile' | 'desktop';

export type PdfSurface = 'dock' | 'sticky';

/** Limite superior exibido no overlay para PDFs completos (~60 páginas em duas passadas). */
export const CHAT_PDF_PREP_TIME_LABEL = 'de 1 a 3 minutos';

/** Tempo típico esperado após persistência sem LLM (ms). */
export const CHAT_PDF_TYPICAL_TOTAL_MS = 50_000;
