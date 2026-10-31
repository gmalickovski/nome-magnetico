import { useEffect, useLayoutEffect } from 'react';
import type { MobileChatDockProps } from './chat/MobileChatDock.js';
import {
  clearMobileDockAction,
  publishMobileDockAction,
} from '../../lib/mobile-dock-action-store.js';

/** Publica estado/handlers da dock de ações para a única `AppMobileDock` no layout. */
export function MobileDockActionBridge({
  layout,
  summaryPanelOpen,
  restartExitActive = false,
  summaryBadge,
  pdfModel = null,
  pdfExiting = false,
  onPdfClick,
  onBack,
  onSecondary,
  onPrimary,
}: MobileChatDockProps) {
  useLayoutEffect(() => {
    publishMobileDockAction({
      state: {
        layout,
        summaryPanelOpen,
        restartExitActive,
        summaryBadge,
        pdfModel,
        pdfExiting,
      },
      handlers: { onBack, onSecondary, onPrimary, onPdfClick },
    });
  }, [
    layout,
    summaryPanelOpen,
    restartExitActive,
    summaryBadge,
    pdfModel,
    pdfExiting,
    onPdfClick,
    onBack,
    onSecondary,
    onPrimary,
  ]);

  useEffect(() => () => clearMobileDockAction(), []);

  return null;
}

export default MobileDockActionBridge;
