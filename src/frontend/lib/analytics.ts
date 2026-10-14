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
 * PostHog (em paralelo, taxonomia Growth): $pageview via SDK, analise_gratis_submit,
 * begin_checkout (payment_method, value, currency) no POST /api/create-checkout,
 * cta_click, scroll_depth, resultado_view, view_offer e purchase server-side.
 * O GA4 não muda.
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
  | 'analise_resultado_cta_click'
  | 'calculadora_submit'           // Widget calculadora auxiliar (não é o evento principal de funil)

  // --- Checkout ---
  | 'checkout_start'               // Evento interno (mantido para série histórica; use begin_checkout para GA4)
  | 'checkout_redirect_start'
  | 'checkout_failed'
  | 'coupon_applied'

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
  produto?: 'nome_social' | 'analise_gratuita';
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

const POSTHOG_CLIENT_EVENTS = new Set<AnalyticsEvent>(['analise_gratis_submit']);

export type CheckoutPaymentMethod = 'card' | 'pix';

function isAdminBrowser(): boolean {
  try {
    return window.localStorage?.getItem('nm-user-role') === 'admin';
  } catch {
    return false;
  }
}

function capturePostHog(event: AnalyticsEvent): void {
  if (!POSTHOG_CLIENT_EVENTS.has(event)) return;
  capturePostHogEvent(event);
}

/** Envia evento ao PostHog só se o SDK (ou o stub pós-consentimento) existir. */
export function capturePostHogEvent(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || isAdminBrowser()) return;
  try {
    window.posthog?.capture?.(event, properties);
  } catch {
    // analytics não pode quebrar a UI
  }
}

/** Início real do checkout, no POST /api/create-checkout. */
export function captureBeginCheckout(paymentMethod: CheckoutPaymentMethod, value: number): void {
  capturePostHogEvent('begin_checkout', {
    payment_method: paymentMethod,
    value,
    currency: 'BRL',
  });
}

/** Oferta/preço exibido. Uma vez por pageview. */
export function captureViewOffer(): void {
  if (typeof window === 'undefined' || window.__nm_view_offer_fired || isAdminBrowser()) return;

  const send = () => {
    if (window.__nm_view_offer_fired || isAdminBrowser()) return;
    if (typeof window.posthog?.capture !== 'function') return;
    window.__nm_view_offer_fired = true;
    try {
      window.posthog.capture('view_offer');
    } catch {
      window.__nm_view_offer_fired = false;
    }
  };

  send();
  if (!window.__nm_view_offer_fired) {
    window.addEventListener('nm-posthog-ready', send, { once: true });
  }
}

export function track(event: AnalyticsEvent, data?: EventData): void {
  if (typeof window === 'undefined') return;
  if (isAdminBrowser()) return;

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, data);
    }
  } catch {}

  try {
    capturePostHog(event);
  } catch {}
}

/** Liga o navegador anônimo ao id do Supabase, o mesmo distinct_id do purchase server-side. */
export function identifyUser(userId: string, email?: string | null): void {
  if (typeof window === 'undefined' || !userId || isAdminBrowser()) return;
  try {
    if (typeof window.nmIdentifyPostHog === 'function') {
      window.nmIdentifyPostHog(userId, email ?? undefined);
      return;
    }
    window.__nm_pending_identify = { userId, email: email ?? '' };
  } catch {}
}

export function resetAnalytics(): void {
  if (typeof window === 'undefined') return;
  try {
    window.__nm_pending_identify = undefined;
    window.posthog?.reset?.();
  } catch {}
}

declare global {
  interface Window {
    gtag?: (command: string, action: string | Date, params?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
    __nm_posthog_ready?: boolean;
    __nm_posthog_events?: boolean;
    __nm_view_offer_fired?: boolean;
    __nm_pending_identify?: { userId: string; email?: string };
    nmIdentifyPostHog?: (userId: string, email?: string) => void;
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify: (
        distinctId: string,
        properties?: Record<string, unknown>,
        propertiesSetOnce?: Record<string, unknown>,
      ) => void;
      reset: () => void;
      startSessionRecording?: () => void;
    };
  }
}
