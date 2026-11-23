import {
  ChatLifeTriangleSvg,
  ChatPanelHeader,
  LifeTriangleBlockBadge,
  ReadingTopicCard,
} from '../../shared/chat-ui/index.js';
import { MockupSceneShell } from './MockupSceneShell.js';
import { ScaledMockupCanvas } from './ScaledMockupCanvas.js';
import {
  RESULT_SCRIPTS,
  TRIANGLE_SCENE_STEPS,
  type TriangleSceneAction,
} from './result-scripts.js';
import type { MockupDevice, MockupTheme } from './types.js';
import { useMockupTimeline } from './useMockupTimeline.js';
import './mockup-animations.css';

export interface TriangleSceneProps {
  device?: MockupDevice;
  theme?: MockupTheme;
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

const TRIANGLE_LEGEND = [
  { label: 'Letra / base', stroke: '#D4AF37', bg: 'rgba(212, 175, 55, 0.18)' },
  { label: 'Bloqueio', stroke: '#FF6B6B', bg: 'rgba(239, 68, 68, 0.22)' },
  { label: 'Arcano Regente', stroke: '#c084fc', bg: 'rgba(192, 132, 252, 0.2)' },
] as const;

/**
 * Cena do Triângulo da Vida usando `ChatLifeTriangleSvg`, `LifeTriangleBlockBadge`
 * e `ReadingTopicCard` compartilhados. Mostra a descida em linhas, o bloqueio vermelho,
 * a ponta roxa do Arcano e a troca pelo nome harmonizado com zero bloqueios.
 */
export function TriangleScene({
  device = 'both',
  theme = 'social',
  srSummary,
  forceReducedMotion = false,
  showStatusPill = false,
  className = '',
}: TriangleSceneProps) {
  const data = RESULT_SCRIPTS[theme];
  const timeline = useMockupTimeline<TriangleSceneAction>({
    steps: TRIANGLE_SCENE_STEPS,
    loopPauseMs: 1800,
    forceReducedMotion,
  });

  const action = timeline.currentAction ?? 'letters';
  const isHarmonized = action === 'harmonized_rows' || action === 'harmonized_clean';
  const active = isHarmonized ? data.harmonized : data.birth;
  const totalRows = active.linhas.length;

  const visibleRows =
    action === 'letters'
      ? 0
      : action === 'rows_top'
        ? Math.min(3, totalRows)
        : action === 'rows_mid'
          ? Math.min(7, totalRows)
          : action === 'harmonized_rows'
            ? Math.min(5, totalRows)
            : totalRows;

  const highlightBlocks =
    action === 'blocks_lit' || action === 'apex_lit' || isHarmonized;
  const highlightApex = action === 'apex_lit' || action === 'harmonized_clean';

  const statusLabel = isHarmonized
    ? action === 'harmonized_clean'
      ? 'Nome novo sem bloqueios · passo 8/8'
      : 'Recalculando nome novo · passo 7/8'
    : action === 'apex_lit'
      ? 'Ponta regente revelada · passo 6/8'
      : action === 'blocks_lit'
        ? 'Bloqueios em vermelho · passo 5/8'
        : `Montando triângulo · passo ${timeline.stepIndex + 1}/8`;

  const renderLegend = () => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px] font-inter">
      {TRIANGLE_LEGEND.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              borderColor: item.stroke,
              borderWidth: 1.5,
              borderStyle: 'solid',
              backgroundColor: item.bg,
            }}
            aria-hidden="true"
          />
          <span className="text-[#e5e2e1]/85">{item.label}</span>
        </span>
      ))}
    </div>
  );

  const phoneContent = (
    <ScaledMockupCanvas logicalWidth={375}>
      <div className="flex flex-col flex-1 min-h-0 justify-between bg-[#131313] p-4 gap-3">
        <ReadingTopicCard
          eyebrow={isHarmonized ? 'Depois · Nome harmonizado' : 'Antes · Nome atual'}
          title={active.nome}
          subtitle={
            highlightApex
              ? `Arcano Regente ${active.regente} — ${active.regenteNome}`
              : 'Soma adjacente linha a linha até a ponta'
          }
          className="!p-3.5 !gap-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            {highlightBlocks ? (
              <LifeTriangleBlockBadge codigos={active.bloqueiosCodigos} />
            ) : (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[#a0a0a0]">
                Calculando linhas...
              </span>
            )}
            {highlightApex ? (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-purple-500/35 bg-purple-500/15 text-purple-300">
                Ponta {active.regente}
              </span>
            ) : null}
          </div>

          <ChatLifeTriangleSvg
            nome={active.nome}
            linhas={active.linhas}
            visibleRows={visibleRows}
            highlightBlocks={highlightBlocks}
            highlightApex={highlightApex}
            minWidthPx={220}
            className="!py-1"
          />
        </ReadingTopicCard>

        {renderLegend()}
      </div>
    </ScaledMockupCanvas>
  );

  const desktopContent = (
    <ScaledMockupCanvas logicalWidth={1120}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313] px-6 py-4">
        <div
          className={`flex-1 min-h-0 grid grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] gap-5 items-center ${
            device === 'both' ? 'pr-24' : ''
          }`}
        >
          <ReadingTopicCard
            eyebrow="A Essência · Triângulo da Vida"
            title={active.nome}
            subtitle="Cada letra vira número e reduz aos pares até revelar bloqueios e o Arcano Regente."
            className="!p-4 !gap-2.5"
          >
            <ChatLifeTriangleSvg
              nome={active.nome}
              linhas={active.linhas}
              visibleRows={visibleRows}
              highlightBlocks={highlightBlocks}
              highlightApex={highlightApex}
              minWidthPx={320}
              className="!py-1"
            />
            {renderLegend()}
          </ReadingTopicCard>

          <aside className="flex flex-col gap-3 min-w-0">
            <ChatPanelHeader title="Leitura da Pirâmide" hasSelection={isHarmonized} />

            <div className="nm-floating-card p-4 space-y-2.5">
              <div className="nm-score-eyebrow">
                {isHarmonized ? 'Depois · Versão limpa' : 'Antes · Mapeamento'}
              </div>
              <div className="font-cinzel text-base font-bold text-[#e5e2e1] truncate">
                {active.nome}
              </div>
              {highlightBlocks ? (
                <LifeTriangleBlockBadge codigos={active.bloqueiosCodigos} />
              ) : (
                <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[#a0a0a0]">
                  Lendo sequências...
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold font-mono shrink-0 border text-purple-300 border-purple-500/35 bg-purple-500/20">
                {highlightApex ? active.regente : '·'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-cinzel uppercase tracking-wider text-purple-200">
                  Arcano Regente
                </p>
                <p className="text-xs text-[#e5e2e1]/90 font-medium truncate">
                  {highlightApex
                    ? `${active.regente} — ${active.regenteNome}`
                    : 'Aguardando ponta da pirâmide'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  return (
    <MockupSceneShell
      sceneName="triangle"
      theme={theme}
      device={device}
      timeline={timeline}
      phoneContent={phoneContent}
      desktopContent={desktopContent}
      statusLabel={statusLabel}
      showStatusPill={showStatusPill}
      className={className}
      srSummary={
        srSummary ??
        `Triângulo da Vida de ${data.birth.nome} destacando sequência ${data.birth.bloqueiosCodigos.join(', ')} em vermelho e Arcano ${data.birth.regente} em roxo, seguido de ${data.harmonized.nome} com nenhum bloqueio.`
      }
    />
  );
}

export default TriangleScene;
