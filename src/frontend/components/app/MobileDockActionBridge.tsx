import { useEffect, useLayoutEffect } from 'react';
import type { MobileChatDockProps } from './chat/MobileChatDock.js';
import {
  clearMobileDockAction,
  publishMobileDockAction,
} from '../../lib/mobile-dock-action-store.js';

export type MobileDockActionBridgeProps = Omit<MobileChatDockProps, 'omitRoot'>;

/** Publica estado/handlers da dock de ações para a única `AppMobileDock` no layout. */
export function MobileDockActionBridge({
  layout,
  summaryPanelOpen,
  restartExitActive = false,
  summaryBadge,
  pdfModel = null,
  pdfExiting = false,
  onPdfClick,
  onSecondary,
  onPrimary,
}: MobileDockActionBridgeProps) {
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
      handlers: { onSecondary, onPrimary, onPdfClick },
    });
  }, [
    layout,
    summaryPanelOpen,
    restartExitActive,
    summaryBadge,
    pdfModel,
    pdfExiting,
    onPdfClick,
    onSecondary,
    onPrimary,
  ]);

  useEffect(() => () => clearMobileDockAction(), []);

  return null;
}

export default MobileDockActionBridge;
