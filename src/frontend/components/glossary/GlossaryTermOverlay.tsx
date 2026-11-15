import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface GlossaryPreviewPayload {
  slug: string;
  term: string;
  categoryLabel: string;
  summary: string;
  href: string;
  rect: { top: number; bottom: number; left: number; width: number };
}

export interface GlossaryTermOverlayProps {
  baseHref?: '/app/glossario' | '/glossario';
}

const DESKTOP_BREAKPOINT = 1024;

function readPreviewFromElement(
  el: HTMLElement,
  defaultBaseHref: '/app/glossario' | '/glossario',
): GlossaryPreviewPayload | null {
  const slug = el.dataset.glossarySlug?.trim();
  const term = el.dataset.glossaryTerm?.trim();
  const summary = el.dataset.glossarySummary?.trim();
  if (!slug || !term) return null;

  const categoryLabel = el.dataset.glossaryCategory?.trim() || 'Glossário';
  const rawHref = el.getAttribute('href');
  const href = rawHref && rawHref.startsWith('/') ? rawHref : `${defaultBaseHref}/${slug}`;
  const box = el.getBoundingClientRect();

  return {
    slug,
    term,
    categoryLabel,
    summary: summary || 'Conceito da Numerologia Cabalística.',
    href,
    rect: {
      top: box.top,
      bottom: box.bottom,
      left: box.left,
      width: box.width,
    },
  };
}

/**
 * Controlador global de prévia para termos do glossário auto-linkados (`[data-glossary-slug]`).
 * - Desktop (`>= 1024px`): popover `.nm-floating-card` em hover/focus.
 * - Mobile (`< 1024px`): intercepta toque e abre bottom-sheet com `z-[95]` acima do `AppMobileDock` (`z-40`) e do `MobileReadingBottomSheet` (`z-[85]`).
 */
export function GlossaryTermOverlay({ baseHref = '/glossario' }: GlossaryTermOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [preview, setPreview] = useState<GlossaryPreviewPayload | null>(null);
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const closeTimerRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const cancelCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleDesktopClose = () => {
    cancelCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setPreview(null);
    }, 180);
  };

  useEffect(() => {
    setMounted(true);

    const handleMouseOver = (event: MouseEvent) => {
      if (window.innerWidth < DESKTOP_BREAKPOINT) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLElement>('[data-glossary-slug]');
      if (!anchor) return;
      const data = readPreviewFromElement(anchor, baseHref);
      if (!data) return;
      cancelCloseTimer();
      setMode('desktop');
      setPreview(data);
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (window.innerWidth < DESKTOP_BREAKPOINT) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLElement>('[data-glossary-slug]');
      if (!anchor) return;
      const related = event.relatedTarget as Node | null;
      if (related && cardRef.current?.contains(related)) return;
      scheduleDesktopClose();
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (window.innerWidth < DESKTOP_BREAKPOINT) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLElement>('[data-glossary-slug]');
      if (!anchor) return;
      const data = readPreviewFromElement(anchor, baseHref);
      if (!data) return;
      cancelCloseTimer();
      setMode('desktop');
      setPreview(data);
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (window.innerWidth < DESKTOP_BREAKPOINT) return;
      const related = event.relatedTarget as Node | null;
      if (related && cardRef.current?.contains(related)) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-glossary-slug]')) {
        scheduleDesktopClose();
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLElement>('[data-glossary-slug]');
      if (anchor && window.innerWidth < DESKTOP_BREAKPOINT) {
        event.preventDefault();
        const data = readPreviewFromElement(anchor, baseHref);
        if (!data) return;
        cancelCloseTimer();
        setMode('mobile');
        setPreview(data);
        return;
      }

      if (!anchor && cardRef.current && !cardRef.current.contains(target)) {
        setPreview(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreview(null);
      }
    };

    const handleScroll = () => {
      if (mode === 'desktop' && preview) {
        setPreview(null);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cancelCloseTimer();
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [baseHref, mode, preview]);

  if (!mounted || !preview) return null;

  if (mode === 'mobile') {
    return createPortal(
      <div
        className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 backdrop-blur-sm p-3 sm:items-center lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label={`Significado de ${preview.term}`}
        onClick={() => setPreview(null)}
      >
        <div
          ref={cardRef}
          onClick={(e) => e.stopPropagation()}
          className="nm-floating-card w-full max-w-md rounded-2xl p-5 shadow-[0_24px_64px_rgba(0,0,0,0.85)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#bea5ff]">
                {preview.categoryLabel}
              </span>
              <h3 className="mt-1 font-cinzel text-lg font-bold leading-snug text-[#f2ca50]">
                {preview.term}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setPreview(null)}
              aria-label="Fechar resumo do glossário"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#e5e2e1] hover:text-[#f2ca50]"
            >
              ✕
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#e5e2e1]/90">
            {preview.summary}
          </p>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-full px-4 py-2 text-xs font-medium text-[#A0A0A0] hover:text-[#e5e2e1]"
            >
              Fechar
            </button>
            <a
              href={preview.href}
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#131313] hover:bg-[#f2ca50]"
            >
              Ver explicação completa →
            </a>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // Desktop popover posicionado dentro dos limites visíveis da viewport
  const cardWidth = 340;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const left = Math.max(
    16,
    Math.min(vw - cardWidth - 16, preview.rect.left + preview.rect.width / 2 - cardWidth / 2),
  );
  const preferBelow = preview.rect.bottom + 210 < vh;
  const top = preferBelow ? preview.rect.bottom + 10 : Math.max(16, preview.rect.top - 188);

  return createPortal(
    <div
      ref={cardRef}
      role="tooltip"
      onMouseEnter={cancelCloseTimer}
      onMouseLeave={scheduleDesktopClose}
      style={{ top: `${top}px`, left: `${left}px`, width: `${cardWidth}px` }}
      className="fixed z-[95] nm-floating-card rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.75)] ring-1 ring-[#D4AF37]/30"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#bea5ff]">
          {preview.categoryLabel}
        </span>
        <button
          type="button"
          onClick={() => setPreview(null)}
          aria-label="Fechar prévia"
          className="text-xs text-[#A0A0A0] hover:text-[#e5e2e1]"
        >
          Esc
        </button>
      </div>
      <h4 className="mt-1 font-cinzel text-base font-bold text-[#f2ca50]">{preview.term}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-[#e5e2e1]/90">{preview.summary}</p>
      <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
        <a
          href={preview.href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:text-[#f2ca50]"
        >
          Ver explicação completa →
        </a>
      </div>
    </div>,
    document.body,
  );
}

export default GlossaryTermOverlay;
