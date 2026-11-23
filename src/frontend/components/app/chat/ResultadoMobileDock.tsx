import React, { useMemo } from 'react';
import { buildResultadoDockLayout } from './mobile-dock-screen.js';
import MobileDockActionBridge from '../MobileDockActionBridge.js';
import type { DockPrimaryActionId, DockSecondaryActionId } from './mobile-dock-screen.js';
import { capturePostHogEvent } from '../../../lib/analytics.js';
import { usePdfDownloadOverlay } from '../../../lib/pdf-download.js';
import { ChatPdfPreparingOverlay } from './ChatPdfPreparingOverlay.js';

export interface ResultadoMobileDockProps {
  analysisId: string;
  productType: string;
  isFree: boolean;
  forceFreePdf?: boolean;
  redoHref: string;
}

export function ResultadoMobileDock({
  analysisId,
  productType,
  isFree,
  forceFreePdf = false,
  redoHref,
}: ResultadoMobileDockProps) {
  const { phase, startDownload, retry, dismiss } = usePdfDownloadOverlay();
  const layout = useMemo(
    () =>
      buildResultadoDockLayout({
        canShare: true,
        canRedo: Boolean(redoHref),
        canDownloadPdf: Boolean(analysisId) && !isFree,
        isFree,
      }),
    [analysisId, isFree, redoHref]
  );

  const handleSecondary = async (action: DockSecondaryActionId, position: number) => {
    capturePostHogEvent('dock_item_click', {
      item: action,
      position,
      visible_without_scroll: true,
      surface: 'resultado',
    });

    if (action === 'share') {
      const url = window.location.href;
      const title = 'Nome Magnético — resultado da análise';
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch (err) {
          if ((err as DOMException).name !== 'AbortError') {
            await navigator.clipboard?.writeText?.(url);
          }
        }
      } else {
        await navigator.clipboard?.writeText?.(url);
      }
      return;
    }

    if (action === 'redo_analysis') {
      window.location.href = redoHref;
    }
  };

  const handlePrimary = (action: DockPrimaryActionId) => {
    if (action === 'unlock_nome_social') {
      capturePostHogEvent('primary_cta_click', {
        cta: 'unlock',
        location: 'dock',
        surface: 'resultado',
      });
      window.location.href = '/comprar?produto=nome_social&from=app_dock';
      return;
    }
    if (action === 'download_pdf' && analysisId) {
      capturePostHogEvent('primary_cta_click', {
        cta: 'pdf',
        location: 'dock',
        surface: 'resultado',
      });
      void startDownload({
        analysisId,
        productType,
        forceFreePdf: Boolean(forceFreePdf || isFree || productType === 'analise_gratuita'),
      });
    }
  };

  return (
    <>
      <MobileDockActionBridge
        layout={layout}
        summaryPanelOpen={false}
        summaryBadge={false}
        onSecondary={handleSecondary}
        onPrimary={handlePrimary}
      />
      <ChatPdfPreparingOverlay
        phase={phase}
        onRetry={retry}
        onDismissError={dismiss}
      />
    </>
  );
}

export default ResultadoMobileDock;
