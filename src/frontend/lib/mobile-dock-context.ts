/**
 * Uma dock por página no mobile: nav global /app OU dock de ações (chat, resultado).
 */

export type MobileDockContext = 'app_nav' | 'action';

/** Rotas com dock de ações (Voltar, Recomeçar, etc.) — sem nav global. */
const ACTION_DOCK_PREFIXES = ['/app/analise/nome-social', '/app/resultado'] as const;

export function resolveMobileDockContext(pathname: string): MobileDockContext {
  const path = pathname.replace(/\/+$/, '') || '/';
  for (const prefix of ACTION_DOCK_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return 'action';
    }
  }
  return 'app_nav';
}

export function shouldRenderGlobalMobileNavDock(pathname: string): boolean {
  return resolveMobileDockContext(pathname) === 'app_nav';
}

export function shouldRenderActionMobileDock(pathname: string): boolean {
  return resolveMobileDockContext(pathname) === 'action';
}
