import React, { useEffect, useRef } from 'react';
import { MapDownloadIcon } from './MapDownloadIcon.js';
import { ChatPdfPreparingOverlay } from './chat/ChatPdfPreparingOverlay.js';
import { usePdfDownloadOverlay } from '../../lib/pdf-download.js';

interface Props {
  analysisId: string;
  productType: string;
  isFree?: boolean;
  /** Força geração da versão gratuita do nome de nascimento (ex: nome padrão sem harmonização). */
  forceFreePdf?: boolean;
  fabOnly?: boolean;
  /** URL direta do PDF — se fornecida, substitui /api/generate-pdf?id=... */
  pdfUrl?: string;
  /** Texto do botão (desktop) */
  label?: string;
  /** Renderiza também o texto ao lado do ícone */
  showLabel?: boolean;
  /** Classe CSS do botão desktop — sobrescreve o padrão */
  className?: string;
  /** Exibe o FAB mobile (padrão: true) */
  showFab?: boolean;
  /** Dispara o download automaticamente ao montar o componente */
  autoDownload?: boolean;
  /** Se a análise foi gerada por um analista */
  isAnalyst?: boolean;
}

export function PDFFeedbackButton({
  analysisId,
  productType,
  isFree = false,
  forceFreePdf = false,
  fabOnly = false,
  pdfUrl,
  label,
  showLabel = false,
  className,
  showFab = true,
  autoDownload = false,
}: Props) {
  const { phase, isDownloading, startDownload, retry, dismiss } = usePdfDownloadOverlay();
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDownload() {
    const useFreePdf = Boolean(forceFreePdf || isFree || productType === 'analise_gratuita');
    void startDownload({ analysisId, pdfUrl, productType, forceFreePdf: useFreePdf });
  }

  // Auto-download ao montar quando solicitado (primeiro login via landing page)
  useEffect(() => {
    if (autoDownload) {
      const t = setTimeout(() => handleDownload(), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opacidade do FAB ao rolar / interagir (só na instância fabOnly)
  useEffect(() => {
    if (!fabOnly) return;
    const btn = fabRef.current;
    if (!btn) return;
    const fade = () => {
      btn.style.opacity = '0.3';
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
      restoreTimer.current = setTimeout(() => {
        btn.style.opacity = '1';
      }, 800);
    };
    ['scroll', 'touchstart', 'touchmove'].forEach((ev) =>
      window.addEventListener(ev, fade, { passive: true }),
    );
    return () => {
      ['scroll', 'touchstart', 'touchmove'].forEach((ev) =>
        window.removeEventListener(ev, fade),
      );
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
    };
  }, [fabOnly]);

  const downloadIcon = (
    <MapDownloadIcon className={isDownloading ? 'motion-safe:animate-pulse' : ''} />
  );

  return (
    <>
      {/* ── Botão desktop (omitido quando fabOnly) ── */}
      {!fabOnly && (
        <button
          type="button"
          onClick={handleDownload}
          aria-label={isDownloading ? 'Preparando PDF' : (label ?? 'Baixar Análise')}
          title={label ?? 'Baixar Análise'}
          aria-busy={isDownloading}
          disabled={isDownloading}
          className={
            className ??
            'hidden md:inline-flex h-11 w-11 items-center justify-center bg-[#D4AF37] text-[#131313] text-xs font-bold uppercase tracking-wider p-0 rounded-full shadow-[0_2px_16px_rgba(212,175,55,0.35)] hover:bg-[#f2ca50] hover:shadow-[0_4px_24px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-300'
          }
        >
          {downloadIcon}
          {showLabel ? (
            <span>{isDownloading ? 'Preparando PDF...' : (label ?? 'Baixar PDF')}</span>
          ) : null}
        </button>
      )}

      {/* ── FAB mobile (condicional via showFab) ── */}
      {showFab && (
        <button
          type="button"
          ref={fabRef}
          onClick={handleDownload}
          aria-label={isDownloading ? 'Preparando PDF' : (label ?? 'Baixar Análise')}
          title={label ?? 'Baixar Análise'}
          aria-busy={isDownloading}
          disabled={isDownloading}
          className="md:hidden fixed right-3 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#D4AF37] text-[#131313] shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:bg-[#f2ca50] active:scale-95 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
          style={{
            opacity: 1,
            transition: 'opacity 0.4s ease, background-color 0.3s, box-shadow 0.3s, transform 0.1s',
            bottom: 'var(--nm-mobile-dock-stacked-clearance, var(--nm-mobile-dock-clearance, 5.5rem))',
          }}
          id="pdf-download-btn"
        >
          {downloadIcon}
        </button>
      )}

      {/* ── Modal unificado de carregamento de PDF ── */}
      <ChatPdfPreparingOverlay
        phase={phase}
        onRetry={retry}
        onDismissError={dismiss}
      />
    </>
  );
}
