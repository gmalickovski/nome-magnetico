import {
  ChatPanelHeader,
  ChatScorePanelCard,
  HarmonyScoreStack,
  LifeTriangleBlockBadge,
  ScoreCardRow,
  getScoreTierVisual,
} from '../../shared/chat-ui/index.js';
import { MockupSceneShell } from './MockupSceneShell.js';
import { ScaledMockupCanvas } from './ScaledMockupCanvas.js';
import {
  RESULT_SCRIPTS,
  SCORE_COUNTER_STEPS,
  type ScoreCounterAction,
} from './result-scripts.js';
import type { MockupDevice, MockupTheme } from './types.js';
import { useMockupTimeline } from './useMockupTimeline.js';
import './mockup-animations.css';

export interface ScoreCounterSceneProps {
  device?: MockupDevice;
  theme?: MockupTheme;
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

const SCORE_BANDS = [
  { label: 'Em Tensão', score: 20, min: 0 },
  { label: 'Pede Atenção', score: 40, min: 30 },
  { label: 'Equilíbrio Parcial', score: 60, min: 50 },
  { label: 'Favorável', score: 78, min: 70 },
  { label: 'Harmonioso', score: 93, min: 85 },
] as const;

const ACTION_INDEX: Record<ScoreCounterAction, number> = {
  birth: 0,
  step_1: 1,
  step_2: 2,
  step_3: 3,
  final: 4,
};

/**
 * Cena do contador de nota (ex.: 58 → 93) usando `ScoreCardRow` e `getScoreTierVisual`.
 * Cada passo cruza uma faixa real de cor, rótulo e largura da barra sem criar novos estilos.
 */
export function ScoreCounterScene({
  device = 'both',
  theme = 'social',
  srSummary,
  forceReducedMotion = false,
  showStatusPill = false,
  className = '',
}: ScoreCounterSceneProps) {
  const data = RESULT_SCRIPTS[theme];
  const timeline = useMockupTimeline<ScoreCounterAction>({
    steps: SCORE_COUNTER_STEPS,
    loopPauseMs: 1800,
    forceReducedMotion,
  });

  const action = timeline.currentAction ?? 'birth';
  const stepIdx = ACTION_INDEX[action];
  const liveScore = data.scoreSteps[stepIdx]!;
  const isFinal = action === 'final';
  const liveTier = getScoreTierVisual(liveScore);
  const delta = liveScore - data.birth.nota;

  const renderTierStrip = () => (
    <div className="grid grid-cols-5 gap-1.5 w-full" aria-hidden="true">
      {SCORE_BANDS.map((band) => {
        const tier = getScoreTierVisual(band.score);
        const active = liveTier.code === tier.code;
        return (
          <div
            key={tier.code}
            className={`rounded-xl px-1.5 py-2 text-center border transition-all duration-300 ${
              active
                ? `${tier.badgeClass} scale-[1.02]`
                : 'bg-[#181818] border-white/[0.06] text-[#a0a0a0]/70'
            }`}
          >
            <div className="font-cinzel text-[11px] font-bold">{tier.code}</div>
            <div className="text-[9px] font-inter truncate mt-0.5">{band.min}+</div>
          </div>
        );
      })}
    </div>
  );

  // Começa no nome de nascimento (2 sobrenomes) e vai somando variações com nota maior,
  // da menor para a maior, passando pelas faixas de 60, 70, 80 e 90.
  const rowEyebrow = (i: number) =>
    i === 0 ? 'Nome de nascimento (Nota hoje)' : i === 4 ? 'Melhor opção' : `Variação ${i}`;

  const renderRows = (upTo: number) =>
    data.scoreStepNames.slice(0, upTo + 1).map((nome, i) => (
      <div key={nome} className={i === upTo && i > 0 ? 'nm-soft-enter' : ''}>
        {i > 0 ? <div className="border-t border-white/10 mb-4" aria-hidden /> : null}
        <ScoreCardRow
          eyebrow={rowEyebrow(i)}
          nome={nome}
          score={data.scoreSteps[i]!}
          displayScore={data.scoreSteps[i]!}
          emphasize={i === upTo}
          scoreTrailing={
            <LifeTriangleBlockBadge codigos={i === 0 ? data.birth.bloqueiosCodigos : []} />
          }
        />
      </div>
    ));

  const framelessContent = (
    <div className="w-full max-w-[460px] mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 min-h-[28px]">
        <span className="font-cinzel text-xs font-bold uppercase tracking-[0.1em] text-[#e5e2e1]">
          Grau de Vibração
        </span>
        <span
          className={`rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 tabular-nums transition-opacity duration-500 ${
            delta > 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          +{Math.max(delta, 0)} pts
        </span>
      </div>

      {renderTierStrip()}

      {/* Lista cresce dentro de uma altura reservada (fantasma com as 5 linhas): o texto ao lado não se mexe. */}
      <div className="grid">
        <div className="col-start-1 row-start-1 invisible" aria-hidden="true">
          <HarmonyScoreStack>{renderRows(4)}</HarmonyScoreStack>
        </div>
        <div className="col-start-1 row-start-1 self-start">
          <HarmonyScoreStack>{renderRows(stepIdx)}</HarmonyScoreStack>
        </div>
      </div>
    </div>
  );

  void isFinal;
  void device;

  return (
    <MockupSceneShell
      sceneName="score-counter"
      theme={theme}
      device={device}
      timeline={timeline}
      framelessContent={framelessContent}
      statusLabel={`Nota ${liveScore}/100 · ${liveTier.label}`}
      showStatusPill={showStatusPill}
      className={className}
      srSummary={
        srSummary ??
        `Evolução da nota cabalística de ${data.birth.nota} para ${data.harmonized.nota} de ${data.birth.nome} até ${data.harmonized.nome}.`
      }
    />
  );
}

export default ScoreCounterScene;
