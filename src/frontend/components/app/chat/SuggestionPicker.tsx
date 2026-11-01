import React, { useEffect, useRef, useState } from 'react';
import type { CandidateSuggestion } from './chat-types.js';
import { Pill } from '../../ui/Pill.js';
import { toggleSelection } from './selection.js';
import { HarmonySuggestionCard } from '../../landing/ProductResultFrame.js';
import { mapCandidateToHarmonySuggestion } from './harmony-suggestion-mapper.js';

export interface SuggestionPickerProps {
  suggestions: CandidateSuggestion[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
  regenerateNotice?: string | null;
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
  className = '',
}: SuggestionPickerProps) {
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

  return (
    <div ref={rootRef} className={`w-full space-y-4 ${className}`}>
      <div className="space-y-1">
        <h3 className="nm-h3 text-gold">Suas assinaturas recomendadas</h3>
        <p className="text-xs sm:text-sm text-chat-ink leading-relaxed">
          Toque em uma assinatura para ver a comparação detalhada no painel lateral.
        </p>
      </div>

      <div className="w-full min-w-0 flex flex-col gap-3 sm:gap-3.5">
        {suggestions.map((sug, index) => {
          const isCurrentSelected = selectedId === sug.id;
          const touchPulse = touchPulseId === sug.id;
          const card = mapCandidateToHarmonySuggestion(sug);
          return (
            <div
              key={sug.id}
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
                  <span className="absolute top-2 right-2 z-10 rounded-full bg-[#D4AF37] text-[#111111] text-[10px] font-semibold px-2 py-0.5">
                    ✓ Escolhido
                  </span>
                </>
              )}
              <div className={isCurrentSelected ? '[&_.nm-score-eyebrow]:text-[#D4AF37]' : ''}>
                <HarmonySuggestionCard
                  c={card}
                  stagger={stagger}
                  delayIndex={index}
                  className={`!shadow-none !bg-transparent !border-0 ${
                    isCurrentSelected ? '[&_.nm-h3]:text-[#D4AF37]' : ''
                  }`}
                />
              </div>
              {sug.destaque && (
                <p className="px-4 sm:px-5 pb-3 -mt-1 text-xs text-chat-muted italic">{sug.destaque}</p>
              )}
            </div>
          );
        })}
      </div>

      {regenerateNotice && (
        <p className="text-sm text-amber-300/90 leading-relaxed px-0.5" role="status">
          {regenerateNotice}
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-start gap-3 pt-2">
        <Pill
          label={isRegenerating ? 'Gerando novas opções...' : 'Gerar outras opções'}
          size="lg"
          disabled={isRegenerating}
          onClick={onRegenerate}
        />
      </div>
    </div>
  );
}

export default SuggestionPicker;
