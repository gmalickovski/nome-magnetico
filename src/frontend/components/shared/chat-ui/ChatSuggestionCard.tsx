import React from 'react';
import {
  HarmonySuggestionCard,
  type HarmonySuggestionCardData,
} from '../../landing/ProductResultFrame.js';

export interface ChatSuggestionCardProps {
  id?: string;
  card: HarmonySuggestionCardData;
  selected?: boolean;
  touchPulse?: boolean;
  principal?: boolean;
  maiorNota?: boolean;
  origem?: 'gerado' | 'manual';
  destaque?: string | null;
  stagger?: boolean;
  delayIndex?: number;
  onSelect?: () => void;
  /** Quando false (ex.: dentro de mockup `aria-hidden`), omite role/tabIndex interativos. */
  interactive?: boolean;
  className?: string;
}

/**
 * Card de sugestão completo usado no `SuggestionPicker` do chat real e nos mockups da landing.
 */
export function ChatSuggestionCard({
  id,
  card,
  selected = false,
  touchPulse = false,
  principal = false,
  maiorNota = false,
  origem,
  destaque,
  stagger = true,
  delayIndex = 0,
  onSelect,
  interactive = true,
  className = '',
}: ChatSuggestionCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onSelect) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      id={id}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? selected : undefined}
      onClick={interactive ? onSelect : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      className={`relative min-w-0 w-full text-left rounded-2xl transition-all duration-150 select-none bg-[#1C1C1C] border ${
        interactive ? 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]' : ''
      } ${
        selected
          ? 'border-2 border-[#D4AF37] shadow-[0_0_0_4px_rgba(212,175,55,0.15)] scale-100 md:hover:-translate-y-0.5 md:hover:border-[#D4AF37]/60 md:hover:shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
          : touchPulse
            ? 'border border-[#D4AF37]/60 scale-[0.98]'
            : 'border border-[#D4AF37]/20 md:hover:-translate-y-0.5 md:hover:border-[#D4AF37]/60 md:hover:shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
      } ${className}`}
    >
      {selected && (
        <span className="absolute inset-0 rounded-2xl bg-[#D4AF37]/[0.06] pointer-events-none" />
      )}
      <div className={selected ? '[&_.nm-score-eyebrow]:text-[#D4AF37]' : ''}>
        <HarmonySuggestionCard
          c={card}
          stagger={stagger}
          delayIndex={delayIndex}
          showBlockBadgeInTags
          className={`!shadow-none !bg-transparent !border-0 ${
            selected ? '[&_.nm-h3]:text-[#D4AF37]' : ''
          }`}
        />
      </div>
      {(principal || maiorNota) && origem !== 'manual' && (
        <p className="px-4 sm:px-5 pb-3 -mt-1 flex flex-wrap gap-1.5">
          {principal && (
            <span className="inline-block rounded-full bg-gradient-to-r from-[#bea5ff]/25 to-[#d7c6ff]/15 text-[#d7c6ff] text-[10px] font-semibold tracking-wide px-2.5 py-0.5">
              ✦ Principal
            </span>
          )}
          {maiorNota && (
            <span className="inline-block rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-semibold tracking-wide px-2.5 py-0.5">
              ★ Maior nota
            </span>
          )}
        </p>
      )}
      {origem === 'manual' && (
        <p className="px-4 pb-3 text-sm text-[#d7c6ff]">Nome informado por você</p>
      )}
      {destaque && (
        <p className="px-4 sm:px-5 pb-3 -mt-1 text-xs text-chat-muted italic">{destaque}</p>
      )}
    </div>
  );
}

export interface ChatSuggestionSectionHeaderProps {
  titulo: string;
  count: number;
  dica?: string;
  className?: string;
}

/** Cabeçalho de grupo usado nas seções do caminho Artístico e do caminho Bebê. */
export function ChatSuggestionSectionHeader({
  titulo,
  count,
  dica,
  className = '',
}: ChatSuggestionSectionHeaderProps) {
  return (
    <div className={className}>
      <h4 className="font-inter text-[11px] font-medium uppercase tracking-[0.1em] text-[#d7c6ff]">
        {titulo} <span className="text-chat-muted">({count})</span>
      </h4>
      {dica ? <p className="text-xs text-chat-muted mt-0.5">{dica}</p> : null}
    </div>
  );
}

export interface BabyGoodDayItem {
  dia: string;
  nota: number;
  bom: boolean;
}

/** Tira visual dos dias bons da janela do parto (tema bebê). */
export function ChatBabyGoodDaysStrip({
  dias,
  titulo = 'Janela prevista · dias mais harmônicos',
  className = '',
}: {
  dias: ReadonlyArray<BabyGoodDayItem>;
  titulo?: string;
  className?: string;
}) {
  if (!dias.length) return null;

  return (
    <div className={`rounded-2xl bg-[#181818] p-3.5 border border-white/[0.06] ${className}`}>
      <p className="font-inter text-[11px] font-medium uppercase tracking-[0.1em] text-[#d7c6ff] mb-2">
        {titulo}
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {dias.map((d) => (
          <div
            key={d.dia}
            className={`rounded-xl px-2 py-1.5 text-center border ${
              d.bom
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                : 'bg-[#141414] border-white/[0.06] text-chat-muted'
            }`}
          >
            <div className="text-[10px] font-inter font-medium">{d.dia}</div>
            <div className="text-xs font-cinzel font-bold tabular-nums">{d.nota}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
