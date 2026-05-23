/**
 * Wrapper tipado para eventos customizados do Nome Magnetico no GA4.
 */

type AnalyticsEvent =
  | 'cta_hero_click'
  | 'cta_produto_click'
  | 'cta_nome_social_hero'
  | 'cta_nome_bebe_hero'
  | 'cta_nome_empresarial_hero'
  | 'pricing_view'
  | 'precos_view'
  | 'lp_view'
  | 'checkout_start'
  | 'checkout_redirect_start'
  | 'checkout_failed'
  | 'coupon_applied'
  | 'pix_start'
  | 'pix_failed'
  | 'purchase_complete'
  | 'report_generated'
  | 'pdf_downloaded'
  | 'upsell_view'
  | 'cta_pdf_download_upsell_nome_social'
  | 'cta_resultado_gratis_upsell_contextual'
  | 'cta_resultado_gratis_upsell_excelente'
  | 'cta_resultado_gratis_upsell_excelente_melhorias'
  | 'cta_resultado_gratis_upsell_aceitavel'
  | 'cta_resultado_gratis_upsell'
  | 'analise_gratis_submit'
  | 'preliminary_analysis_submit'
  | 'analise_resultado_cta_click'
  | 'calculadora_submit'
  | 'begin_checkout'
  | 'blog_view'
  | 'blog_cta_click'
  | 'blog_cta_lp_click'
  | 'blog_article_view';

interface EventData {
  produto?: 'nome_social' | 'nome_bebe' | 'nome_empresa' | 'analise_gratuita';
  posicao?: string;
  preco?: number;
  promocao?: string | null;
  codigo_cupom?: string;
  desconto?: number;
  valor?: number;
  tempo_segundos?: number;
  origem?: string;
  erro?: string;
  [key: string]: unknown;
}

export function track(event: AnalyticsEvent, data?: EventData): void {
  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage && window.localStorage.getItem('nm-user-role') === 'admin') {
        // Ignora envio de analytics para administradores
        return;
      }
    } catch {}

    if (typeof window.gtag === 'function') {
      window.gtag('event', event, data);
    }
  }
}

declare global {
  interface Window {
    gtag?: (command: string, action: string | Date, params?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
  }
}
