import React, { useCallback, useEffect, useRef, useState } from 'react';
import { capturePostHogEvent } from '../../../lib/analytics.js';
import { fetchWithAuth } from '../../../lib/auth-fetch.js';
import { useToast, ToastContainer } from '../../ui/Toast.js';
import { IconFileDown, IconLockOpen } from './MobileChatDockIcons.js';
import { DockTooltipButton } from './DockTooltipButton.js';
import {
  buildNomeSocialCheckoutHref,
  scoreBucket,
  truncateDisplayName,
  type PdfDevice,
  type PdfSurface,
} from './chat-pdf-utils.js';
import {
  ChatPdfPreparingOverlay,
  type ChatPdfOverlayPhase,
} from './ChatPdfPreparingOverlay.js';

export type ChatPdfPhase = 'idle' | 'loading' | 'ready' | 'error' | 'email_gate';

export interface ChatPdfCtaModel {
  visible: boolean;
  phase: ChatPdfPhase;
  displayName: string;
  assinaturaLabel: string;
  suggestionRank: number;
  score: number;
  isFree: boolean;
  emailConfirmed: boolean;
  analysisId?: string;
  priceLabel: string;
  screen: string;
}

const PDF_STATUS_POLL_DELAYS_MS = [1500, 2500, 4000, 5000] as const;

function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

export async function waitAnalysisCompleteForPdf(
  analysisId: string,
  signal: AbortSignal,
  delaysMs: readonly number[] = PDF_STATUS_POLL_DELAYS_MS
): Promise<boolean> {
  for (const delay of delaysMs) {
    if (signal.aborted) return false;
    const statusRes = await fetchWithAuth(
      `/api/analysis-status?id=${encodeURIComponent(analysisId)}`,
      { signal }
    );
    if (signal.aborted) return false;
    if (statusRes.ok) {
      const statusData = (await statusRes.json()) as { status?: string };
      if (statusData.status === 'complete' || statusData.status === 'done') {
        return true;
      }
      if (statusData.status === 'error') {
        throw new Error('pdf_error');
      }
    }
    await abortableSleep(delay, signal);
  }
  return false;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function fetchPriceLabel(): Promise<string> {
  try {
    const res = await fetch('/api/pricing');
    if (!res.ok) return '';
    const data = await res.json();
    const info = data?.prices?.nome_social;
    if (info?.formatted) return String(info.formatted);
    if (info?.cents) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        info.cents / 100
      );
    }
  } catch {
    /* ignore */
  }
  return '';
}

export function useChatPdfCta(input: {
  suggestionSelected: boolean;
  selectedNome: string | null;
  selectedScore: number;
  suggestionRank: number;
  analysisId?: string;
  /** Cria/persiste análise paga quando o chat ainda não tem analysisId. */
  ensureAnalysisId?: (signal: AbortSignal) => Promise<string | undefined>;
  isFree: boolean;
  emailConfirmed: boolean;
  screen: string;
}): {
  model: ChatPdfCtaModel;
  onDockClick: () => void;
  onStickyClick: () => void;
  resendEmail: () => Promise<void>;
  resending: boolean;
  toastUi: React.ReactNode;
  pdfOverlayUi: React.ReactNode;
} {
  const [phase, setPhase] = useState<ChatPdfPhase>('idle');
  const [overlayPhase, setOverlayPhase] = useState<ChatPdfOverlayPhase>('idle');
  const [priceLabel, setPriceLabel] = useState('');
  const [resending, setResending] = useState(false);
  const shownRef = useRef(false);
  const glowDoneRef = useRef(false);
  const pdfRunLockRef = useRef(false);
  const pdfAbortRef = useRef<AbortController | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    return () => {
      pdfAbortRef.current?.abort();
    };
  }, []);

  const visible = input.suggestionSelected && Boolean(input.selectedNome?.trim());
  const displayName = input.selectedNome?.trim() ?? '';

  useEffect(() => {
    if (input.isFree) {
      void fetchPriceLabel().then(setPriceLabel);
    }
  }, [input.isFree]);

  useEffect(() => {
    if (!visible) {
      shownRef.current = false;
      setPhase('idle');
      return;
    }
    if (!input.emailConfirmed) {
      setPhase('email_gate');
    } else {
      setPhase((p) => (p === 'loading' || p === 'ready' || p === 'error' ? p : 'idle'));
    }
  }, [visible, input.emailConfirmed, displayName]);

  useEffect(() => {
    if (!visible || shownRef.current) return;
    shownRef.current = true;
    const device: PdfDevice = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
      ? 'desktop'
      : 'mobile';
    capturePostHogEvent('nm_pdf_cta_shown', {
      screen: input.screen,
      device,
      surface: device === 'mobile' ? 'dock' : 'sticky',
      is_free: input.isFree,
      suggestion_rank: input.suggestionRank,
      score_bucket: scoreBucket(input.selectedScore),
    });
  }, [visible, input.screen, input.isFree, input.suggestionRank, input.selectedScore]);

  const trackClick = useCallback(
    (surface: PdfSurface) => {
      const device: PdfDevice = surface === 'sticky' ? 'desktop' : 'mobile';
      capturePostHogEvent('nm_pdf_cta_clicked', {
        screen: input.screen,
        device,
        surface,
        is_free: input.isFree,
        suggestion_rank: input.suggestionRank,
        score_bucket: scoreBucket(input.selectedScore),
      });
    },
    [input.screen, input.isFree, input.suggestionRank, input.selectedScore]
  );

  const runPaidPdf = useCallback(async () => {
    if (pdfRunLockRef.current) return;
    pdfRunLockRef.current = true;
    pdfAbortRef.current?.abort();
    const controller = new AbortController();
    pdfAbortRef.current = controller;
    const { signal } = controller;

    setPhase('loading');
    setOverlayPhase('preparing');
    const started = performance.now();
    try {
      let analysisId = input.analysisId;
      if (!analysisId && input.ensureAnalysisId) {
        analysisId = await input.ensureAnalysisId(signal);
      }
      if (signal.aborted) return;
      if (!analysisId) {
        setPhase('error');
        setOverlayPhase('error');
        addToast('Salve ou conclua a análise antes de gerar o PDF.', 'warning');
        return;
      }
      setOverlayPhase('generating');
      const buildPdfUrl = () =>
        `/api/generate-pdf?id=${encodeURIComponent(analysisId!)}&t=${Date.now()}`;
      let res = await fetchWithAuth(buildPdfUrl(), { signal });
      if (signal.aborted) return;
      if (res.status === 202) {
        const ready = await waitAnalysisCompleteForPdf(analysisId, signal);
        if (signal.aborted) return;
        if (!ready) throw new Error('pdf_not_ready');
        res = await fetchWithAuth(buildPdfUrl(), { signal });
        if (signal.aborted) return;
      }
      if (res.status === 202) throw new Error('pdf_not_ready');
      if (!res.ok) throw new Error('pdf_error');
      const blob = await res.blob();
      const cd = res.headers.get('content-disposition') ?? '';
      const match = cd.match(/filename="?([^";]+)"?/i);
      let filename = match?.[1] ?? 'analise-nome-social.pdf';
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
      setPhase('ready');
      setOverlayPhase('idle');
      capturePostHogEvent('nm_pdf_generated', {
        duration_ms: Math.round(performance.now() - started),
        suggestion_rank: input.suggestionRank,
      });
    } catch (err) {
      if (signal.aborted) {
        setOverlayPhase('idle');
        setPhase('idle');
        return;
      }
      setPhase('error');
      setOverlayPhase('error');
      capturePostHogEvent('nm_pdf_failed', {
        error: err instanceof Error ? err.message : 'unknown',
      });
    } finally {
      pdfRunLockRef.current = false;
    }
  }, [input.analysisId, input.ensureAnalysisId, input.suggestionRank, addToast]);

  const onStickyClick = useCallback(() => {
    if (!visible) return;
    if (phase === 'email_gate' || !input.emailConfirmed) return;

    if (input.isFree) {
      trackClick('sticky');
      capturePostHogEvent('nm_unlock_clicked', {
        surface: 'sticky',
        suggestion_rank: input.suggestionRank,
      });
      window.location.href = buildNomeSocialCheckoutHref();
      return;
    }

    trackClick('sticky');
    void runPaidPdf();
  }, [
    visible,
    phase,
    input.emailConfirmed,
    input.isFree,
    input.suggestionRank,
    trackClick,
    runPaidPdf,
  ]);

  const onDockClick = useCallback(() => {
    if (!visible) return;
    if (phase === 'email_gate' || !input.emailConfirmed) return;

    if (input.isFree) {
      trackClick('dock');
      capturePostHogEvent('nm_unlock_clicked', {
        surface: 'dock',
        suggestion_rank: input.suggestionRank,
      });
      window.location.href = buildNomeSocialCheckoutHref();
      return;
    }

    trackClick('dock');
    void runPaidPdf();
  }, [
    visible,
    phase,
    input.emailConfirmed,
    input.isFree,
    input.suggestionRank,
    trackClick,
    runPaidPdf,
  ]);

  const resendEmail = useCallback(async () => {
    setResending(true);
    try {
      const res = await fetchWithAuth('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect: '/app/analise/nome-social' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao reenviar');
      addToast('Link de confirmação reenviado. Verifique sua caixa de entrada.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao reenviar e-mail.', 'error');
    } finally {
      setResending(false);
    }
  }, [addToast]);

  const model: ChatPdfCtaModel = {
    visible,
    phase,
    displayName,
    assinaturaLabel: displayName,
    suggestionRank: input.suggestionRank,
    score: input.selectedScore,
    isFree: input.isFree,
    emailConfirmed: input.emailConfirmed,
    analysisId: input.analysisId,
    priceLabel,
    screen: input.screen,
  };

  const pdfOverlayUi = (
    <ChatPdfPreparingOverlay
      phase={overlayPhase}
      onRetry={() => {
        setOverlayPhase('idle');
        void runPaidPdf();
      }}
      onDismissError={() => {
        setOverlayPhase('idle');
        setPhase((p) => (p === 'error' ? 'idle' : p));
      }}
    />
  );

  return {
    model,
    onDockClick,
    onStickyClick,
    resendEmail,
    resending,
    toastUi: <ToastContainer toasts={toasts} onRemove={removeToast} />,
    pdfOverlayUi,
  };
}

export interface ChatPdfStickyDesktopProps {
  model: ChatPdfCtaModel;
  onClick: () => void;
  onResendEmail: () => void;
  resending: boolean;
}

export function ChatPdfStickyDesktop({
  model,
  onClick,
  onResendEmail,
  resending,
}: ChatPdfStickyDesktopProps) {
  if (!model.visible) return null;
  const reduced = prefersReducedMotion();
  const nomeTrunc = truncateDisplayName(model.displayName);
  const isError = model.phase === 'error';
  const isLoading = model.phase === 'loading';

  if (!model.emailConfirmed || model.phase === 'email_gate') {
    return (
      <div className="hidden md:flex fixed bottom-6 left-1/2 z-[75] w-full max-w-xl -translate-x-1/2 px-4 pointer-events-none justify-center">
        <div
          className="pointer-events-auto w-full max-w-lg rounded-full border-2 border-[#F59E0B] bg-[#131313]/95 px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          role="status"
        >
          <p className="text-sm font-semibold text-[#F59E0B] flex-1 text-center sm:text-left">
            Confirme seu e-mail para gerar o PDF
          </p>
          <button
            type="button"
            onClick={onResendEmail}
            disabled={resending}
            className="shrink-0 rounded-full border border-[#F59E0B]/60 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#F59E0B] hover:bg-[#F59E0B]/10 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[3px]"
          >
            {resending ? 'Enviando…' : 'Reenviar e-mail'}
          </button>
        </div>
      </div>
    );
  }

  const title = model.isFree
    ? `Desbloquear análise de ${nomeTrunc}${model.priceLabel ? ` · ${model.priceLabel}` : ''}`
    : model.phase === 'ready'
      ? 'Baixar PDF'
      : isLoading
        ? 'Preparando o seu PDF'
        : `Gerar análise completa de ${nomeTrunc}`;

  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 z-[75] w-full max-w-xl -translate-x-1/2 px-4 pointer-events-none justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        aria-busy={isLoading}
        className={`pointer-events-auto w-full max-w-xl min-h-[52px] rounded-full bg-[#D4AF37] px-6 py-3 text-left shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-opacity duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[3px] disabled:opacity-90 ${
          isError ? 'ring-2 ring-[#FF6B6B]' : ''
        } ${reduced ? 'transition-opacity duration-[120ms]' : ''}`}
      >
        <span className="flex items-center justify-center gap-2">
          {isLoading && (
            <svg
              className="h-4 w-4 animate-spin text-[#111111]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          <span
            key={nomeTrunc}
            className={`font-semibold text-[#111111] text-sm sm:text-base ${
              reduced ? 'transition-opacity duration-[120ms]' : 'transition-opacity duration-150'
            }`}
          >
            {title}
          </span>
        </span>
        {!model.isFree && model.phase !== 'ready' && !isLoading && (
          <span className="nm-caption block text-center text-[#111111]/80 mt-0.5">
            PDF com a assinatura {truncateDisplayName(model.assinaturaLabel, 32)}, pronto para salvar e
            imprimir.
          </span>
        )}
        {isError && (
          <span className="nm-caption block text-center text-[#FF6B6B] mt-0.5 font-semibold">
            Tentar de novo
          </span>
        )}
      </button>
    </div>
  );
}

export interface ChatPdfDockCircleProps {
  model: ChatPdfCtaModel;
  onClick: () => void;
  exiting?: boolean;
  onGlowDone?: () => void;
  tooltip?: string;
}

export function ChatPdfDockCircle({
  model,
  onClick,
  exiting = false,
  onGlowDone,
  tooltip = 'Baixar PDF',
}: ChatPdfDockCircleProps) {
  if (!model.visible && !exiting) return null;
  const reduced = prefersReducedMotion();
  const Icon = model.isFree ? IconLockOpen : IconFileDown;
  const isLoading = model.phase === 'loading';
  const label = model.isFree
    ? 'Desbloquear análise completa'
    : model.phase === 'ready'
      ? 'Baixar PDF'
      : isLoading
        ? 'Preparando o seu PDF'
        : 'Gerar análise completa em PDF';

  return (
    <DockTooltipButton
      tooltip={tooltip}
      onClick={onClick}
      disabled={isLoading || !model.emailConfirmed}
      aria-label={label}
      aria-busy={isLoading}
      onAnimationEnd={() => {
        if (!exiting) onGlowDone?.();
      }}
      className={`mobile-chat-dock-btn mobile-chat-dock-pdf-circle relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-[#111111] active:scale-[0.92] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[3px] disabled:opacity-80 ${
        exiting
          ? reduced
            ? 'mobile-chat-dock-pdf-exit-fade'
            : 'mobile-chat-dock-pdf-exit'
          : reduced
            ? 'mobile-chat-dock-pdf-enter-fade'
            : 'mobile-chat-dock-pdf-enter'
      }`}
    >
      {isLoading ? (
        <svg
          className="h-[18px] w-[18px] animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <Icon className="text-[#111111]" />
      )}
    </DockTooltipButton>
  );
}
