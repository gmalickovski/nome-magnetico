export interface PreparedPdfDownload {
  href: string;
  filename: string;
  start: () => void;
  dispose: () => void;
}

/** Keep the Blob alive while a visible retry link still refers to it. */
export function preparePdfDownload(blob: Blob, filename: string): PreparedPdfDownload {
  const href = URL.createObjectURL(blob);
  let disposed = false;
  return {
    href,
    filename,
    start() {
      if (disposed) return;
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = filename;
      document.body.appendChild(anchor);
      try { anchor.click(); } finally { anchor.remove(); }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      URL.revokeObjectURL(href);
    },
  };
}

/** A locked screen must not consume the one attempt to dispatch the download. */
export function waitForPdfPageVisible(signal: AbortSignal): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  if (typeof document === 'undefined' || document.visibilityState !== 'hidden') return Promise.resolve(true);
  return new Promise(resolve => {
    const finish = (visible: boolean) => {
      document.removeEventListener('visibilitychange', onVisibility);
      signal.removeEventListener('abort', onAbort);
      resolve(visible);
    };
    const onVisibility = () => { if (document.visibilityState !== 'hidden') finish(true); };
    const onAbort = () => finish(false);
    document.addEventListener('visibilitychange', onVisibility);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

const pendingKey = (id: string) => `nm:pending-pdf:${id}`;
export function markPendingPdf(id: string): void {
  try { sessionStorage.setItem(pendingKey(id), String(Date.now())); } catch { /* storage may be unavailable */ }
}
export function clearPendingPdf(id: string): void {
  try { sessionStorage.removeItem(pendingKey(id)); } catch { /* storage may be unavailable */ }
}
export function hasPendingPdf(id: string): boolean {
  try {
    const value = sessionStorage.getItem(pendingKey(id));
    const started = Number(value);
    const valid = value !== null && Number.isFinite(started) && started > 0 && Date.now() - started < 24 * 60 * 60_000;
    if (!valid) clearPendingPdf(id);
    return valid;
  } catch { return false; }
}
