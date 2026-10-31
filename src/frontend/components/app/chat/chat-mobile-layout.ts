/** Altura do header mobile compacto do chat (<768px). */
export const NM_CHAT_MOBILE_HEADER_PX = 52;

/** Espaço reservado acima da dock flutuante (barra + margem + safe area). */
export const NM_CHAT_DOCK_CLEARANCE =
  'calc(88px + env(safe-area-inset-bottom, 0px))';

export function nmChatMobileHeaderCssVar(): string {
  return `${NM_CHAT_MOBILE_HEADER_PX}px`;
}
