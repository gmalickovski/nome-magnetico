/**
 * Wrapper tipado para eventos customizados do Nome Magnetico no GA4.
 *
 * FUNIL PRINCIPAL (novo fluxo email-first, desde jun/2026):
 *   sessão
 *   → analise_gratis_submit  (form /analise-gratuita: nome + data + email → envia PDF por e-mail, sem cadastro)
 *   → pdf_downloaded         (usuário baixa PDF pela área logada, se criar conta depois)
 *   → begin_checkout         (padrão GA4 e-commerce — alimenta Smart Bidding)
 *   → purchase               (server-side Measurement Protocol — fonte de verdade de receita)
 *
 * NOTA: preliminary_analysis_submit foi removido do fluxo principal em jun/2026.
 * O antigo fluxo de "preview + criação de conta" foi substituído pelo fluxo email-first.
 * O evento calculadora_submit (CalculadoraGratis) continua existindo como widget auxiliar.
 */

type AnalyticsEvent =
  // --- Funil principal ---
  | 'analise_gratis_submit'       // Lead capturado: form email-first submetido com sucesso (nome + data + email)
  | 'pdf_downloaded'               // Download de PDF confirmado
  | 'begin_checkout'               // Início do checkout (padrão GA4 e-commerce)
  | 'purchase_complete'            // Retorno visual pós-checkout (UX only — receita vem do Measurement Protocol server-side)

  // --- Blog ---
  | 'blog_view'                    // Acesso à home do blog /blog
  | 'blog_article_view'            // Leitura de artigo individual /blog/[slug]
  | 'blog_cta_click'               // Clique em CTA dentro de artigo (params: destination_url, origin_article)
  | 'blog_cta_lp_click'            // Clique em CTA do blog para landing page

  // --- CTAs e navegação ---
  | 'cta_hero_click'
  | 'cta_produto_click'
  | 'cta_nome_social_hero'
  | 'cta_nome_bebe_hero'
  | 'cta_nome_empresarial_hero'
  | 'analise_resultado_cta_click'
  | 'calculadora_submit'           // Widget calculadora auxiliar (não é o evento principal de funil)

  // --- Checkout ---
  | 'checkout_start'               // Evento interno (mantido para série histórica; use begin_checkout para GA4)
  | 'checkout_redirect_start'
  | 'checkout_failed'
  | 'coupon_applied'
  | 'pix_start'
  | 'pix_failed'

  // --- Pricing e visualizações ---
  | 'pricing_view'
  | 'precos_view'
  | 'lp_view'

  // --- Upsell ---
  | 'upsell_view'
  | 'report_generated'
  | 'cta_pdf_download_upsell_nome_social'
  | 'cta_resultado_gratis_upsell_contextual'
  | 'cta_resultado_gratis_upsell_excelente'
  | 'cta_resultado_gratis_upsell_excelente_melhorias'
  | 'cta_resultado_gratis_upsell_aceitavel'
  | 'cta_resultado_gratis_upsell'

  // --- Legado (não disparados no fluxo atual — mantidos para não quebrar chamadas existentes) ---
  | 'preliminary_analysis_submit'; // DEPRECATED jun/2026: substituído por analise_gratis_submit no novo fluxo email-first

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
