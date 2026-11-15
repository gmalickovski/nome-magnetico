import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getCanonicalGlossaryBySlug } from '../../../shared/glossary/canonical-terms';

/** Prévia não modal, fora dos containers com overflow, com acesso por toque e teclado. */
export function GlossaryInlineTerm({ slug, children }: { slug: string; children: ReactNode }) {
  const term = getCanonicalGlossaryBySlug(slug);
  const id = `glossary-${useId().replace(/:/g, '')}`;
  const suppressFocus = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const cancelClose = () => clearTimeout(timer.current);
  const closeLater = () => { cancelClose(); timer.current = setTimeout(() => { if (document.activeElement !== trigger.current && !popup.current?.contains(document.activeElement)) setOpen(false); }, 180); };
  const show = () => { cancelClose(); setOpen(true); };

  useEffect(() => {
    const otherPreview = (event: Event) => { if ((event as CustomEvent).detail !== id) setOpen(false); };
    document.addEventListener('nm-glossary-preview-open', otherPreview);
    return () => { cancelClose(); document.removeEventListener('nm-glossary-preview-open', otherPreview); };
  }, [id]);
  useEffect(() => {
    if (!open) return;
    document.dispatchEvent(new CustomEvent('nm-glossary-preview-open', { detail: id }));
    const positionPopup = () => {
      const box = trigger.current?.getBoundingClientRect();
      if (!box) return;
      const width = Math.min(340, window.innerWidth - 24);
      const height = popup.current?.offsetHeight ?? 240;
      setPosition({
        left: Math.max(12, Math.min(box.left, window.innerWidth - width - 12)),
        top: Math.max(12, Math.min(window.innerHeight - height - 12, box.bottom + height + 12 <= window.innerHeight ? box.bottom + 8 : box.top - height - 8)),
      });
    };
    const outside = (event: PointerEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelClose();
        if (popup.current?.contains(document.activeElement)) { suppressFocus.current = true; trigger.current?.focus(); }
        setOpen(false);
      }
    };
    positionPopup();
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', positionPopup);
    window.addEventListener('scroll', positionPopup, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', positionPopup);
      window.removeEventListener('scroll', positionPopup, true);
    };
  }, [open]);

  if (!term) return <>{children}</>;
  return <>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={open ? id : undefined}
      className="rounded-sm text-inherit underline decoration-dotted decoration-[#d4af37]/70 underline-offset-4 hover:text-[#f2ca50] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff]"
      onMouseEnter={() => {
        const focused = document.activeElement;
        if (focused !== trigger.current && (focused?.closest('[data-glossary-preview]') || focused?.matches('[aria-expanded="true"][aria-controls^="glossary-"]'))) return;
        show();
      }} onMouseLeave={closeLater} onFocus={() => { if (suppressFocus.current) { suppressFocus.current = false; return; } show(); }}
      onBlur={event => { if (!popup.current?.contains(event.relatedTarget)) closeLater(); }}
      onClick={show}
      onKeyDown={event => {
        if (open && (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey))) {
          event.preventDefault(); link.current?.focus();
        }
      }}
    >{children}</button>
    {open && createPortal(
      <div ref={popup} id={id} data-glossary-preview role="region" aria-label={`Significado de ${term.term}`}
        className="nm-floating-card fixed z-[100] w-[340px] max-w-[calc(100vw-24px)] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-2xl bg-[#1c1c1c] p-5 text-sm leading-relaxed text-[#e5e2e1] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        style={{ ...position, position: 'fixed' }} onMouseEnter={cancelClose} onMouseLeave={closeLater}
        onFocus={cancelClose} onBlur={event => { if (!popup.current?.contains(event.relatedTarget) && event.relatedTarget !== trigger.current) closeLater(); }}>
        <p className="font-cinzel font-bold text-[#f2ca50]">{term.term}</p>
        <p className="mt-2">{term.shortSummary}</p>
        <a ref={link} href={`/app/glossario/${term.slug}`} className="mt-3 inline-flex min-h-11 items-center text-[#d7c6ff] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff]"
          onKeyDown={event => {
            if (event.key !== 'Tab') return;
            event.preventDefault();
            if (event.shiftKey) { trigger.current?.focus(); return; }
            const focusable = Array.from(document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')).filter(el => el.getClientRects().length && !popup.current?.contains(el));
            const index = focusable.indexOf(trigger.current!);
            setOpen(false); focusable[index + 1]?.focus();
          }}>Ver no glossário</a>
      </div>, document.body)}
  </>;
}
