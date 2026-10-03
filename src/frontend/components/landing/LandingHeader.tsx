import React, { useState, useEffect } from 'react';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          ? `bg-[#111111]/90 backdrop-blur-md ${menuOpen ? 'border-transparent' : 'border-[#D4AF37]/20'}`
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className={`max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12 flex items-center justify-between ${scrolled ? 'py-3' : 'py-5'}`}>
        {/* Logo */}
        <a href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
          <img src="/logo-nm-header.svg" alt="Nome Magnético" className="h-9 sm:h-10 md:h-11 w-auto" />
        </a>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
          <a href="/#como-funciona" className={navLink('/#como-funciona')}>
            Como Funciona
          </a>
          <a href="/analise-gratuita" className={navLink('/analise-gratuita')}>
            Análise Gratuita
          </a>

          <a href="/nome-social" className={navLink('/nome-social')}>
            Nome Social
          </a>

          <a href="/precos" className={navLink('/precos')}>
            Preços
          </a>
          <a href="/blog" className={navLink('/blog')}>
            Blog
          </a>
          <a href="/perguntas-frequentes" className={navLink('/perguntas-frequentes')}>
            FAQ
          </a>
          <a href="/sobre" className={navLink('/sobre')}>
            Sobre
          </a>
          <a href="/auth/login" className="bg-[#111111] border border-[#D4AF37] text-[#D4AF37] font-medium text-sm px-5 py-2 rounded-lg hover:bg-[#D4AF37]/10 transition-all duration-300 shadow-md shadow-[#D4AF37]/10">
            Entrar
          </a>
          <a
            href="/auth/cadastro"
            className="bg-[#D4AF37] text-[#1A1A1A] font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20"
          >
            Começar Agora
          </a>
        </nav>

        {/* Menu mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-[#D4AF37] hover:text-[#f2ca50] transition-colors"
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
        <div className="lg:hidden bg-[#111111] border-t border-[#D4AF37]/20 px-4 py-6 space-y-1">
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
