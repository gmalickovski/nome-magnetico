import React, { useState, useEffect, useRef } from 'react';

interface TocItem {
  id: string;
  text: string;
}

interface Props {
  items: TocItem[];
}

export function MobileTOC({ items }: Props) {
  const [open, setOpen]     = useState(false);
  const [dimmed, setDimmed] = useState(false); // true enquanto toca ou rola
  const [activeId, setActiveId] = useState('');
  const drawerRef     = useRef<HTMLDivElement>(null);
  const scrollTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchActive   = useRef(false);

  // ── Opacidade: escurece ao tocar na tela ou ao rolar ──────────────────────
  useEffect(() => {
    function dim() {
      setDimmed(true);
    }
    function undim() {
      touchActive.current = false;
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        if (!touchActive.current) setDimmed(false);
      }, 1200);
    }
    function onTouchStart() {
      touchActive.current = true;
      dim();
    }
    function onTouchEnd() {
      undim();
    }
    function onScroll() {
      dim();
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        if (!touchActive.current) setDimmed(false);
      }, 1200);
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true });
    document.addEventListener('touchcancel',onTouchEnd,   { passive: true });
    window.addEventListener('scroll',       onScroll,     { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend',   onTouchEnd);
      document.removeEventListener('touchcancel',onTouchEnd);
      window.removeEventListener('scroll',       onScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  // ── Highlight do item ativo ao rolar ──────────────────────────────────────
  useEffect(() => {
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  // ── Fecha ao clicar fora ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // ── Bloqueia scroll do body quando drawer aberto ──────────────────────────
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!items.length) return null;

  return (
    <>
      {/* ── Botão flutuante ─────────────────────────────────────────────────
          Posicionado na safe-area inferior (iOS notch / Android nav bar).
          Opacidade alta em repouso → quase invisível ao tocar/rolar.       */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ver índice do artigo"
        title="Índice do artigo"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
        }}
        className={`
          lg:hidden fixed right-4 z-40
          flex items-center justify-center w-10 h-10 rounded-full p-1
          bg-[#1a1a1a] border border-[#D4AF37]/30
          shadow-[0_8px_24px_rgba(0,0,0,0.6)]
          active:scale-95
          transition-opacity duration-500 ease-in-out
          ${dimmed ? 'opacity-20' : 'opacity-80'}
        `}
      >
        <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M4 6h16M4 10h10M4 14h12M4 18h8" />
        </svg>
      </button>

      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* ── Drawer bottom sheet ───────────────────────────────────────────── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label="Índice do artigo"
        aria-modal="true"
        className={`
          lg:hidden fixed bottom-0 left-0 right-0 z-50
          bg-[#161616] rounded-t-3xl
          shadow-[0_-20px_60px_rgba(0,0,0,0.7)]
          transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? 'translate-y-0' : 'translate-y-full'}
          max-h-[72vh] flex flex-col
        `}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Handle visual */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* Cabeçalho */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3">
          <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">
            Neste Artigo
          </p>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-600 hover:text-gray-300 p-1 -mr-1 transition-colors"
            aria-label="Fechar índice"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista — scroll independente */}
        <nav className="flex-1 overflow-y-auto px-5 pb-6 space-y-0.5">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setOpen(false)}
              className={`
                flex items-start gap-3 py-3 text-sm leading-snug
                border-l-2 pl-3 transition-all duration-200
                ${activeId === item.id
                  ? 'text-[#D4AF37] border-[#D4AF37]/60 font-medium'
                  : 'text-gray-400 border-white/8 hover:text-[#e5e2e1] hover:border-white/25'
                }
              `}
            >
              {item.text}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
