/** Altura do header mobile compacto do chat (<768px). */
export const NM_CHAT_MOBILE_HEADER_PX = 52;

import { NM_MOBILE_DOCK_STACKED_CLEARANCE } from '../mobile-dock-tokens.js';

/** Espaço acima das docks empilhadas (nav + ações) no chat mobile. */
export const NM_CHAT_DOCK_CLEARANCE = NM_MOBILE_DOCK_STACKED_CLEARANCE;

export function nmChatMobileHeaderCssVar(): string {
  return `${NM_CHAT_MOBILE_HEADER_PX}px`;
}
