import React, { useEffect, useRef, useState } from 'react';
import type { CandidateSuggestion } from './chat-types.js';
import { Pill } from '../../ui/Pill.js';
import { Button } from '../../ui/Button.js';
import { toggleSelection } from './selection.js';
import { HarmonySuggestionCard } from '../../landing/ProductResultFrame.js';
import { landingMockupTileClass } from '../../landing/LandingSectionIntro.js';
import { mapCandidateToHarmonySuggestion } from './harmony-suggestion-mapper.js';

export interface SuggestionPickerProps {
  suggestions: CandidateSuggestion[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRegenerate: () => void;
  analysisId?: string;
  isRegenerating?: boolean;
  onGenerateAnalysis?: () => void;
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
  analysisId,
  isRegenerating = false,
  onGenerateAnalysis,
  className = '',
}: SuggestionPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [stagger, setStagger] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setStagger(true);
      return;
    }

    setStagger(true);
  }, [suggestions.length]);

  const handleCardClick = (id: string) => {
    const nextSelected = toggleSelection(selectedId, id);
    onSelect(nextSelected);
  };

  const handleGenerateAnalysis = () => {
    onGenerateAnalysis?.();
    if (!analysisId) return;
    window.location.href = `/api/generate-pdf?id=${encodeURIComponent(analysisId)}`;
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
          const card = mapCandidateToHarmonySuggestion(sug);
          return (
            <div
              key={sug.id}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(sug.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(sug.id);
                }
              }}
              className={`min-w-0 w-full text-left cursor-pointer rounded-2xl transition-all duration-200 select-none ${
                isCurrentSelected
                  ? `ring-1 ring-[#D4AF37]/45 ${landingMockupTileClass}`
                  : 'hover:opacity-95'
              }`}
            >
              <HarmonySuggestionCard
                c={card}
                stagger={stagger}
                delayIndex={index}
                className={isCurrentSelected ? '!shadow-none' : ''}
              />
              {sug.destaque && (
                <p className="px-4 sm:px-5 pb-3 -mt-1 text-xs text-chat-muted italic">{sug.destaque}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Pill
          label={isRegenerating ? 'Gerando novas opções...' : 'Gerar outras opções'}
          size="lg"
          disabled={isRegenerating}
          onClick={onRegenerate}
          className="!border-white/20 text-chat-ink hover:!border-gold"
        />

        {analysisId && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleGenerateAnalysis}
            className="!rounded-full font-semibold shadow-gold w-full sm:w-auto"
          >
            Gerar análise
          </Button>
        )}
      </div>
    </div>
  );
}

export default SuggestionPicker;
