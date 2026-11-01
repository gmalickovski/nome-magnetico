import { capturePostHogEvent } from '../../../lib/analytics.js';
import { buildNomeSocialCheckoutHref } from './chat-pdf-utils.js';

export type PaywallSurface = 'bubble' | 'sticky' | 'panel' | 'dock';
export type PaywallDevice = 'mobile' | 'desktop';

export function paywallDevice(): PaywallDevice {
  if (typeof window === 'undefined') return 'desktop';
  return window.matchMedia('(min-width: 768px)').matches ? 'desktop' : 'mobile';
}

export function buildPaywallCheckoutHref(options?: {
  chosenSignature?: string | null;
  analysisId?: string | null;
}): string {
  return buildNomeSocialCheckoutHref({
    campaign: 'paywall_free',
    chosenSignature: options?.chosenSignature,
    analysisId: options?.analysisId,
  });
}

export async function fetchNomeSocialPriceLabel(): Promise<string> {
  try {
    const res = await fetch('/api/pricing/config');
    if (!res.ok) return '';
    const data = await res.json();
    const info = data?.products?.nome_social ?? data?.prices?.nome_social;
    if (info?.formatted) return String(info.formatted);
    if (info?.final_cents) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        info.final_cents / 100
      );
    }
  } catch {
    /* ignore */
  }
  return '';
}

export function trackPaywallShown(surface: PaywallSurface): void {
  capturePostHogEvent('nm_paywall_shown', { surface, device: paywallDevice() });
}

export function trackPaywallCtaClicked(surface: PaywallSurface): void {
  capturePostHogEvent('nm_paywall_cta_clicked', { surface, device: paywallDevice() });
}

export function trackFreePdfClicked(surface: PaywallSurface): void {
  capturePostHogEvent('nm_free_pdf_clicked', { surface });
}

export function trackPaywallDismissed(): void {
  capturePostHogEvent('nm_paywall_dismissed', { device: paywallDevice() });
}

/** Até 3 destaques do motor (diagramNodes) para o card gratuito. */
export function pickMotorHighlights(
  items: Array<{ label: string; value: string }>
): Array<{ label: string; value: string }> {
  return items.filter((i) => i.label?.trim() && i.value?.trim()).slice(0, 3);
}
