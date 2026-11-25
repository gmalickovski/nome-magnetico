import { buildPublicUrl } from '../../../../utils/public-url';
import { CHAT_HARMONIZAR_PATH } from '../../../../shared/free-analysis-bridge';

/**
 * URL do botão do PDF grátis: vai direto ao chat de harmonizar o nome, com UTMs do PDF (Marketing DEV-275).
 * Sem nome, data nem e-mail na URL (DEV-343). Quem não tem sessão passa pelo login e volta ao chat.
 * O argumento fica por compatibilidade com quem chama e é ignorado de propósito.
 */
export function buildPotencialCtaUrl(_nomeCompleto?: string): string {
  const params = new URLSearchParams({
    utm_source: 'pdf',
    utm_medium: 'free',
    utm_campaign: 'nmpotencial',
  });
  return `${buildPublicUrl(CHAT_HARMONIZAR_PATH)}&${params.toString()}`;
}

export const POTENCIAL_CTA_URL_CURTA = 'nomemagnetico.com.br/nome-social';
