import type { ReactNode } from 'react';
import {
  HarmonyScoreDivider,
  HarmonyScoreRow,
  HarmonyScoreStack,
} from '../../landing/ProductResultFrame.js';
import { getScoreTierVisual } from '../../landing/score-tier-visual.js';

export interface ScorePanelTarget {
  nome: string;
  score: number;
}

export interface ChatScorePanelCardProps {
  birth: ScorePanelTarget;
  harmonized?: ScorePanelTarget | null;
  birthEyebrow?: string;
  harmonizedEyebrow?: string;
  className?: string;
}

/** Card de comparação Nota Hoje × Potencial usado no painel lateral do chat real e dos mockups. */
export function ChatScorePanelCard({
  birth,
  harmonized = null,
  harmonizedEyebrow = 'Nome harmonizado (Potencial)',
  birthEyebrow = 'Nome de nascimento (Nota Hoje)',
  className = '',
}: ChatScorePanelCardProps) {
  const dual = Boolean(harmonized);

  return (
    <HarmonyScoreStack className={`nm-reading-card text-left ${className}`}>
      {dual && harmonized ? (
        <>
          <HarmonyScoreRow
            eyebrow={harmonizedEyebrow}
            nome={harmonized.nome}
            score={harmonized.score}
            eyebrowTone="harmonized"
            emphasize
          />
          <HarmonyScoreDivider />
          <HarmonyScoreRow eyebrow={birthEyebrow} nome={birth.nome} score={birth.score} />
        </>
      ) : (
        <HarmonyScoreRow eyebrow={birthEyebrow} nome={birth.nome} score={birth.score} />
      )}
    </HarmonyScoreStack>
  );
}

export interface ChatProgressBarProps {
  currentStep: number;
  totalSteps: number;
  /** Mantido por compatibilidade com `ChatProgress`. */
  remaining?: number;
  className?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

/** Barra de progresso superior compartilhada entre `NomeSocialChat` e `ChatScene`. */
export function ChatProgressBar({
  currentStep,
  totalSteps,
  className = '',
  leading,
  trailing,
}: ChatProgressBarProps) {
  const percent = Math.min(
    100,
    Math.max(0, Math.round((currentStep / Math.max(totalSteps, 1)) * 100)),
  );
  const displayPercent = percent === 0 ? 0 : Math.max(5, percent);
  const visual = getScoreTierVisual(displayPercent);

  return (
    <header
      className={`w-full px-4 py-2.5 md:h-14 md:px-6 md:py-0 md:flex md:items-center ${className}`}
    >
      <div className="flex w-full items-center gap-3 md:gap-5 min-w-0">
        {leading ? <div className="hidden md:flex items-center shrink-0">{leading}</div> : null}

        <div className="flex-1 min-w-0 flex items-center justify-center">
          <div className="w-full max-w-2xl flex items-center gap-3 rounded-full bg-[#131313] border border-[#D4AF37]/25 px-3 sm:px-4 py-2 md:py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300">
            <span
              className="shrink-0 text-xs sm:text-sm font-semibold tabular-nums w-9 sm:w-10 text-right"
              style={{ color: visual.text }}
              aria-live="polite"
            >
              {percent}%
            </span>
            <div
              className="h-2.5 sm:h-3 min-w-0 flex-1 rounded-full bg-white/10 overflow-hidden"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso da análise"
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${visual.barGradient} transition-all duration-500 ease-out`}
                style={{ width: `${percent === 0 ? 0 : Math.max(displayPercent, 2)}%` }}
              />
            </div>
          </div>
        </div>

        {trailing ? <div className="shrink-0 flex items-center gap-2.5">{trailing}</div> : null}
      </div>
    </header>
  );
}

export interface ChatPanelHeaderProps {
  title?: string;
  hasSelection?: boolean;
  expanded?: boolean;
  titleId?: string;
  className?: string;
}

/** Cabeçalho "Painel de análise" compartilhado entre o chat real e o painel lateral dos mockups. */
export function ChatPanelHeader({
  title = 'Painel de análise',
  hasSelection = false,
  expanded = false,
  titleId,
  className = '',
}: ChatPanelHeaderProps) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 pr-10 ${className}`}>
      {hasSelection && (
        <span
          data-nm-selection-dot="true"
          className="w-2.5 h-2.5 rounded-full bg-[#f2ca50] shadow-[0_0_10px_rgba(242,202,80,0.65)] shrink-0"
          aria-hidden="true"
        />
      )}
      <h2
        id={titleId}
        data-expanded={expanded ? 'true' : 'false'}
        className="font-cinzel font-bold uppercase tracking-[0.1em] text-[#e5e2e1] text-left break-words whitespace-normal leading-snug min-w-0"
      >
        {title}
      </h2>
    </div>
  );
}

export interface ChatContextChipsProps {
  chips: ReadonlyArray<string>;
  label?: string;
  className?: string;
}

/** Pílulas de contexto do usuário exibidas no painel lateral. */
export function ChatContextChips({
  chips,
  label = 'Seu contexto',
  className = '',
}: ChatContextChipsProps) {
  if (!chips.length) return null;

  return (
    <div className={`w-full pt-2 border-t border-white/[0.06] text-left ${className}`}>
      <p className="text-[10px] uppercase font-cinzel tracking-wider text-chat-muted mb-2 text-left">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center rounded-full bg-[#141414] border border-[#D4AF37]/35 px-2.5 py-1 text-[11px] font-medium text-[#e5e2e1]"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
