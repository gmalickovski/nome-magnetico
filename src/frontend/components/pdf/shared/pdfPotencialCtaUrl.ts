import { buildPublicUrl } from '../../../../utils/public-url';

/** URL da landing Nome Social com UTMs do PDF grátis (Marketing DEV-275). */
export function buildPotencialCtaUrl(nomeCompleto?: string): string {
  const params = new URLSearchParams({
    utm_source: 'pdf',
    utm_medium: 'free',
    utm_campaign: 'nmpotencial',
  });
  const trimmed = nomeCompleto?.trim();
  if (trimmed && trimmed.length >= 2) {
    params.set('nome', trimmed);
  }
  return `${buildPublicUrl('/nome-social')}?${params.toString()}`;
}

export const POTENCIAL_CTA_URL_CURTA = 'nomemagnetico.com.br/nome-social';
