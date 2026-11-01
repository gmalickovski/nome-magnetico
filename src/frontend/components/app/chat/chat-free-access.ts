/**
 * Fluxo gratuito: retomada paga só com acesso confirmado no servidor.
 * Query string / localStorage nunca liberam o questionário.
 */

export type ChatPhase = 'onboarding' | 'free_paywall' | 'subscriber';

export interface ChatResumeChoicePayload {
  id: string;
  analysis_id: string | null;
  chosen_signature: string | null;
  source: 'card_pdf' | 'paywall_free' | null;
  pdf_generated: boolean;
}

export interface ChatResumeState {
  paid: boolean;
  choice?: ChatResumeChoicePayload;
}

/** Delays entre tentativas após a 1ª checagem imediata (poll curto pós-checkout). */
export const PAYMENT_ACCESS_POLL_DELAYS_MS = [1500, 2500, 4000] as const;

/** Backoff de até ~60s para retomada pós-checkout (?checkout=success&resume=1). */
export const CHAT_RESUME_POLL_DELAYS_MS = [2000, 4000, 6000, 10000, 15000, 20000] as const;

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

export function isChatResumeReturn(params: URLSearchParams): boolean {
  return isCheckoutSuccessReturn(params) && params.get('resume') === '1';
}

export function stripCheckoutSuccessQuery(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!isCheckoutSuccessReturn(url.searchParams) && url.searchParams.get('resume') !== '1') return;
  url.searchParams.delete('checkout');
  url.searchParams.delete('produto');
  url.searchParams.delete('resume');
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

export async function fetchChatResumeState(): Promise<ChatResumeState> {
  try {
    const res = await fetch('/api/chat-resume', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!res.ok) return { paid: false };
    const data = (await res.json()) as ChatResumeState;
    if (data?.paid !== true) return { paid: false };
    return {
      paid: true,
      choice: data.choice,
    };
  } catch {
    return { paid: false };
  }
}

export async function pollChatResumePaid(
  checkResume: () => Promise<ChatResumeState> = fetchChatResumeState,
  delaysMs: readonly number[] = CHAT_RESUME_POLL_DELAYS_MS,
  options?: { isVisible?: () => boolean; sleep?: (ms: number) => Promise<void> }
): Promise<ChatResumeState> {
  const sleep = options?.sleep ?? defaultSleep;
  const isVisible = options?.isVisible ?? (() => true);

  const initial = await checkResume();
  if (initial.paid) return initial;

  for (const delay of delaysMs) {
    while (!isVisible()) {
      await sleep(400);
    }
    await sleep(delay);
    if (!isVisible()) continue;
    const next = await checkResume();
    if (next.paid) return next;
  }

  return { paid: false };
}

export async function markChatResumePdfGenerated(choiceId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/chat-resume/mark-pdf', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choiceId }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { marked?: boolean };
    return data.marked === true;
  } catch {
    return false;
  }
}
