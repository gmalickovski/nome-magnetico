import React from 'react';
import type { CandidateSuggestion } from './chat-types.js';
import { Pill } from '../../ui/Pill.js';
import { Button } from '../../ui/Button.js';
import { toggleSelection } from './selection.js';

export interface SuggestionPickerProps {
  suggestions: CandidateSuggestion[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRegenerate: () => void;
  analysisId?: string;
  isRegenerating?: boolean;
  className?: string;
}

export function SuggestionPicker({
  suggestions,
  selectedId,
  onSelect,
  onRegenerate,
  analysisId,
  isRegenerating = false,
  className = '',
}: SuggestionPickerProps) {
  const handleCardClick = (id: string) => {
    const nextSelected = toggleSelection(selectedId, id);
    onSelect(nextSelected);
  };

  const handlePdfClick = () => {
    if (!analysisId) return;
    window.location.href = `/api/generate-pdf?id=${encodeURIComponent(analysisId)}`;
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="space-y-1">
        <h3 className="nm-h3 text-gold">Suas assinaturas recomendadas</h3>
        <p className="text-xs sm:text-sm text-chat-ink leading-relaxed">
          Toque em uma assinatura para ver a comparação detalhada no painel lateral.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {suggestions.map((sug) => {
          const isCurrentSelected = selectedId === sug.id;
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
              className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none ${
                isCurrentSelected
                  ? 'border-gold bg-gold/15 shadow-gold'
                  : 'border-white/10 bg-black/40 hover:border-gold/50 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-cinzel font-bold text-base sm:text-lg text-chat-ink">
                  {sug.nome}
                </span>
                <span className="font-cinzel font-bold text-sm text-gold px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20">
                  {sug.score} / 100
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-brand-spiritual font-medium">
                  Expressão {sug.expressao}
                </span>
                <span className="text-chat-muted">·</span>
                <span className="text-chat-ink">
                  Compatibilidade: {sug.compatibilidade}
                </span>
                {sug.bloqueiosEliminados > 0 && (
                  <>
                    <span className="text-chat-muted">·</span>
                    <span className="text-brand-success font-medium">
                      {sug.bloqueiosEliminados} bloqueios eliminados
                    </span>
                  </>
                )}
              </div>

              {sug.destaque && (
                <div className="mt-2 text-xs text-chat-muted italic">
                  {sug.destaque}
                </div>
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
            onClick={handlePdfClick}
            className="!rounded-full font-semibold shadow-gold w-full sm:w-auto"
          >
            Gerar análise completa (PDF)
          </Button>
        )}
      </div>
    </div>
  );
}

export default SuggestionPicker;
