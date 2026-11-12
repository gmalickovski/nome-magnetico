/** Dock sempre acima de sheets, overlays e FABs no mobile. */
export const MOBILE_DOCK_Z_INDEX = 80;
export const MOBILE_READING_OVERLAY_Z_INDEX = 55;
export const MOBILE_READING_SHEET_Z_INDEX = 60;

export const MOBILE_READING_SHEET_HEIGHT_FULL = '92dvh';
export const MOBILE_READING_SHEET_HEIGHT_HALF = '50dvh';

/** Transição de largura da barra flutuante (dock). */
export const DOCK_BAR_WIDTH_TRANSITION_MS = 240;

/** Saída do botão Recomeçar ao abrir Resumo fullscreen (antes de encolher a dock). */
export const DOCK_RESTART_EXIT_MS = 180;

export const DOCK_BAR_WIDTH_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export function dockShellWidthStyle(
  widthPx: number | null,
  reducedMotion: boolean
): { width: string; transition?: string; overflow: 'hidden' } {
  return {
    width: widthPx != null ? `${widthPx}px` : 'max-content',
    overflow: 'hidden',
    transition: reducedMotion || widthPx == null
      ? undefined
      : `width ${DOCK_BAR_WIDTH_TRANSITION_MS}ms ${DOCK_BAR_WIDTH_EASING}`,
  };
}

/** Classes da barra: contêiner flutuante, largura só do conteúdo. */
export const MOBILE_DOCK_BAR_CLASS =
  'mobile-chat-dock-bar nm-mobile-dock-bar inline-flex w-max max-w-[calc(100vw-24px)] h-14 items-center gap-0 rounded-[28px] border border-t border-t-[#2A2A2A] border-[rgba(212,175,55,0.18)] p-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.35)] backdrop-blur-[16px] backdrop-saturate-[140%] bg-[rgba(19,19,19,0.92)] transition-[background-color,backdrop-filter] duration-200 ease-out';

export const MOBILE_DOCK_ROOT_CLASS =
  `lg:hidden mobile-chat-dock-root fixed left-1/2 z-[${MOBILE_DOCK_Z_INDEX}] w-max max-w-[calc(100%-24px)] -translate-x-1/2`;
