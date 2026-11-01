/** Navegação mobile /app — espelha sidebar desktop (AppLayout). */

export type AppNavItemId = 'dashboard' | 'analises' | 'suporte' | 'blog' | 'analista';

export interface AppNavActiveFlags {
  dashboard: boolean;
  analises: boolean;
  suporte: boolean;
  analista: boolean;
}

export function resolveAppNavActive(pathname: string): AppNavActiveFlags {
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const analises =
    isActive('/app/analises') || isActive('/app/resultado');
  const suporte = isActive('/app/suporte');
  const analista = isActive('/app/admin-analise');
  const dashboard =
    isActive('/app') &&
    !isActive('/app/analise') &&
    !isActive('/app/resultado') &&
    !isActive('/app/analises') &&
    !isActive('/app/suporte') &&
    !isActive('/app/admin-analise') &&
    !isActive('/app/sentry-test');

  return { dashboard, analises, suporte, analista };
}

export interface AppNavDockItem {
  id: AppNavItemId;
  label: string;
  href: string;
  external?: boolean;
  disabled?: boolean;
  active: boolean;
  /** Destaque roxo (Área do Analista). */
  accent?: 'gold' | 'purple';
}

export function buildAppNavDockItems(options: {
  pathname: string;
  showAnalisesNav: boolean;
  isAdmin: boolean;
}): AppNavDockItem[] {
  const active = resolveAppNavActive(options.pathname);
  const items: AppNavDockItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/app',
      active: active.dashboard,
      accent: 'gold',
    },
  ];

  if (options.showAnalisesNav) {
    items.push({
      id: 'analises',
      label: 'Minhas Análises',
      href: '/app/analises',
      active: active.analises,
      accent: 'gold',
    });
  } else {
    items.push({
      id: 'analises',
      label: 'Minhas Análises',
      href: '/app/analises',
      disabled: true,
      active: false,
      accent: 'gold',
    });
  }

  items.push(
    {
      id: 'suporte',
      label: 'Suporte',
      href: '/app/suporte',
      active: active.suporte,
      accent: 'gold',
    },
    {
      id: 'blog',
      label: 'Blog',
      href: '/blog',
      external: true,
      active: false,
      accent: 'gold',
    }
  );

  if (options.isAdmin) {
    items.push({
      id: 'analista',
      label: 'Área do Analista',
      href: '/app/admin-analise',
      active: active.analista,
      accent: 'purple',
    });
  }

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
