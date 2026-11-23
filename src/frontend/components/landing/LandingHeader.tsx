import React, { useState, useEffect, useRef } from 'react';

const NICHE_NAV_LINKS = [
  { href: '/nome-social', label: 'Nome Social' },
  { href: '/nome-artistico', label: 'Nome Artístico' },
  { href: '/nome-bebe', label: 'Nome do Bebê' },
] as const;

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nomeMenuOpen, setNomeMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [compact, setCompact] = useState<boolean | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const nomeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  useEffect(() => {
    if (!nomeMenuOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (nomeDropdownRef.current && !nomeDropdownRef.current.contains(event.target as Node)) {
        setNomeMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNomeMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [nomeMenuOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    const logo = logoRef.current;
    const nav = navRef.current;
    const actions = actionsRef.current;
    if (!row || !logo || !nav || !actions) return;

    const measure = () => {
      const prevNav = nav.className;
      const prevActions = actions.className;
      nav.className =
        'flex items-center gap-4 xl:gap-6 whitespace-nowrap absolute w-max invisible pointer-events-none';
      actions.className =
        'flex items-center gap-3 whitespace-nowrap absolute w-max invisible pointer-events-none';
      const navWidth = nav.scrollWidth;
      const actionsWidth = actions.scrollWidth;
      nav.className = prevNav;
      actions.className = prevActions;
      const styles = getComputedStyle(row);
      const pad = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const available = row.clientWidth - pad;
      const logoWidth = logo.getBoundingClientRect().width;
      const maxSide = Math.max(logoWidth, actionsWidth);
      const fits = navWidth + maxSide * 2 + 32 <= available;
      setCompact(!fits);
      if (fits) setMenuOpen(false);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(row);
    measure();
    return () => observer.disconnect();
  }, []);

  const desktopNavClass =
    compact === null
      ? 'hidden min-[1200px]:flex items-center justify-center gap-4 xl:gap-6 whitespace-nowrap shrink-0'
      : compact
        ? 'absolute w-max invisible pointer-events-none flex items-center gap-4 xl:gap-6 whitespace-nowrap'
        : 'flex items-center justify-center gap-4 xl:gap-6 whitespace-nowrap shrink-0';

  const desktopActionsClass =
    compact === null
      ? 'hidden min-[1200px]:flex items-center justify-end gap-3 whitespace-nowrap shrink-0'
      : compact
        ? 'absolute w-max invisible pointer-events-none flex items-center gap-3 whitespace-nowrap'
        : 'flex items-center justify-end gap-3 whitespace-nowrap shrink-0';

  const menuButtonClass =
    compact === null ? 'min-[1200px]:hidden' : compact ? '' : 'hidden';

  function navLink(href: string): string {
    const active = currentPath === href || (href !== '/' && currentPath.startsWith(href + '/'));
    const base = 'relative transition-colors text-sm after:absolute after:bottom-0 after:left-0 after:h-px after:bg-[#D4AF37] after:transition-all after:duration-300';
    return active
      ? `${base} text-[#D4AF37] after:w-full`
      : `${base} text-gray-400 hover:text-[#D4AF37] after:w-0 hover:after:w-full`;
  }

  const isNicheRoute = NICHE_NAV_LINKS.some(
    (item) => currentPath === item.href || currentPath.startsWith(item.href + '/'),
  );

  function mobileLink(href: string): string {
    const active = currentPath === href || (href !== '/' && currentPath.startsWith(href + '/'));
    return `block py-2.5 text-sm transition-colors ${active ? 'text-[#D4AF37] font-medium' : 'text-gray-400 hover:text-[#D4AF37]'}`;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? `bg-[#111111] backdrop-blur-md ${menuOpen ? 'border-transparent' : 'border-[#D4AF37]/20'}`
          : 'bg-transparent border-transparent'
      }`}
    >
      <div ref={rowRef} className={`max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 flex items-center justify-between ${scrolled ? 'py-3' : 'py-4 sm:py-5'}`}>
        {/* Coluna Esquerda: Logo permanece no mesmo lugar */}
        <div className="flex-1 flex items-center justify-start">
          <a ref={logoRef} href="/" className="hover:opacity-80 transition-opacity shrink-0">
            <img src="/logo-nm-header.svg" alt="Nome Magnético" className="block h-9 sm:h-10 md:h-11 w-auto max-w-none aspect-[2447/500]" />
          </a>
        </div>

        {/* Coluna Central: Textos do menu centralizados no header */}
        <nav ref={navRef} className={desktopNavClass} aria-hidden={compact === true}>
          <a href="/#como-funciona" className={`${navLink('/#como-funciona')} whitespace-nowrap shrink-0`}>
            Como Funciona
          </a>
          <a href="/analise-gratuita" className={`${navLink('/analise-gratuita')} whitespace-nowrap shrink-0`}>
            Análise Gratuita
          </a>

          <div ref={nomeDropdownRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setNomeMenuOpen((prev) => !prev)}
              aria-expanded={nomeMenuOpen}
              aria-haspopup="menu"
              className={`relative inline-flex items-center gap-1.5 transition-colors text-sm whitespace-nowrap cursor-pointer ${
                isNicheRoute || nomeMenuOpen
                  ? 'text-[#D4AF37]'
                  : 'text-gray-400 hover:text-[#D4AF37]'
              }`}
            >
              <span>Nome</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${nomeMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {nomeMenuOpen && (
              <div
                role="menu"
                aria-label="Caminhos de Nome"
                className="absolute left-0 top-full mt-3 w-52 rounded-2xl bg-[#19191c]/95 backdrop-blur-xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/10 z-50"
              >
                {NICHE_NAV_LINKS.map((item) => {
                  const active = currentPath === item.href || currentPath.startsWith(item.href + '/');
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setNomeMenuOpen(false)}
                      className={`block rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                        active
                          ? 'bg-[#D4AF37]/15 text-[#f2ca50] font-medium'
                          : 'text-[#e5e2e1] hover:bg-white/5 hover:text-[#f2ca50]'
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <a href="/precos" className={`${navLink('/precos')} whitespace-nowrap shrink-0`}>
            Preços
          </a>
          <a href="/blog" className={`${navLink('/blog')} whitespace-nowrap shrink-0`}>
            Blog
          </a>
          <a href="/perguntas-frequentes" className={`${navLink('/perguntas-frequentes')} whitespace-nowrap shrink-0`}>
            FAQ
          </a>
          <a href="/sobre" className={`${navLink('/sobre')} whitespace-nowrap shrink-0`}>
            Sobre
          </a>
        </nav>

        {/* Coluna Direita: Botões de ação e toggle mobile permanecem no mesmo lugar */}
        <div className="flex-1 flex items-center justify-end">
          <div ref={actionsRef} className={desktopActionsClass} aria-hidden={compact === true}>
            <a href="/auth/login" className="shrink-0 whitespace-nowrap bg-[#111111] border border-[#D4AF37] text-[#D4AF37] font-medium text-sm px-5 py-2 rounded-full hover:bg-[#D4AF37]/10 transition-all duration-300 shadow-md shadow-[#D4AF37]/10">
              Entrar
            </a>
            <a
              href="/auth/cadastro"
              data-cta-id="comecar"
              data-cta-position="header"
              className="shrink-0 whitespace-nowrap bg-[#D4AF37] text-[#1A1A1A] font-medium text-sm px-5 py-2.5 rounded-full hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20"
            >
              Começar Agora
            </a>
          </div>

          {/* Menu mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`${menuButtonClass} text-[#D4AF37] hover:text-[#f2ca50] transition-colors`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile aberto */}
      {menuOpen && (
        <div className={`${menuButtonClass} bg-[#111111] border-t border-[#D4AF37]/20 px-4 py-6 space-y-1`}>
          <a href="/#como-funciona" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Como Funciona</a>
          <a href="/analise-gratuita" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Análise Gratuita</a>
          <div className="py-1.5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#D4AF37]/80 pb-1">Nome</p>
            <div className="pl-3 space-y-0.5">
              {NICHE_NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={mobileLink(item.href)}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <a href="/precos" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Preços</a>
          <a href="/blog" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Blog</a>
          <a href="/perguntas-frequentes" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Perguntas Frequentes</a>
          <a href="/sobre" className={mobileLink('/sobre')} onClick={() => setMenuOpen(false)}>Sobre</a>

          <div className="pt-3 space-y-3">
            <a href="/auth/login" className="block bg-[#111111] border border-[#D4AF37] text-[#D4AF37] font-medium text-center py-2.5 rounded-full hover:bg-[#D4AF37]/10 transition-all duration-300" onClick={() => setMenuOpen(false)}>Entrar</a>
            <a href="/auth/cadastro" data-cta-id="comecar" data-cta-position="header_mobile" className="block bg-[#D4AF37] text-[#1A1A1A] font-medium text-center py-3 rounded-full hover:bg-[#f2ca50] transition-all duration-300" onClick={() => setMenuOpen(false)}>
              Começar Agora
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
