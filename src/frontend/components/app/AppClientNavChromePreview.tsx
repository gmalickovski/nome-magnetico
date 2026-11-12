import React from 'react';
import AppMobileDock from './AppMobileDock.js';
import AppDesktopHeader from './AppDesktopHeader.js';
import {
  APP_CLIENT_NAV_HREFS,
  APP_CLIENT_NAV_LABELS,
  sidebarNavIconClass,
  sidebarNavLinkClass,
} from './app-client-nav-shared.js';
import { iconForNavItem } from './AppNavDockIcons.js';
import type { AppNavItemId } from './app-mobile-nav.js';

const NAV_IDS: AppNavItemId[] = ['inicio', 'analises', 'glossario', 'suporte'];

function SidebarIcon({ id, active }: { id: AppNavItemId; active: boolean }) {
  const Icon = iconForNavItem(id);
  return <Icon className={sidebarNavIconClass(active)} />;
}

export type AppClientNavChromePreviewProps = {
  /** Largura expandida para captura desktop */
  sidebarExpanded?: boolean;
};

/** Chrome real da área logada (sidebar + header + dock) sem sessão Supabase — só preview/dev. */
export default function AppClientNavChromePreview({
  sidebarExpanded = true,
}: AppClientNavChromePreviewProps) {
  const navInicioActive = true;

  return (
    <div className="min-h-screen bg-[#1a1a1a] nm-app-shell--with-mobile-dock text-gray-200">
      <aside
        id="app-sidebar"
        className={`group hidden md:flex fixed inset-y-0 left-0 z-50 flex-col overflow-hidden border-r border-[#D4AF37]/15 bg-[#111111]/95 px-4 pt-6 pb-7 ${
          sidebarExpanded ? 'w-60' : 'w-20'
        }`}
      >
        <nav className="flex flex-col gap-2" aria-label="Navegação principal">
          {NAV_IDS.map((id) => {
            const active = id === 'inicio' && navInicioActive;
            const href = APP_CLIENT_NAV_HREFS[id];
            const label = APP_CLIENT_NAV_LABELS[id];
            return (
              <a
                key={id}
                href={href}
                className={sidebarNavLinkClass(active)}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => e.preventDefault()}
              >
                <SidebarIcon id={id} active={active} />
                <span className={sidebarExpanded ? 'whitespace-nowrap opacity-100' : 'whitespace-nowrap opacity-0'}>
                  {label}
                </span>
              </a>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-white/[0.06] pt-4">
          <a
            href="/blog"
            className="flex h-12 min-h-[44px] items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-[#A0A0A0] transition-all hover:bg-white/[0.03] hover:text-[#f2ca50]"
            onClick={(e) => e.preventDefault()}
          >
            <span className="text-xs text-[#A0A0A0]">Blog (rodapé)</span>
          </a>
          <div className="flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-gray-500">
            Sair
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center border-b border-[#D4AF37]/15 bg-[#111111]/95 px-4">
        <span className="font-cinzel text-sm font-bold text-[#e5e2e1]">Nome Magnético</span>
      </div>

      <div className="hidden md:block">
        <AppDesktopHeader nome="Preview" isAdmin={false} />
        <div className="h-14 shrink-0" aria-hidden />
      </div>

      <main className="nm-app-main md:ml-20 overflow-x-hidden px-3.5 py-6 md:px-10 md:py-10 md:pb-10">
        <div className="mx-auto max-w-[1440px] w-full">
          <h1 className="font-cinzel text-2xl text-[#f2ca50]">Área do cliente (preview DEV-286)</h1>
          <p className="mt-2 text-sm text-gray-500">Componentes reais: sidebar, header, dock mobile.</p>
        </div>
      </main>

      <AppMobileDock pathname="/app" showAnalisesNav />
    </div>
  );
}
