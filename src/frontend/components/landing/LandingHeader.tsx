import React, { useState, useEffect, useRef } from 'react';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (productsRef.current && !productsRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const PRODUCT_PATHS = ['/nome-social', '/nome-bebe', '/nome-empresarial'];
  const isProductsActive = PRODUCT_PATHS.some(p => currentPath === p || currentPath.startsWith(p + '/'));

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

          {/* Dropdown Produtos */}
          <div
            ref={productsRef}
            className="relative py-2 -my-2"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              className={`relative flex items-center gap-1 transition-colors text-sm ${
                productsOpen ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-[#D4AF37]'
              } after:absolute after:bottom-0 after:left-0 after:h-px after:bg-[#D4AF37] after:transition-all after:duration-300 ${
                productsOpen ? 'after:w-full' : 'after:w-0 hover:after:w-full'
              }`}
              onClick={() => setProductsOpen(v => !v)}
              aria-expanded={productsOpen}
            >
              Produtos
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {productsOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-56 z-50">
                {/* bridge invisível para o mouse não sair da área hover */}
                <div className="absolute -top-3 left-0 right-0 h-3" />
                <div className="bg-[#1a1a1a] border border-[#D4AF37]/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden py-2">
                  <a
                    href="/nome-social"
                    className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-[#D4AF37] hover:bg-white/5 transition-all text-sm"
                    onClick={() => setProductsOpen(false)}
                  >
                    <span className="text-[#D4AF37] text-base leading-none">✦</span>
                    <span>Nome Social</span>
                  </a>
                  <a
                    href="/nome-bebe"
                    className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-[#D4AF37] hover:bg-white/5 transition-all text-sm"
                    onClick={() => setProductsOpen(false)}
                  >
                    <span className="text-base leading-none">👶</span>
                    <span>Nome para Bebê</span>
                  </a>
                  <a
                    href="/nome-empresarial"
                    className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-[#D4AF37] hover:bg-white/5 transition-all text-sm"
                    onClick={() => setProductsOpen(false)}
                  >
                    <span className="text-base leading-none">🏢</span>
                    <span>Nome Empresarial</span>
                  </a>
                </div>
              </div>
            )}
          </div>

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
          <a href="/precos" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Preços</a>
          <a href="/blog" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Blog</a>
          <a href="/perguntas-frequentes" className="block text-gray-400 hover:text-[#D4AF37] py-2.5 text-sm" onClick={() => setMenuOpen(false)}>Perguntas Frequentes</a>
          <a href="/sobre" className={mobileLink('/sobre')} onClick={() => setMenuOpen(false)}>Sobre</a>

          <div className="border-t border-white/8 pt-3 mt-3 space-y-1">
            <p className="text-gray-600 text-xs uppercase tracking-widest px-1 pb-1">Produtos</p>
            <a href="/nome-social" className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] py-2 text-sm" onClick={() => setMenuOpen(false)}>
              <span className="text-[#D4AF37] text-xs">✦</span> Nome Social
            </a>
            <a href="/nome-bebe" className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] py-2 text-sm" onClick={() => setMenuOpen(false)}>
              <span>👶</span> Nome para Bebê
            </a>
            <a href="/nome-empresarial" className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] py-2 text-sm" onClick={() => setMenuOpen(false)}>
              <span>🏢</span> Nome Empresarial
            </a>
          </div>

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
