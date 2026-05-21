import React, { useState, useEffect, useRef } from 'react';

const CATEGORIES = [
  { label: 'Todos os artigos', slug: '' },
  { label: 'Numerologia', slug: 'numerologia' },
  { label: 'Bloqueios Energéticos', slug: 'bloqueios' },
  { label: 'Nome Social', slug: 'nome-social' },
  { label: 'Nome para Bebê', slug: 'nome-bebe' },
  { label: 'Nome Empresarial', slug: 'nome-empresa' },
  { label: 'Espiritualidade', slug: 'espiritualidade' },
];

interface Props {
  activeCategory?: string;
}

export function BlogHeader({ activeCategory = '' }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const catRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Carrega o tema inicial
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-blog-theme') as 'dark' | 'light';
    if (currentTheme) {
      setTheme(currentTheme);
    }
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-blog-theme', next);
    localStorage.setItem('blog-theme', next);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Dispara evento de busca para o filtro client-side da página
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('blog:search', { detail: searchQuery }));
  }, [searchQuery]);

  // Foca o input ao abrir busca mobile
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => mobileSearchRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  const activeCatLabel = CATEGORIES.find(c => c.slug === activeCategory)?.label;

  // Estilos de link de nav idênticos ao LandingHeader
  function navLink(active: boolean): string {
    const base = 'relative transition-colors text-sm after:absolute after:bottom-0 after:left-0 after:h-px after:bg-[#D4AF37] after:transition-all after:duration-300';
    return active
      ? `${base} text-[#D4AF37] after:w-full`
      : `${base} text-gray-400 hover:text-[#D4AF37] after:w-0 hover:after:w-full`;
  }

  return (
    <header
      className={`blog-header fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? `bg-[#111111]/95 backdrop-blur-md ${menuOpen || searchOpen ? 'border-transparent' : 'border-[#D4AF37]/15'}`
          : 'bg-[#111111]/80 backdrop-blur-sm border-transparent'
      }`}
    >
      <div className={`max-w-6xl mx-auto px-4 flex items-center gap-3 ${scrolled ? 'py-3' : 'py-4'}`}>

        {/* ── Logo ── */}
        <a href="/blog" className="hover:opacity-80 transition-opacity flex-shrink-0">
          <img
            src={theme === 'light' ? '/logo-nm-header-blog-light.svg' : '/logo-nm-header-blog-dark.svg'}
            alt="Nome Magnético · Blog"
            className="h-9 sm:h-10 md:h-11 w-auto"
          />
        </a>

        {/* ── Search desktop (md+) ── */}
        <div className="hidden md:flex flex-1 max-w-[200px] xl:max-w-xs mx-2">
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
              placeholder="Pesquisar artigos..."
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

        {/* ── Nav desktop — espaçamento e tamanhos iguais ao LandingHeader ── */}
        <nav className="hidden md:flex items-center gap-4 xl:gap-6 ml-auto flex-shrink-0">

          {/* Dropdown Categorias */}
          <div ref={catRef} className="relative py-2 -my-2">
            <button
              onClick={() => setCatOpen(v => !v)}
              className={`relative flex items-center gap-1.5 transition-colors text-sm after:absolute after:bottom-0 after:left-0 after:h-px after:bg-[#D4AF37] after:transition-all after:duration-300 ${
                catOpen || activeCategory
                  ? 'text-[#D4AF37] after:w-full'
                  : 'text-gray-400 hover:text-[#D4AF37] after:w-0 hover:after:w-full'
              }`}
              aria-expanded={catOpen}
            >
              <svg className="w-3.5 h-3.5 opacity-60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
              </svg>
              <span className="whitespace-nowrap">
                {activeCategory && activeCatLabel ? activeCatLabel : 'Categorias'}
              </span>
              <svg
                className={`w-3 h-3 opacity-50 flex-shrink-0 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {catOpen && (
              <div className="blog-dropdown absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#D4AF37]/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden py-1.5 z-50">
                {CATEGORIES.map(cat => (
                  <a
                    key={cat.slug}
                    href={cat.slug ? `/blog?categoria=${cat.slug}` : '/blog'}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      activeCategory === cat.slug
                        ? 'text-[#D4AF37] bg-[#D4AF37]/8'
                        : 'text-[#e5e2e1] hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setCatOpen(false)}
                  >
                    {cat.label}
                    {activeCategory === cat.slug && (
                      <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Sobre o Blog — link de menu padrão */}
          <a href="/blog/sobre" className={navLink(false)}>
            Sobre
          </a>

          {/* Análise Gratuita — agora link de menu padrão (sem botão dourado) */}
          <a href="/analise-gratuita" className={navLink(false)}>
            Análise Gratuita
          </a>

          {/* Separador */}
          <span className="w-px h-4 bg-white/10 flex-shrink-0 blog-separator" aria-hidden="true" />

          {/* Theme Toggle Button — mesmo estilo do botão Home */}
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 border ${
              theme === 'dark'
                ? 'bg-transparent border-white/30 text-white hover:text-[#D4AF37] hover:border-[#D4AF37]/50 hover:bg-white/5'
                : 'bg-transparent border-black/30 text-[#1c1917] hover:text-[#92700a] hover:border-[#92700a]/50 hover:bg-black/5'
            }`}
            aria-label="Alternar tema"
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? (
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </nav>

        {/* ── Mobile: lupa + hamburguer ── */}
        <div className="md:hidden flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => { setSearchOpen(v => !v); setMenuOpen(false); }}
            className={`p-2 rounded-xl transition-colors ${
              searchOpen ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-[#e5e2e1] hover:text-[#D4AF37]'
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
        <div className="blog-dropdown md:hidden border-t border-[#D4AF37]/12 bg-[#111111] px-4 py-3">
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
              placeholder="Pesquisar artigos..."
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
        <div className="blog-dropdown md:hidden bg-[#111111] border-t border-[#D4AF37]/12 px-4 py-5">

          {/* Cabeçalho do menu: título + theme toggle */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest">Menu</p>
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                theme === 'dark'
                  ? 'border-white/15 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30'
                  : 'border-black/15 text-gray-500 hover:text-[#92700a] hover:border-[#92700a]/30'
              }`}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  <span>Tema claro</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-[#92700a]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  <span>Tema escuro</span>
                </>
              )}
            </button>
          </div>

          {/* Links principais */}
          <div className="space-y-0.5 mb-4">
            <a
              href="/blog"
              className="block py-2.5 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Todos os Artigos
            </a>
            <a
              href="/blog/sobre"
              className="block py-2.5 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Sobre o Blog
            </a>
            <a
              href="/analise-gratuita"
              className="block py-2.5 text-sm text-[#D4AF37]/80 hover:text-[#D4AF37] font-medium transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Análise Gratuita
            </a>
          </div>

          {/* Categorias */}
          <div className="border-t border-white/6 pt-4">
            <p className="text-gray-700 text-[10px] font-medium uppercase tracking-widest mb-3">Categorias</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.filter(c => c.slug !== '').map(cat => (
                <a
                  key={cat.slug}
                  href={`/blog?categoria=${cat.slug}`}
                  className={`text-xs font-medium px-3 py-2.5 rounded-xl text-center transition-all ${
                    activeCategory === cat.slug
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25'
                      : 'bg-white/4 text-gray-400 hover:text-[#D4AF37] border border-white/5'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {cat.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
