/** Metadados compartilhados da navegação da área do cliente (sidebar + dock). */

export const APP_CLIENT_NAV_LABELS = {
  inicio: 'Início',
  analises: 'Minhas análises',
  glossario: 'Glossário',
  suporte: 'Suporte',
} as const;

export const APP_CLIENT_NAV_HREFS = {
  inicio: '/app',
  analises: '/app/analises',
  glossario: '/glossario',
  suporte: '/app/suporte',
} as const;

/** Classes base do item da sidebar desktop (DEV-282 + barra ativa DEV-286). */
export function sidebarNavLinkClass(active: boolean): string {
  const base =
    'relative flex h-12 min-h-[44px] items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-all';
  if (active) {
    return `${base} bg-[#D4AF37]/12 text-[#f2ca50] before:absolute before:left-0 before:top-1/2 before:h-7 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[#f2ca50] before:content-['']`;
  }
  return `${base} text-[#A0A0A0] hover:bg-white/[0.03] hover:text-[#f2ca50]`;
}

export function sidebarNavIconClass(active: boolean): string {
  return `h-5 w-5 flex-shrink-0 ${active ? 'text-[#f2ca50]' : 'text-[#A0A0A0]'}`;
}
