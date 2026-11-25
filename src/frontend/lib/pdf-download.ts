import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from './analytics';
import { preparePdfDownload } from './pdf-download-lifecycle';

export type PdfOverlayPhase =
  | 'idle'
  | 'preparing'
  | 'generating'
  | 'ready'
  | 'error'
  | 'email_not_confirmed';

export interface DownloadAnalysisPdfOptions {
  analysisId?: string;
  pdfUrl?: string;
  productType?: string;
  forceFreePdf?: boolean;
  signal?: AbortSignal;
}

export type DownloadAnalysisPdfResult =
  | { ok: true; filename: string }
  | { ok: false; reason: 'email_not_confirmed' };

export function buildPdfRequestUrl(
  analysisId?: string,
  pdfUrl?: string,
  forceFreePdf = false,
): string {
  const baseUrl = pdfUrl ?? `/api/generate-pdf?id=${encodeURIComponent(analysisId ?? '')}`;
  const withFormat =
    !pdfUrl && forceFreePdf && !/[?&]formato=/.test(baseUrl)
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}formato=gratuito`
      : baseUrl;
  return `${withFormat}${withFormat.includes('?') ? '&' : '?'}t=${Date.now()}`;
}

export function resolveDownloadFilename(
  contentDisposition: string,
  productType = 'nome_social',
): string {
  const match = contentDisposition.match(/filename="?([^";]+)"?/i);
  const base = match?.[1] ?? `analise-${productType}-nome-magnetico.pdf`;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return base.toLowerCase().endsWith('.pdf') ? base.replace(/\.pdf$/i, `-${timeStr}.pdf`) : `${base}-${timeStr}.pdf`;
}

/**
 * Baixa o PDF da análise via fetch autenticada e dispara o download no navegador
 * (ou abre em nova aba em WebViews sociais onde downloads de Blob falham).
 */
export async function downloadAnalysisPdf({
  analysisId,
  pdfUrl,
  productType = 'nome_social',
  forceFreePdf = false,
  signal,
}: DownloadAnalysisPdfOptions): Promise<DownloadAnalysisPdfResult> {
  if (!pdfUrl && !analysisId) {
    throw new Error('pdf_missing_id');
  }

  const resolvedUrl = buildPdfRequestUrl(analysisId, pdfUrl, forceFreePdf);
  const res = await fetch(resolvedUrl, {
    cache: 'no-store',
    credentials: 'same-origin',
    signal,
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Accept: 'application/json, application/pdf',
    },
  });

  if (res.status === 403) {
    let payload: { error?: string } = {};
    try {
      payload = await res.json();
    } catch {
      payload = {};
    }
    if (payload.error === 'email_not_confirmed') {
      return { ok: false, reason: 'email_not_confirmed' };
    }
  }

  if (!res.ok) {
    throw new Error('pdf_error');
  }

  const filename = resolveDownloadFilename(
    res.headers.get('Content-Disposition') ?? '',
    productType,
  );
  const blob = await res.blob();
  const isWebView = /FBAN|FBAV|Instagram|LinkedInApp|Twitter|WhatsApp/i.test(
    navigator.userAgent,
  );

  if (isWebView) {
    window.open(resolvedUrl, '_blank');
  } else {
    const download = preparePdfDownload(blob, filename);
    download.start();
    // A browser may consume the Blob asynchronously, especially on mobile.
    window.setTimeout(download.dispose, 60_000);
  }

  return { ok: true, filename };
}

export interface StartPdfDownloadParams {
  analysisId?: string;
  pdfUrl?: string;
  productType?: string;
  forceFreePdf?: boolean;
  onSuccess?: () => void;
}

export function usePdfDownloadOverlay() {
  const [phase, setPhase] = useState<PdfOverlayPhase>('idle');
  const lockRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastParamsRef = useRef<StartPdfDownloadParams | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const startDownload = useCallback(async (params: StartPdfDownloadParams): Promise<boolean> => {
    if (lockRef.current) return false;
    lockRef.current = true;
    lastParamsRef.current = params;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('generating');
    try {
      const result = await downloadAnalysisPdf({
        analysisId: params.analysisId,
        pdfUrl: params.pdfUrl,
        productType: params.productType,
        forceFreePdf: params.forceFreePdf,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return false;

      if (!result.ok) {
        setPhase('email_not_confirmed');
        return false;
      }

      setPhase('idle');
      if (params.productType) {
        track('pdf_downloaded', { produto: params.productType as never });
      }
      params.onSuccess?.();
      return true;
    } catch {
      if (controller.signal.aborted) {
        setPhase('idle');
        return false;
      }
      setPhase('error');
      return false;
    } finally {
      lockRef.current = false;
    }
  }, []);

  const retry = useCallback(() => {
    const last = lastParamsRef.current;
    if (!last) {
      setPhase('idle');
      return;
    }
    void startDownload(last);
  }, [startDownload]);

  const dismiss = useCallback(() => {
    setPhase((prev) => (prev === 'error' || prev === 'email_not_confirmed' ? 'idle' : prev));
  }, []);

  return {
    phase,
    isDownloading: phase === 'preparing' || phase === 'generating',
    startDownload,
    retry,
    dismiss,
  };
}
