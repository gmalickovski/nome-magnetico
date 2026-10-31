/**
 * Tokens compartilhados da dock flutuante mobile (/app).
 * Espelham as CSS vars em global.css (.nm-app-shell--with-mobile-dock).
 */

export const NM_MOBILE_DOCK_MARGIN = '12px';
export const NM_MOBILE_DOCK_BAR_H = '3.5rem';

const SAFE = 'env(safe-area-inset-bottom, 0px)';

/** Uma dock (nav ou ações) + margem inferior + safe area. */
export const NM_MOBILE_DOCK_CLEARANCE = `calc(${NM_MOBILE_DOCK_BAR_H} + ${NM_MOBILE_DOCK_MARGIN} + ${SAFE})`;

/** Nav + dock de ações (chat, resultado). */
export const NM_MOBILE_DOCK_STACKED_CLEARANCE = `calc(2 * ${NM_MOBILE_DOCK_BAR_H} + 3 * ${NM_MOBILE_DOCK_MARGIN} + ${SAFE})`;
