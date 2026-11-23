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

  const phoneContent = (
    <ScaledMockupCanvas logicalWidth={375}>
      <div className="flex flex-col flex-1 min-h-0 justify-center bg-[#131313] p-4 gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-cinzel text-xs font-bold uppercase tracking-[0.1em] text-[#e5e2e1]">
            Grau de Vibração
          </span>
          {delta > 0 ? (
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 tabular-nums">
              +{delta} pts
            </span>
          ) : null}
        </div>

        <HarmonyScoreStack>
          <ScoreCardRow
            eyebrow={isFinal ? 'Nome harmonizado (Potencial)' : 'Simulando harmonização'}
            nome={stepIdx === 0 ? data.birth.nome : data.harmonized.nome}
            score={liveScore}
            displayScore={liveScore}
            emphasize
            scoreTrailing={
              <LifeTriangleBlockBadge
                codigos={stepIdx === 0 ? data.birth.bloqueiosCodigos : []}
              />
            }
          />
        </HarmonyScoreStack>

        {renderTierStrip()}

        <ChatScorePanelCard
          birth={{ nome: data.birth.nome, score: data.birth.nota }}
          harmonized={isFinal ? { nome: data.harmonized.nome, score: data.harmonized.nota } : null}
        />
      </div>
    </ScaledMockupCanvas>
  );

  const desktopContent = (
    <ScaledMockupCanvas logicalWidth={1120}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313] px-6 py-5">
        <div
          className={`flex-1 min-h-0 grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 items-center ${
            device === 'both' ? 'pr-24' : ''
          }`}
        >
          <div className="flex flex-col gap-4 min-w-0">
            <HarmonyScoreStack>
              <ScoreCardRow
                eyebrow={isFinal ? 'Nome harmonizado (Potencial)' : 'Evolução da Nota Cabalística'}
                nome={stepIdx === 0 ? data.birth.nome : data.harmonized.nome}
                score={liveScore}
                displayScore={liveScore}
                emphasize
                scoreTrailing={
                  <LifeTriangleBlockBadge
                    codigos={stepIdx === 0 ? data.birth.bloqueiosCodigos : []}
                  />
                }
              />
            </HarmonyScoreStack>
            {renderTierStrip()}
          </div>

          <aside className="flex flex-col gap-3.5 min-w-0">
            <ChatPanelHeader title="Antes × Potencial" hasSelection={isFinal} />
            <ChatScorePanelCard
              birth={{ nome: data.birth.nome, score: data.birth.nota }}
              harmonized={{ nome: data.harmonized.nome, score: liveScore }}
            />
            <div className="nm-floating-card p-3.5 flex items-center justify-between text-xs font-inter">
              <span className="text-[#a0a0a0]">Faixa atual da barra</span>
              <span className="font-semibold" style={{ color: liveTier.text }}>
                {liveTier.code} · {liveTier.label}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  return (
    <MockupSceneShell
      sceneName="score-counter"
      theme={theme}
      device={device}
      timeline={timeline}
      phoneContent={phoneContent}
      desktopContent={desktopContent}
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
