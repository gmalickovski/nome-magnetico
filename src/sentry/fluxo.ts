/**
 * Tag `fluxo` para erros dos caminhos críticos.
 * A função de rota é pura; o capture só entra quando o helper é chamado.
 */
import * as Sentry from '@sentry/astro';

export type Fluxo = 'checkout' | 'stripe_webhook' | 'resultado_gratis' | 'notify_expiring' | 'leads';

/** Valores escalares. Não colocar e-mail, nome, token ou corpo de análise. */
export type FluxoExtra = Record<string, string | number | boolean | null>;

function normalizePath(pathname: string): string {
  const path = pathname.split('?')[0]?.split('#')[0] ?? pathname;
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

/**
 * Mapeia o pathname para o fluxo crítico.
 * `/api/analyze` gera a análise gratuita (a mesma rota também atende Nome Social).
 * `/api/analyze-live` é o cálculo ao vivo da prévia grátis.
 */
export function fluxoForPath(pathname: string): Fluxo | undefined {
  const path = normalizePath(pathname);

  if (path === '/api/create-checkout') return 'checkout';
  if (path === '/api/stripe-webhook') return 'stripe_webhook';
  if (path === '/api/internal/notify-expiring') return 'notify_expiring';
  if (path === '/api/save-lead' || path === '/obrigado') return 'leads';
  if (path === '/api/analyze' || path === '/api/analyze-live') return 'resultado_gratis';
  if (path === '/app/resultado' || path.startsWith('/app/resultado/')) return 'resultado_gratis';

  return undefined;
}

export function captureFluxoException(fluxo: Fluxo, error: unknown, extra?: FluxoExtra): void {
  Sentry.withScope((scope) => {
    scope.setTag('fluxo', fluxo);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}
