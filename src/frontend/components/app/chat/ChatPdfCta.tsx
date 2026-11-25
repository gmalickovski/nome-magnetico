import React, { useCallback, useEffect, useRef, useState } from 'react';
import { capturePostHogEvent } from '../../../lib/analytics.js';
import { fetchWithAuth } from '../../../lib/auth-fetch.js';
import { resolveDownloadFilename } from '../../../lib/pdf-download.js';
import { clearPendingPdf, hasPendingPdf, markPendingPdf, preparePdfDownload, waitForPdfPageVisible, type PreparedPdfDownload } from '../../../lib/pdf-download-lifecycle.js';
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
import {
  ChatPdfConcludeModal,
  type ConcludeBusyAction,
} from './ChatPdfConcludeModal.js';

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

const PDF_STATUS_POLL_DELAYS_MS = [5000, 10000, 20000, 40000, 60000] as const;
const SAVE_STATUS_POLL_DELAYS_MS = PDF_STATUS_POLL_DELAYS_MS;

function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const finish = () => { window.clearTimeout(timer); signal?.removeEventListener('abort', finish); resolve(); };
    const timer = window.setTimeout(finish, ms);
    signal?.addEventListener('abort', finish, { once: true });
  });
}

export async function waitAnalysisCompleteForPdf(
  analysisId: string,
  signal: AbortSignal,
  delaysMs: readonly number[] = PDF_STATUS_POLL_DELAYS_MS
): Promise<boolean> {
  const deadline = Date.now() + 180_000;
  for (const delay of delaysMs) {
    if (!(await waitForPdfPageVisible(signal)) || Date.now() >= deadline) return false;
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
  /** Callback acionado após salvar a análise em "Salvar". */
  onSaveSuccess?: (analysisId: string) => void;
  /** Navegação customizada para o dashboard após concluir (opcional para testes). */
  onNavigateToDashboard?: (analysisId: string) => void;
  /** Callback acionado após a geração e download bem-sucedidos da análise/PDF. */
  onPdfSuccess?: (analysisId?: string) => void;
  isFree: boolean;
  emailConfirmed: boolean;
  screen: string;
}): {
  model: ChatPdfCtaModel;
  onDockClick: () => void;
  onStickyClick: () => void;
  triggerAutoPdf: () => Promise<boolean>;
  resendEmail: () => Promise<void>;
  resending: boolean;
  toastUi: React.ReactNode;
  pdfOverlayUi: React.ReactNode;
} {
  const [phase, setPhase] = useState<ChatPdfPhase>('idle');
  const [overlayPhase, setOverlayPhase] = useState<ChatPdfOverlayPhase>('idle');
  const [concludeModalOpen, setConcludeModalOpen] = useState(false);
  const [concludeBusyAction, setConcludeBusyAction] = useState<ConcludeBusyAction>(null);
  const [concludeError, setConcludeError] = useState<string | null>(null);
  const [priceLabel, setPriceLabel] = useState('');
  const [resending, setResending] = useState(false);
  const shownRef = useRef(false);
  const pdfRunLockRef = useRef(false);
  const pdfAbortRef = useRef<AbortController | null>(null);
  const preparedDownloadRef = useRef<PreparedPdfDownload | null>(null);
  const savedPdfRef = useRef<{ id: string; name: string } | null>(null);
  const [readyDownload, setReadyDownload] = useState<PreparedPdfDownload | null>(null);
  const prevDisplayNameRef = useRef('');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    return () => {
      pdfAbortRef.current?.abort();
      preparedDownloadRef.current?.dispose();
    };
  }, []);

  const redirectToDashboard = useCallback(
    (analysisId: string) => {
      if (input.onNavigateToDashboard) {
        input.onNavigateToDashboard(analysisId);
        return;
      }
      if (typeof window === 'undefined') return;
      window.location.href = '/app';
    },
    [input.onNavigateToDashboard]
  );

  const visible = input.suggestionSelected && Boolean(input.selectedNome?.trim());
  const displayName = input.selectedNome?.trim() ?? '';



  useEffect(() => {
    if (input.isFree) {
      void fetchPriceLabel().then(setPriceLabel);
    }
  }, [input.isFree]);

  useEffect(() => {
    const nameChanged = prevDisplayNameRef.current !== displayName;
    prevDisplayNameRef.current = displayName;
    if (!visible) {
      shownRef.current = false;
      setPhase('idle');
      setConcludeModalOpen(false);
      setConcludeError(null);
      return;
    }
    if (!input.emailConfirmed) {
      setPhase('email_gate');
      setConcludeModalOpen(false);
    } else if (nameChanged) {
      preparedDownloadRef.current?.dispose();
      preparedDownloadRef.current = null;
      setReadyDownload(null);
      setOverlayPhase('idle');
      setPhase('idle');
      setConcludeModalOpen(false);
      setConcludeError(null);
    } else {
      setPhase((p) => (p === 'loading' || p === 'ready' || p === 'error' ? p : 'idle'));
    }
  }, [visible, input.emailConfirmed, displayName]);

  useEffect(() => {
    if (!visible || !input.analysisId || pdfRunLockRef.current) return;
    if (hasPendingPdf(input.analysisId)) {
      savedPdfRef.current = { id: input.analysisId, name: displayName };
      setConcludeError('Sua análise está salva. O download ficou pendente; toque em Tentar de novo para continuar.');
      setOverlayPhase('error');
      setPhase('error');
    }
  }, [input.analysisId, visible, displayName]);

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

  const runPaidPdf = useCallback(async (opts?: { auto?: boolean }): Promise<boolean> => {
    if (pdfRunLockRef.current) return false;
    pdfRunLockRef.current = true;
    pdfAbortRef.current?.abort();
    const controller = new AbortController();
    pdfAbortRef.current = controller;
    const { signal } = controller;

    setConcludeError(null);
    preparedDownloadRef.current?.dispose();
    preparedDownloadRef.current = null;
    setReadyDownload(null);
    setConcludeBusyAction('pdf');
    setPhase('loading');
    setOverlayPhase('preparing');
    const started = performance.now();
    try {
      let analysisId = input.analysisId ?? (savedPdfRef.current?.name === displayName ? savedPdfRef.current.id : undefined);
      if (!analysisId && input.ensureAnalysisId) {
        analysisId = await input.ensureAnalysisId(signal);
      }
      if (signal.aborted) return false;
      if (!analysisId) {
        setPhase('error');
        setOverlayPhase('error');
        addToast('Salve ou conclua a análise antes de gerar o PDF.', 'warning');
        return false;
      }
      savedPdfRef.current = { id: analysisId, name: displayName };
      markPendingPdf(analysisId);
      setOverlayPhase('generating');
      const buildPdfUrl = () =>
        `/api/generate-pdf?id=${encodeURIComponent(analysisId!)}&t=${Date.now()}`;
      let res = await fetchWithAuth(buildPdfUrl(), { signal });
      if (signal.aborted) return false;
      if (res.status === 202) {
        const ready = await waitAnalysisCompleteForPdf(analysisId, signal);
        if (signal.aborted) return false;
        if (!ready) throw new Error('pdf_not_ready');
        res = await fetchWithAuth(buildPdfUrl(), { signal });
        if (signal.aborted) return false;
      }
      if (res.status === 202) throw new Error('pdf_not_ready');
      if (!res.ok) throw new Error('pdf_error');
      const blob = await res.blob();
      if (await blob.slice(0, 5).text() !== '%PDF-') throw new Error('pdf_error');
      if (!(await waitForPdfPageVisible(signal))) return false;
      const download = preparePdfDownload(blob, resolveDownloadFilename(res.headers.get('content-disposition') ?? ''));
      preparedDownloadRef.current = download;
      setReadyDownload(download);
      download.start();
      setPhase('ready');
      setOverlayPhase('ready');
      setConcludeModalOpen(false);
      capturePostHogEvent('nm_pdf_generated', {
        duration_ms: Math.round(performance.now() - started),
        suggestion_rank: input.suggestionRank,
        ...(opts?.auto ? { auto: true } : {}),
      });
      // A click is not proof of a completed browser download. Keep the page and
      // Blob alive until the user chooses to leave; the visible link can retry.
      return true;
    } catch (err) {
      if (signal.aborted) {
        setOverlayPhase('idle');
        setPhase('idle');
        return false;
      }
      setPhase('error');
      setOverlayPhase('error');
      setConcludeError(savedPdfRef.current
        ? 'Sua análise está salva. Não foi possível iniciar o download; tente novamente ou baixe depois em Minhas análises.'
        : 'Não foi possível preparar a análise. Verifique sua conexão e tente novamente.');
      capturePostHogEvent('nm_pdf_failed', {
        error: err instanceof Error ? err.message : 'unknown',
      });
      return false;
    } finally {
      pdfRunLockRef.current = false;
      setConcludeBusyAction(null);
    }
  }, [
    input.analysisId,
    input.ensureAnalysisId,
    displayName,
    input.suggestionRank,
    addToast,
  ]);

  const runSaveOnly = useCallback(async (): Promise<boolean> => {
    if (pdfRunLockRef.current) return false;
    pdfRunLockRef.current = true;
    pdfAbortRef.current?.abort();
    const controller = new AbortController();
    pdfAbortRef.current = controller;
    const { signal } = controller;

    setConcludeError(null);
    setConcludeBusyAction('save');
    setPhase('loading');
    let navigated = false;

    try {
      let analysisId = input.analysisId;
      if (!analysisId && input.ensureAnalysisId) {
        analysisId = await input.ensureAnalysisId(signal);
      }
      if (signal.aborted) return false;
      if (!analysisId) {
        setPhase('error');
        setConcludeError('Não foi possível salvar a análise agora. Tente novamente.');
        return false;
      }
      const ready = await waitAnalysisCompleteForPdf(
        analysisId,
        signal,
        SAVE_STATUS_POLL_DELAYS_MS
      );
      if (signal.aborted) return false;
      if (!ready) {
        setPhase('error');
        setConcludeError('A análise ainda está sendo finalizada. Tente novamente em instantes.');
        return false;
      }
      capturePostHogEvent('nm_analysis_saved', {
        screen: input.screen,
        suggestion_rank: input.suggestionRank,
      });
      setConcludeModalOpen(false);
      input.onSaveSuccess?.(analysisId);
      navigated = true;
      redirectToDashboard(analysisId);
      return true;
    } catch (err) {
      if (signal.aborted) {
        setPhase('idle');
        return false;
      }
      setPhase('error');
      setConcludeError(
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível salvar a análise agora. Tente novamente.'
      );
      return false;
    } finally {
      if (!navigated) {
        pdfRunLockRef.current = false;
        setConcludeBusyAction(null);
      }
    }
  }, [
    input.analysisId,
    input.ensureAnalysisId,
    input.onSaveSuccess,
    redirectToDashboard,
    input.screen,
    input.suggestionRank,
  ]);

  const triggerAutoPdf = useCallback(async (): Promise<boolean> => {
    if (input.isFree || !input.emailConfirmed) return false;
    return runPaidPdf({ auto: true });
  }, [input.isFree, input.emailConfirmed, runPaidPdf]);

  const openConcludeModal = useCallback(() => {
    if (pdfRunLockRef.current || concludeBusyAction !== null || phase === 'loading') return;
    setConcludeError(null);
    setConcludeModalOpen(true);
  }, [concludeBusyAction, phase]);

  const closeConcludeModal = useCallback(() => {
    if (pdfRunLockRef.current || concludeBusyAction !== null) return;
    setConcludeError(null);
    setConcludeModalOpen(false);
  }, [concludeBusyAction]);

  const onStickyClick = useCallback(() => {
    if (!visible) return;
    if (phase === 'email_gate' || !input.emailConfirmed) return;
    if (pdfRunLockRef.current || concludeBusyAction !== null || phase === 'loading') return;

    if (input.isFree) {
      trackClick('sticky');
      capturePostHogEvent('nm_unlock_clicked', {
        surface: 'sticky',
        suggestion_rank: input.suggestionRank,
      });
      window.location.href = buildNomeSocialCheckoutHref({
        campaign: 'card_pdf',
        chosenSignature: displayName,
        analysisId: input.analysisId,
      });
      return;
    }

    trackClick('sticky');
    openConcludeModal();
  }, [
    visible,
    phase,
    concludeBusyAction,
    input.emailConfirmed,
    input.isFree,
    input.suggestionRank,
    input.analysisId,
    displayName,
    trackClick,
    openConcludeModal,
  ]);

  const onDockClick = useCallback(() => {
    if (!visible) return;
    if (phase === 'email_gate' || !input.emailConfirmed) return;
    if (pdfRunLockRef.current || concludeBusyAction !== null || phase === 'loading') return;

    if (input.isFree) {
      trackClick('dock');
      capturePostHogEvent('nm_unlock_clicked', {
        surface: 'dock',
        suggestion_rank: input.suggestionRank,
      });
      window.location.href = buildNomeSocialCheckoutHref({
        campaign: 'card_pdf',
        chosenSignature: displayName,
        analysisId: input.analysisId,
      });
      return;
    }

    trackClick('dock');
    openConcludeModal();
  }, [
    visible,
    phase,
    concludeBusyAction,
    input.emailConfirmed,
    input.isFree,
    input.suggestionRank,
    input.analysisId,
    displayName,
    trackClick,
    openConcludeModal,
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
    <>
      <ChatPdfConcludeModal
        open={concludeModalOpen}
        displayName={displayName}
        busyAction={concludeBusyAction}
        errorMessage={concludeError}
        onClose={closeConcludeModal}
        onSaveOnly={() => {
          void runSaveOnly();
        }}
        onSaveAndDownloadPdf={() => {
          setConcludeError(null);
          setConcludeModalOpen(false);
          void runPaidPdf();
        }}
      />
      <ChatPdfPreparingOverlay
        phase={overlayPhase}
        errorMessage={concludeError}
        readyDownload={readyDownload ? {
          href: readyDownload.href,
          filename: readyDownload.filename,
          onDownload: () => { if (savedPdfRef.current) clearPendingPdf(savedPdfRef.current.id); },
          onContinue: () => {
            const id = savedPdfRef.current?.id;
            if (!id) return;
            clearPendingPdf(id);
            input.onPdfSuccess?.(id);
            redirectToDashboard(id);
          },
        } : null}
        onRetry={() => {
          setOverlayPhase('idle');
          void runPaidPdf();
        }}
        onDismissError={() => {
          setOverlayPhase('idle');
          setPhase((p) => (p === 'error' ? 'idle' : p));
        }}
      />
    </>
  );

  return {
    model,
    onDockClick,
    onStickyClick,
    triggerAutoPdf,
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
      <div
        className="hidden md:inline-flex items-center gap-2 rounded-full border border-[#F59E0B]/70 bg-[#131313]/95 px-3 py-1.5"
        role="status"
      >
        <span className="text-xs font-semibold text-[#F59E0B] whitespace-nowrap">
          Confirme seu e-mail
        </span>
        <button
          type="button"
          onClick={onResendEmail}
          disabled={resending}
          className="shrink-0 rounded-full border border-[#F59E0B]/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#F59E0B] hover:bg-[#F59E0B]/10 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[2px]"
        >
          {resending ? 'Enviando…' : 'Reenviar'}
        </button>
      </div>
    );
  }

  const title = model.isFree
    ? `Desbloquear Análise${model.priceLabel ? ` · ${model.priceLabel}` : ''}`
    : model.phase === 'ready'
      ? 'Baixar Análise'
      : 'Gerar Análise';

  const Icon = model.isFree ? IconLockOpen : IconFileDown;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-label={isLoading ? "Preparando o seu PDF" : title}
      aria-busy={isLoading}
      title={nomeTrunc ? `${title} — ${nomeTrunc}` : title}
      className={`hidden md:inline-flex items-center justify-center gap-1.5 rounded-full bg-[#D4AF37] min-h-[36px] px-3.5 py-1.5 text-xs sm:text-sm font-semibold font-inter whitespace-nowrap text-[#131313] shadow-[0_2px_16px_rgba(212,175,55,0.35)] hover:bg-[#f2ca50] hover:shadow-[0_4px_24px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[2px] disabled:opacity-85 ${
        isError ? 'ring-2 ring-[#FF6B6B]' : ''
      } ${reduced ? 'transition-opacity duration-[120ms]' : ''}`}
    >
      {isLoading ? (
        <svg
          className="h-3.5 w-3.5 animate-spin text-[#131313] shrink-0"
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
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#131313]" />
      )}
      <span>{title}</span>
    </button>
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
  tooltip,
}: ChatPdfDockCircleProps) {
  if (!model.visible && !exiting) return null;
  const reduced = prefersReducedMotion();
  const Icon = model.isFree ? IconLockOpen : IconFileDown;
  const isLoading = model.phase === 'loading';
  const defaultActionLabel = model.isFree
    ? 'Desbloquear Análise'
    : model.assinaturaLabel?.trim()
      ? 'PDF deste nome'
      : 'Baixar PDF';
  const label = isLoading
    ? 'Gerando...'
    : model.phase === 'error'
      ? 'Tentar de novo'
      : model.isFree
        ? defaultActionLabel
        : 'Baixar a análise em PDF';

  return (
    <DockTooltipButton
      tooltip={tooltip ?? (model.isFree ? defaultActionLabel : 'Baixar PDF')}
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
          className="h-5 w-5 animate-spin"
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
        <Icon className="h-5 w-5 text-[#111111]" />
      )}
    </DockTooltipButton>
  );
}
