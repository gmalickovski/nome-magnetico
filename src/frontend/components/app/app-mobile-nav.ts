/** Navegação mobile /app — espelha sidebar desktop (AppLayout). */

import { APP_CLIENT_NAV_HREFS, APP_CLIENT_NAV_LABELS } from './app-client-nav-shared.js';

export type AppNavItemId = 'inicio' | 'analises' | 'glossario' | 'suporte';

export interface AppNavActiveFlags {
  inicio: boolean;
  analises: boolean;
  glossario: boolean;
  suporte: boolean;
}

export function resolveAppNavActive(pathname: string): AppNavActiveFlags {
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const analises =
    isActive('/app/analises') || isActive('/app/resultado');
  const suporte = isActive('/app/suporte');
  const glossario = isActive('/glossario');
  const inicio =
    isActive('/app') &&
    !isActive('/app/analise') &&
    !isActive('/app/resultado') &&
    !isActive('/app/analises') &&
    !isActive('/app/suporte') &&
    !isActive('/app/admin-analise') &&
    !isActive('/app/sentry-test');

  return { inicio, analises, glossario, suporte };
}

export interface AppNavDockItem {
  id: AppNavItemId;
  label: string;
  href: string;
  disabled?: boolean;
  active: boolean;
  accent?: 'gold';
}

export function buildAppNavDockItems(options: {
  pathname: string;
  showAnalisesNav: boolean;
}): AppNavDockItem[] {
  const active = resolveAppNavActive(options.pathname);
  const items: AppNavDockItem[] = [
    {
      id: 'inicio',
      label: APP_CLIENT_NAV_LABELS.inicio,
      href: APP_CLIENT_NAV_HREFS.inicio,
      active: active.inicio,
      accent: 'gold',
    },
  ];

  if (options.showAnalisesNav) {
    items.push({
      id: 'analises',
      label: APP_CLIENT_NAV_LABELS.analises,
      href: APP_CLIENT_NAV_HREFS.analises,
      active: active.analises,
      accent: 'gold',
    });
  } else {
    items.push({
      id: 'analises',
      label: APP_CLIENT_NAV_LABELS.analises,
      href: APP_CLIENT_NAV_HREFS.analises,
      disabled: true,
      active: false,
      accent: 'gold',
    });
  }

  items.push(
    {
      id: 'glossario',
      label: APP_CLIENT_NAV_LABELS.glossario,
      href: APP_CLIENT_NAV_HREFS.glossario,
      active: active.glossario,
      accent: 'gold',
    },
    {
      id: 'suporte',
      label: APP_CLIENT_NAV_LABELS.suporte,
      href: APP_CLIENT_NAV_HREFS.suporte,
      active: active.suporte,
      accent: 'gold',
    }
  );

  return items;
}

/** Barra de progresso no topo ao trocar de rota interna (mesmo efeito da nav antiga). */
export function showAppNavRouteLoadingBar(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('app-dock-route-loading-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'app-dock-route-loading-bar';
  Object.assign(bar.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    height: '3px',
    width: '0%',
    backgroundImage: 'linear-gradient(to right, #f2ca50, #bea5ff, #f2ca50)',
    zIndex: '99999',
    transition: 'width 1.5s cubic-bezier(0.1, 0.8, 0.3, 1)',
    boxShadow: '0 0 8px rgba(242, 202, 80, 0.6), 0 0 15px rgba(190, 165, 255, 0.4)',
  });
  document.body.appendChild(bar);
  requestAnimationFrame(() => {
    bar.style.width = '90%';
  });
}
