import React, { useEffect, useRef, useState } from 'react';
import type { CandidateSuggestion } from './chat-types.js';
import { Pill } from '../../ui/Pill.js';
import { toggleSelection } from './selection.js';
import { HarmonySuggestionCard } from '../../landing/ProductResultFrame.js';
import { mapCandidateToHarmonySuggestion } from './harmony-suggestion-mapper.js';
import { dividirPorSecao, temSecoesArtisticas } from './artistic-suggestions-client.js';

export interface SuggestionPickerProps {
  suggestions: CandidateSuggestion[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
  regenerateNotice?: string | null;
  canRegenerate?: boolean;
  extraActionSlot?: React.ReactNode;
  extraNoticeSlot?: React.ReactNode;
  /** DEV-317: área "Teste um nome seu" (texto, campo e avisos). Fica sempre no fim, depois do "Gerar mais". */
  manualSlot?: React.ReactNode;
  /** DEV-317: muda quando a análise termina; rola até o início das sugestões. */
  scrollSistemaToken?: number;
  /** DEV-317: card a mostrar inteiro depois de testar um nome. */
  scrollCandidato?: { id: string; n: number } | null;
  className?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SuggestionPicker({
  suggestions,
  selectedId,
  onSelect,
  onRegenerate,
  isRegenerating = false,
  regenerateNotice = null,
  canRegenerate = true,
  extraActionSlot,
  extraNoticeSlot,
  manualSlot,
  scrollSistemaToken = 0,
  scrollCandidato = null,
  className = '',
}: SuggestionPickerProps) {
  const sistemaRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!scrollSistemaToken) return;
    const id = window.setTimeout(() => {
      sistemaRef.current?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }, 120);
    return () => window.clearTimeout(id);
  }, [scrollSistemaToken]);
  const sistema = suggestions.filter((s) => s.origem !== 'manual');
  const manuais = suggestions.filter((s) => s.origem === 'manual');
  const [manuaisAbertos, setManuaisAbertos] = useState(true);
  const [sistemaAberto, setSistemaAberto] = useState(true);
  useEffect(() => {
    if (!scrollCandidato) return;
    setManuaisAbertos(true);
    const id = window.setTimeout(() => {
      document
        .getElementById(`candidate-${scrollCandidato.id}`)
        ?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }, 160);
    return () => window.clearTimeout(id);
  }, [scrollCandidato]);
  const totalManuais = useRef(manuais.length);
  useEffect(() => {
    // Nome novo testado: abre a lista para a pessoa ver o card na hora.
    if (manuais.length > totalManuais.current) setManuaisAbertos(true);
    totalManuais.current = manuais.length;
  }, [manuais.length]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [stagger, setStagger] = useState(false);
  const [touchPulseId, setTouchPulseId] = useState<string | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setStagger(true);
      return;
    }
    setStagger(true);
  }, [suggestions.length]);

  const handleCardClick = (id: string) => {
    setTouchPulseId(id);
    window.setTimeout(() => setTouchPulseId(null), 120);
    const nextSelected = toggleSelection(selectedId, id);
    onSelect(nextSelected);
  };

  // DEV-317: a ordem vem do motor (Principal, Maior nota e depois a ordem de tentativas). Não reordenar.
  const renderCard = (sug: CandidateSuggestion, index: number) => {
      const isCurrentSelected = selectedId === sug.id;
      const touchPulse = touchPulseId === sug.id;
      const card = mapCandidateToHarmonySuggestion(sug);
      return (
        <div
          key={sug.id}
          id={`candidate-${sug.id}`}
          role="button"
          tabIndex={0}
          aria-pressed={isCurrentSelected}
          onClick={() => handleCardClick(sug.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardClick(sug.id);
            }
          }}
          className={`relative min-w-0 w-full text-left cursor-pointer rounded-2xl transition-all duration-150 select-none bg-[#1C1C1C] border focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] ${
            isCurrentSelected
              ? 'border-2 border-[#D4AF37] shadow-[0_0_0_4px_rgba(212,175,55,0.15)] scale-100 md:hover:-translate-y-0.5 md:hover:border-[#D4AF37]/60 md:hover:shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
              : touchPulse
                ? 'border border-[#D4AF37]/60 scale-[0.98]'
                : 'border border-[#D4AF37]/20 md:hover:-translate-y-0.5 md:hover:border-[#D4AF37]/60 md:hover:shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
          }`}
        >
          {isCurrentSelected && (
            <>
              <span className="absolute inset-0 rounded-2xl bg-[#D4AF37]/[0.06] pointer-events-none" />
            </>
          )}
          <div className={isCurrentSelected ? '[&_.nm-score-eyebrow]:text-[#D4AF37]' : ''}>
            <HarmonySuggestionCard
              c={card}
              stagger={stagger}
              delayIndex={index}
              showBlockBadgeInTags
              className={`!shadow-none !bg-transparent !border-0 ${
                isCurrentSelected ? '[&_.nm-h3]:text-[#D4AF37]' : ''
              }`}
            />
          </div>
          {(sug.principal || sug.maiorNota) && sug.origem !== 'manual' && (
            <p className="px-4 sm:px-5 pb-3 -mt-1 flex flex-wrap gap-1.5">
              {sug.principal && (
                <span className="inline-block rounded-full bg-gradient-to-r from-[#bea5ff]/25 to-[#d7c6ff]/15 text-[#d7c6ff] text-[10px] font-semibold tracking-wide px-2.5 py-0.5">
                  ✦ Principal
                </span>
              )}
              {sug.maiorNota && (
                <span className="inline-block rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-semibold tracking-wide px-2.5 py-0.5">
                  ★ Maior nota
                </span>
              )}
            </p>
          )}
          {sug.origem === 'manual' && <p className="px-4 pb-3 text-sm text-[#d7c6ff]">Nome informado por você</p>}
          {sug.destaque && (
            <p className="px-4 sm:px-5 pb-3 -mt-1 text-xs text-chat-muted italic">{sug.destaque}</p>
          )}
        </div>
      );
  };

  const cabecalho = (
    id: string,
    titulo: string,
    total: number,
    aberto: boolean,
    alternar: () => void,
    controla: string,
    cor: string,
  ) => (
    <div className="flex items-center justify-between gap-3">
      <h3 id={id} className={`font-cinzel text-base sm:text-lg font-bold ${cor}`}>
        {titulo}
        {total > 0 && <span className="ml-2 font-inter text-xs font-medium text-chat-muted">({total})</span>}
      </h3>
      {total > 0 && (
        <button
          type="button"
          onClick={alternar}
          aria-expanded={aberto}
          aria-controls={controla}
          aria-label={`${aberto ? 'Esconder' : 'Mostrar'} ${titulo}`}
          title={aberto ? 'Esconder' : 'Mostrar'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-chat-ink transition-colors duration-300 hover:bg-white/5"
        >
          <svg
            className={`h-5 w-5 transition-transform duration-300 ${aberto ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div ref={rootRef} className={`w-full space-y-4 ${className}`}>
      <section
        ref={sistemaRef}
        aria-labelledby="system-names-title"
        className="scroll-mt-3 rounded-2xl bg-[#161616] p-4 sm:p-5 space-y-4"
      >
        {cabecalho('system-names-title', 'Sugestões do sistema', sistema.length, sistemaAberto, () => setSistemaAberto((v) => !v), 'system-names-list', 'text-gold')}
        {sistemaAberto && (
          <div id="system-names-list" className="w-full min-w-0 flex flex-col gap-3 sm:gap-3.5">
            {temSecoesArtisticas(sistema) ? (
              // DEV-321: ramo artístico, duas seções (próximos do nascimento e nomes novos).
              (() => {
                const s = dividirPorSecao(sistema);
                const grupo = (titulo: string, dica: string, itens: typeof sistema, inicio: number) =>
                  itens.length > 0 && (
                    <div className="flex flex-col gap-3 sm:gap-3.5" role="group" aria-label={titulo}>
                      <div>
                        <h4 className="font-inter text-[11px] font-medium uppercase tracking-[0.1em] text-[#d7c6ff]">
                          {titulo} <span className="text-chat-muted">({itens.length})</span>
                        </h4>
                        <p className="text-xs text-chat-muted mt-0.5">{dica}</p>
                      </div>
                      {itens.map((sug, i) => renderCard(sug, inicio + i))}
                    </div>
                  );
                return (
                  <>
                    {grupo('Nomes artísticos próximos do seu', 'Formas do seu próprio nome, pensadas para o palco.', s.proximos, 0)}
                    {grupo('Nomes totalmente novos', 'Nomes criados para o seu estilo e testados no seu mapa.', s.novos, s.proximos.length)}
                    {s.outros.map((sug, i) => renderCard(sug, s.proximos.length + s.novos.length + i))}
                  </>
                );
              })()
            ) : (
              sistema.map((sug, index) => renderCard(sug, index))
            )}
          </div>
        )}

        {regenerateNotice && (
          <p className="text-xs text-amber-300/90 leading-relaxed px-0.5" role="status">
            {regenerateNotice}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 pt-1">
          <Pill
            label={isRegenerating ? 'Gerando novas opções...' : 'Gerar outras opções'}
            size="lg"
            disabled={isRegenerating || !canRegenerate}
            onClick={onRegenerate}
            className="w-full sm:w-auto shrink-0"
          />
          {extraActionSlot}
        </div>
        {!canRegenerate && sistema.length > 0 && (
          <p className="text-xs text-chat-muted leading-relaxed">Você já viu todas as sugestões desta rodada.</p>
        )}
        {extraNoticeSlot}
      </section>

      {manualSlot && (
        <section aria-labelledby="manual-names-title" className="rounded-2xl bg-[#161616] p-4 sm:p-5 space-y-4">
          {cabecalho('manual-names-title', 'Suas sugestões', manuais.length, manuaisAbertos, () => setManuaisAbertos((v) => !v), 'manual-names-list', 'text-gold')}
          {manualSlot}
          {manuais.length > 0 && manuaisAbertos && (
            <div id="manual-names-list" className="w-full min-w-0 flex flex-col gap-3 sm:gap-3.5">
              {[...manuais].reverse().map((sug, index) => renderCard(sug, index))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default SuggestionPicker;
