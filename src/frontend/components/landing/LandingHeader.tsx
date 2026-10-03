import React, { useState, useEffect, useRef } from 'react';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [compact, setCompact] = useState<boolean | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    const logo = logoRef.current;
    const nav = navRef.current;
    if (!row || !logo || !nav) return;

    const measure = () => {
      const previous = nav.className;
      nav.className =
        'flex items-center gap-4 xl:gap-6 whitespace-nowrap absolute w-max invisible pointer-events-none';
      const navWidth = nav.scrollWidth;
      nav.className = previous;
      const styles = getComputedStyle(row);
      const pad = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const available = row.clientWidth - pad;
      const logoWidth = logo.getBoundingClientRect().width;
      const fits = logoWidth + navWidth + 24 <= available;
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
      ? 'hidden min-[1200px]:flex items-center gap-4 xl:gap-6 whitespace-nowrap'
      : compact
        ? 'absolute w-max invisible pointer-events-none flex items-center gap-4 xl:gap-6 whitespace-nowrap'
        : 'flex items-center gap-4 xl:gap-6 whitespace-nowrap';

  const menuButtonClass =
    compact === null ? 'min-[1200px]:hidden' : compact ? '' : 'hidden';

  function navLink(href: string): string {
    const active = currentPath === href || (href !== '/' && currentPath.startsWith(href + '/'));
    const base = 'relative transition-colors text-sm after:absolute after:bottom-0 after:left-0 after:h-px after:bg-[#D4AF37] after:transition-all after:duration-300';
    return active
      ? `${base} text-[#D4AF37] after:w-full`
      : `${base} text-gray-400 hover:text-[#D4AF37] after:w-0 hover:after:w-full`;
  }

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
      <div ref={rowRef} className={`max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12 flex items-center justify-between ${scrolled ? 'py-3' : 'py-5'}`}>
        {/* Logo */}
        <a ref={logoRef} href="/" className="hover:opacity-80 transition-opacity shrink-0">
          <img src="/logo-nm-header.svg" alt="Nome Magnético" className="block h-9 w-auto max-w-none aspect-[2447/500] sm:h-10 md:h-11" />
        </a>

        {/* Nav desktop — hidden until the logo and the links both fit */}
        <nav ref={navRef} className={desktopNavClass} aria-hidden={compact === true}>
          <a href="/#como-funciona" className={`${navLink('/#como-funciona')} whitespace-nowrap shrink-0`}>
            Como Funciona
          </a>
          <a href="/analise-gratuita" className={`${navLink('/analise-gratuita')} whitespace-nowrap shrink-0`}>
            Análise Gratuita
          </a>

          <a href="/nome-social" className={`${navLink('/nome-social')} whitespace-nowrap shrink-0`}>
            Nome Social
          </a>

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
          <a href="/auth/login" className="shrink-0 whitespace-nowrap bg-[#111111] border border-[#D4AF37] text-[#D4AF37] font-medium text-sm px-5 py-2 rounded-lg hover:bg-[#D4AF37]/10 transition-all duration-300 shadow-md shadow-[#D4AF37]/10">
            Entrar
          </a>
          <a
            href="/auth/cadastro"
            className="shrink-0 whitespace-nowrap bg-[#D4AF37] text-[#1A1A1A] font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20"
          >
            Começar Agora
          </a>
        </nav>

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

      {/* Menu mobile aberto */}
      {menuOpen && (
        <div className={`${menuButtonClass} bg-[#111111] border-t border-[#D4AF37]/20 px-4 py-6 space-y-1`}>
          <a href="/#como-funciona" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Como Funciona</a>
          <a href="/analise-gratuita" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Análise Gratuita</a>
          <a href="/nome-social" className={mobileLink('/nome-social')} onClick={() => setMenuOpen(false)}>Nome Social</a>
          <a href="/precos" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Preços</a>
          <a href="/blog" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Blog</a>
          <a href="/perguntas-frequentes" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Perguntas Frequentes</a>
          <a href="/sobre" className={mobileLink('/sobre')} onClick={() => setMenuOpen(false)}>Sobre</a>

          <div className="pt-3 space-y-3">
            <a href="/auth/login" className="block bg-[#111111] border border-[#D4AF37] text-[#D4AF37] font-medium text-center py-2.5 rounded-lg hover:bg-[#D4AF37]/10 transition-all duration-300" onClick={() => setMenuOpen(false)}>Entrar</a>
            <a href="/auth/cadastro" className="block bg-[#D4AF37] text-[#1A1A1A] font-medium text-center py-3 rounded-lg hover:bg-[#f2ca50] transition-all duration-300" onClick={() => setMenuOpen(false)}>
              Começar Agora
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
