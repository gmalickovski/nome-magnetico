import React from 'react';
import type {
  ChatReadingSummary,
  RadarAxesData,
  ResultPanelData,
} from './chat-types.js';
import { ReadingRadar } from './ReadingRadar.js';
import ReadingTopicCard from './ReadingTopicCard.js';
import { getScoreTierVisual } from '../../landing/score-tier-visual.js';

import { ChatHarmonyScoreCard } from './ChatHarmonyScoreCard.js';
import { ChatHarmonyStarPanel } from './ChatHarmonyStarPanel.js';
import { ChatReadingSummaryPanel } from './ChatReadingSummaryPanel.js';

const RADAR_AXES_EXPLANATIONS: ReadonlyArray<{
  key: keyof RadarAxesData;
  defaultLabel: string;
  description: string;
}> = [
  {
    key: 'expressao',
    defaultLabel: 'Foco do Momento',
    description:
      'Mede a afinidade do número de Expressão com a área prioritária escolhida por você, descontando eventuais bloqueios do Triângulo da Vida ligados a esse tema.',
  },
  {
    key: 'motivacao',
    defaultLabel: 'Equilíbrio da Alma',
    description:
      'Avalia a sintonia interna entre a Motivação (vogais do nome) e a Expressão, combinada à estabilidade emocional refletida no Triângulo Pessoal.',
  },
  {
    key: 'destino',
    defaultLabel: 'Sintonia de Destino',
    description:
      'Representa o grau de harmonia formal entre a Expressão do nome e o seu número de Destino (data de nascimento), reforçado pelo alinhamento da Missão.',
  },
  {
    key: 'harmonia_triangulo',
    defaultLabel: 'Magnetismo Social',
    description:
      'Cruza a fluidez do Triângulo Social com a força da Impressão (consoantes) no canal principal em que você utiliza a assinatura.',
  },
  {
    key: 'sequencias',
    defaultLabel: 'Fluidez',
    description:
      'Indica o nível de livre circulação energética no Triângulo da Vida. Atinge 100% quando a assinatura está livre de sequências repetidas (bloqueios ativos).',
  },
];

export interface ChatSidebarSectionProps {
  birthPanel: ResultPanelData | null;
  harmonizedPanel?: ResultPanelData | null;
  showScoreCard: boolean;
  /** Estrela cabalística (após confirmação da certidão). */
  showStarDetail: boolean;
  starPanelData: ResultPanelData | null;
  isSuggestion: boolean;
  onResetToBase?: () => void;
  radarAxes: RadarAxesData | null;
  radarOverlayAxes?: RadarAxesData | null;
  radarLabels?: Record<string, string>;
  radarShowNumericLabels?: boolean;
  contextChips?: string[];
  showRadar: boolean;
  readingSummary?: ChatReadingSummary | null;
  readingSummaryLoading?: boolean;
  showReadingSummary?: boolean;
  className?: string;
}

export function ChatSidebarSection({
  birthPanel,
  harmonizedPanel = null,
  showScoreCard,
  showStarDetail,
  starPanelData,
  isSuggestion,
  onResetToBase,
  radarAxes,
  radarOverlayAxes = null,
  radarLabels,
  radarShowNumericLabels = false,
  contextChips = [],
  showRadar,
  readingSummary = null,
  readingSummaryLoading = false,
  showReadingSummary = false,
  className = '',
}: ChatSidebarSectionProps) {
  const hasScore = showScoreCard && Boolean(birthPanel);
  const hasStar = showStarDetail && Boolean(starPanelData) && Boolean(birthPanel);
  const hasReadingBlocks =
    showReadingSummary && (Boolean(readingSummary) || readingSummaryLoading);

  if (!hasScore && !hasStar && !showRadar && !hasReadingBlocks) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {hasScore && birthPanel && (
        <div id={isSuggestion && harmonizedPanel ? 'nm-reading-harmonized' : undefined}>
          <ChatHarmonyScoreCard birthPanel={birthPanel} harmonizedPanel={harmonizedPanel} />
        </div>
      )}

      {hasStar && birthPanel && (
        <ChatHarmonyStarPanel
          birthPanel={birthPanel}
          harmonizedPanel={isSuggestion ? harmonizedPanel : null}
          isSuggestion={isSuggestion}
          onResetToBase={onResetToBase}
        />
      )}

      {showRadar && radarAxes && (
        <ReadingTopicCard
          eyebrow="Mapa de Alinhamento Vibracional"
          subtitle="Ressonância da assinatura com o seu momento"
        >
          <ReadingRadar
            axes={radarAxes}
            overlayAxes={radarOverlayAxes}
            birthScore={birthPanel?.score ?? 60}
            overlayScore={harmonizedPanel?.score ?? null}
            labels={radarLabels}
            showNumericLabels={radarShowNumericLabels}
          />
          {contextChips.length > 0 && (
            <div className="w-full pt-2 border-t border-white/[0.06] text-left">
              <p className="text-[10px] uppercase font-cinzel tracking-wider text-chat-muted mb-2 text-left">Seu contexto</p>
              <div className="flex flex-wrap gap-1.5">
                {contextChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full bg-[#141414] border border-[#D4AF37]/35 px-2.5 py-1 text-[11px] font-medium text-[#e5e2e1]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="w-full pt-3.5 border-t border-white/[0.06] space-y-3.5 text-left">
            {(() => {
              const activeScore =
                (radarOverlayAxes && harmonizedPanel?.score != null
                  ? harmonizedPanel.score
                  : birthPanel?.score) ?? 60;
              const activeVisual = getScoreTierVisual(activeScore);
              const overlayVisual =
                radarShowNumericLabels && radarOverlayAxes && harmonizedPanel?.score != null
                  ? getScoreTierVisual(harmonizedPanel.score)
                  : null;
              return RADAR_AXES_EXPLANATIONS.map((axis) => {
                const axisLabel = radarLabels?.[axis.key] ?? axis.defaultLabel;
                const basePct = Math.round((radarAxes[axis.key] ?? 0.35) * 100);
                const overlayPct = radarOverlayAxes
                  ? Math.round((radarOverlayAxes[axis.key] ?? 0.35) * 100)
                  : null;
                const activePct = overlayPct ?? basePct;
                const delta = overlayPct != null ? overlayPct - basePct : null;
                const deltaColor =
                  delta != null && overlayVisual
                    ? delta > 0
                      ? overlayVisual.text
                      : delta < 0
                        ? '#ef4444'
                        : '#f2ca50'
                    : null;
                const deltaText =
                  delta != null
                    ? delta > 0
                      ? `+${delta}%`
                      : `${delta}%`
                    : null;

                return (
                  <div key={axis.key} className="space-y-1 text-left">
                    <p className="nm-reading-item-title font-inter font-semibold text-[#f2ca50] text-base leading-snug flex flex-wrap items-center gap-1.5">
                      <span>
                        {axisLabel}{' '}
                        <span className="font-bold" style={{ color: activeVisual.text }}>
                          = {activePct}%
                        </span>
                      </span>
                      {radarShowNumericLabels && radarOverlayAxes && deltaText && deltaColor && (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: deltaColor }}
                        >
                          ({deltaText})
                        </span>
                      )}
                    </p>
                    <p className="nm-card-text text-gray-300">{axis.description}</p>
                  </div>
                );
              });
            })()}
          </div>
        </ReadingTopicCard>
      )}


      {hasReadingBlocks && (
        <ChatReadingSummaryPanel summary={readingSummary} loading={readingSummaryLoading} />
      )}
    </div>
  );
}

export default ChatSidebarSection;
