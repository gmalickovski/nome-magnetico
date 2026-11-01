/** Evita POST /api/analyze duplicado no mesmo par nascimento + nome social. */

let inflight: { key: string; promise: Promise<string | undefined> } | null = null;

export function buildChatPdfEnsureKey(
  birthName: string,
  birthDate: string,
  socialName: string
): string {
  return `${birthName.trim().toLowerCase()}|${birthDate.trim()}|${socialName.trim().toLowerCase()}`;
}

export function runChatPdfEnsureOnce(
  key: string,
  run: (signal: AbortSignal) => Promise<string | undefined>,
  signal?: AbortSignal
): Promise<string | undefined> {
  if (inflight?.key === key) {
    return inflight.promise;
  }

  const controller = new AbortController();
  const linkedSignal = signal;

  if (linkedSignal) {
    if (linkedSignal.aborted) {
      controller.abort();
    } else {
      linkedSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const promise = run(controller.signal).finally(() => {
    if (inflight?.key === key && inflight.promise === promise) {
      inflight = null;
    }
  });

  inflight = { key, promise };
  return promise;
}

export function clearChatPdfEnsureInflight(): void {
  inflight = null;
}
