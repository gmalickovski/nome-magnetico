import { useEffect, useState } from 'react';
import { DOCK_RESTART_EXIT_MS } from './mobile-dock-layout.js';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Enquanto o Resumo fullscreen está aberto, remove Recomeçar da dock após animação de saída.
 */
export function useDockRestartForSummary(summaryPanelOpen: boolean): {
  omitRestartFromDockLayout: boolean;
  restartExitActive: boolean;
} {
  const [omitRestartFromDockLayout, setOmitRestartFromDockLayout] = useState(false);

  useEffect(() => {
    if (!summaryPanelOpen) {
      setOmitRestartFromDockLayout(false);
      return;
    }
    const ms = prefersReducedMotion() ? 0 : DOCK_RESTART_EXIT_MS;
    if (ms === 0) {
      setOmitRestartFromDockLayout(true);
      return;
    }
    const t = window.setTimeout(() => setOmitRestartFromDockLayout(true), ms);
    return () => window.clearTimeout(t);
  }, [summaryPanelOpen]);

  return {
    omitRestartFromDockLayout,
    restartExitActive: summaryPanelOpen && !omitRestartFromDockLayout,
  };
}
