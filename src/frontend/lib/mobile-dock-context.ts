/**
 * Uma dock por página no mobile: navegação global /app com ações contextuais (chat, resultado).
 */

export type MobileDockContext = 'app_nav' | 'action';

/** Rotas com ações contextuais (Recomeçar, PDF, etc.) ao lado da nav global. */
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
  return pathname === '/app' || pathname.startsWith('/app/');
}

export function shouldRenderActionMobileDock(pathname: string): boolean {
  return resolveMobileDockContext(pathname) === 'action';
}
