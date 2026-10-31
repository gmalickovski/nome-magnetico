/**
 * Fluxo gratuito: retomada paga só com acesso confirmado no servidor.
 * Query string / localStorage nunca liberam o questionário.
 */

export type ChatPhase = 'onboarding' | 'free_paywall' | 'subscriber';

/** Delays entre tentativas após a 1ª checagem imediata (poll curto pós-checkout). */
export const PAYMENT_ACCESS_POLL_DELAYS_MS = [1500, 2500, 4000] as const;

export function resolveChatPhaseFromSession(
  serverHasNomeSocialAccess: boolean,
  savedPhase: ChatPhase | undefined,
  birthConfirmed: boolean
): ChatPhase {
  if (serverHasNomeSocialAccess) return 'subscriber';
  if (!birthConfirmed) {
    return savedPhase === 'free_paywall' ? 'free_paywall' : 'onboarding';
  }
  if (savedPhase === 'subscriber') return 'free_paywall';
  return savedPhase === 'onboarding' ? 'onboarding' : 'free_paywall';
}

/** Indica retorno de checkout (não confirma pagamento — só dispara poll no servidor). */
export function isCheckoutSuccessReturn(params: URLSearchParams): boolean {
  if (params.get('checkout') !== 'success') return false;
  const produto = params.get('produto');
  return produto == null || produto === '' || produto === 'nome_social';
}

export function stripCheckoutSuccessQuery(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!isCheckoutSuccessReturn(url.searchParams)) return;
  url.searchParams.delete('checkout');
  url.searchParams.delete('produto');
  window.history.replaceState({}, '', url.toString());
}

export async function pollProductAccessActive(
  checkActive: () => Promise<boolean>,
  delaysMs: readonly number[] = PAYMENT_ACCESS_POLL_DELAYS_MS,
  options?: { isVisible?: () => boolean; sleep?: (ms: number) => Promise<void> }
): Promise<boolean> {
  const sleep = options?.sleep ?? defaultSleep;
  const isVisible = options?.isVisible ?? (() => true);

  if (await checkActive()) return true;

  for (const delay of delaysMs) {
    while (!isVisible()) {
      await sleep(400);
    }
    await sleep(delay);
    if (!isVisible()) continue;
    if (await checkActive()) return true;
  }

  return false;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchNomeSocialAccessActive(): Promise<boolean> {
  const res = await fetch('/api/access/product?product=nome_social', {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { active?: boolean };
  return data.active === true;
}
