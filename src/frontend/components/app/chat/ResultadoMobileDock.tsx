import React, { useMemo } from 'react';
import { buildResultadoDockLayout } from './mobile-dock-screen.js';
import MobileDockActionBridge from '../MobileDockActionBridge.js';
import type { DockPrimaryActionId, DockSecondaryActionId } from './mobile-dock-screen.js';
import { capturePostHogEvent } from '../../../lib/analytics.js';
import { navigateClientAreaBack } from '../../../lib/app-nav-back.js';

export interface ResultadoMobileDockProps {
  analysisId: string;
  productType: string;
  isFree: boolean;
  redoHref: string;
}

export function ResultadoMobileDock({
  analysisId,
  productType,
  isFree,
  redoHref,
}: ResultadoMobileDockProps) {
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

  const handleBack = () => {
    const destination = navigateClientAreaBack();
    capturePostHogEvent('back_clicked', { screen: 'resultado', step: productType, destination });
  };

  const handleSecondary = async (action: DockSecondaryActionId, position: number) => {
    capturePostHogEvent('dock_action_clicked', {
      screen: 'resultado',
      action,
      position,
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
    capturePostHogEvent('dock_primary_clicked', {
      screen: 'resultado',
      action,
      is_free: isFree,
    });

    if (action === 'unlock_nome_social') {
      window.location.href = '/comprar?produto=nome_social&utm_source=app_dock';
      return;
    }
    if (action === 'download_pdf' && analysisId) {
      window.location.href = `/api/generate-pdf?id=${encodeURIComponent(analysisId)}`;
    }
  };

  return (
    <MobileDockActionBridge
      layout={layout}
      summaryPanelOpen={false}
      summaryBadge={false}
      onBack={handleBack}
      onSecondary={handleSecondary}
      onPrimary={handlePrimary}
    />
  );
}

export default ResultadoMobileDock;
