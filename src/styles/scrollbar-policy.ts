/**
 * Política de scrollbars — deve coincidir com `src/styles/global.css`.
 * Touch / tablet: barras ocultas; desktop fine pointer: barras visíveis.
 */

/** Viewports & dispositivos onde a barra NUNCA aparece. */
export const SCROLLBAR_HIDDEN_MEDIA = '(max-width: 1023px), (pointer: coarse)';

/** Desktop com mouse: barras customizadas (global + chat hover). */
export const SCROLLBAR_VISIBLE_MEDIA = '(min-width: 1024px) and (pointer: fine)';
