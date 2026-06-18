import React, { useState, useEffect, useRef } from 'react';

export function GlossaryHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dispara evento de busca para o filtro client-side da página
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('glossary:search', { detail: searchQuery }));
  }, [searchQuery]);

  // Foca o input ao abrir busca mobile
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => mobileSearchRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#111111]/95 backdrop-blur-md border-b border-[#D4AF37]/15 py-3'
          : 'bg-[#111111]/80 backdrop-blur-sm py-4'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12 flex items-center gap-3">

        {/* ── Logo ── */}
        <a href="/glossario" className="hover:opacity-80 transition-opacity flex-shrink-0">
          <img src="/logo-nm-header-blog-dark.svg" alt="Nome Magnético · Glossário" className="h-9 sm:h-10 md:h-11 w-auto" />
        </a>

        {/* ── Search desktop (md+) ── */}
        <div className="hidden md:flex flex-1 max-w-[260px] xl:max-w-sm mx-2">
          <div className="relative w-full">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar termos..."
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-7 py-2 text-xs text-[#e5e2e1] placeholder-gray-600
                         focus:outline-none focus:border-[#D4AF37]/40 focus:bg-white/8 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                aria-label="Limpar busca"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Nav desktop ── */}
        <nav className="hidden md:flex items-center gap-2 ml-auto flex-shrink-0">
          <span className="w-px h-4 bg-white/10 flex-shrink-0" aria-hidden="true" />

          {/* Análise Gratuita */}
          <a
            href="/analise-gratuita"
            className="flex items-center gap-1.5 bg-[#D4AF37] text-[#1A1A1A] font-semibold text-xs px-3 py-2 rounded-xl
                       hover:bg-[#f2ca50] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                       shadow-md shadow-[#D4AF37]/20 whitespace-nowrap"
          >
            Análise Gratuita
          </a>

          {/* Blog */}
          <a
            href="/blog"
            className="text-gray-500 hover:text-[#e5e2e1] text-xs font-medium px-2 py-2 rounded-xl hover:bg-white/5 transition-all duration-200 whitespace-nowrap"
          >
            Blog
          </a>

          {/* Home */}
          <a
            href="/"
            className="flex items-center text-gray-500 hover:text-[#e5e2e1] text-xs font-medium p-2 rounded-xl hover:bg-white/5 transition-all duration-200"
            title="Voltar ao site principal"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </a>
        </nav>

        {/* ── Mobile: lupa + hamburguer ── */}
        <div className="md:hidden flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => { setSearchOpen(v => !v); setMenuOpen(false); }}
            className={`p-2 rounded-xl transition-colors ${
              searchOpen ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-gray-500 hover:text-[#D4AF37]'
            }`}
            aria-label={searchOpen ? 'Fechar busca' : 'Buscar'}
          >
            {searchOpen ? (
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => { setMenuOpen(v => !v); setSearchOpen(false); }}
            className="text-[#D4AF37] hover:text-[#f2ca50] transition-colors p-1"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Painel de busca mobile ── */}
      {searchOpen && (
        <div className="md:hidden border-t border-white/8 bg-[#111111]/98 px-4 py-3">
          {/* max-w-lg garante que não ocupe tela inteira em iPads */}
          <div className="max-w-lg mx-auto relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={mobileSearchRef}
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar termos..."
              className="w-full bg-white/6 border border-[#D4AF37]/20 rounded-xl pl-9 pr-9 py-2.5 text-sm text-[#e5e2e1]
                         placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="Limpar"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Menu mobile ── */}
      {menuOpen && (
        <div className="md:hidden bg-[#111111]/98 border-t border-[#D4AF37]/12 px-4 py-5 space-y-3">
          <a
            href="/analise-gratuita"
            className="flex items-center justify-center bg-[#D4AF37] text-[#1A1A1A] font-semibold text-sm py-3 rounded-xl hover:bg-[#f2ca50] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Análise Gratuita
          </a>
          <div className="flex gap-3">
            <a
              href="/blog"
              className="flex-1 flex items-center justify-center text-gray-400 text-sm py-3 rounded-xl border border-white/10 hover:border-[#D4AF37]/25 hover:text-[#D4AF37] transition-all"
              onClick={() => setMenuOpen(false)}
            >
              Blog
            </a>
            <a
              href="/"
              className="flex items-center justify-center gap-2 text-gray-400 text-sm py-3 px-4 rounded-xl border border-white/10 hover:border-[#D4AF37]/25 hover:text-[#D4AF37] transition-all"
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
