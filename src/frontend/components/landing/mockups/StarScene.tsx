import {
  ChatPanelHeader,
  ChatScorePanelCard,
  ProductHarmonyStar,
  getScoreTierVisual,
} from '../../shared/chat-ui/index.js';
import { MockupSceneShell } from './MockupSceneShell.js';
import { ScaledMockupCanvas } from './ScaledMockupCanvas.js';
import {
  RESULT_SCRIPTS,
  STAR_SCENE_STEPS,
  type StarSceneAction,
} from './result-scripts.js';
import type { MockupDevice, MockupTheme } from './types.js';
import { useMockupTimeline } from './useMockupTimeline.js';
import './mockup-animations.css';

export interface StarSceneProps {
  device?: MockupDevice;
  theme?: MockupTheme;
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

const STAR_LABELS = ['Destino', 'Expressão', 'Motivação', 'Missão', 'Impressão'] as const;

/**
 * Cena da Estrela Cabalística usando `ProductHarmonyStar` + `ChatScorePanelCard` reais.
 * Evolui da estrela do nascimento (cor da faixa) -> números trocando -> dupla estrela comparativa.
 */
export function StarScene({
  device = 'both',
  theme = 'social',
  srSummary,
  forceReducedMotion = false,
  showStatusPill = false,
  className = '',
}: StarSceneProps) {
  const data = RESULT_SCRIPTS[theme];
  const timeline = useMockupTimeline<StarSceneAction>({
    steps: STAR_SCENE_STEPS,
    loopPauseMs: 1800,
    forceReducedMotion,
  });

  const action = timeline.currentAction ?? 'birth_only';
  const showMorph = action === 'morph_numbers' || action === 'dual_star';
  const showDual = action === 'dual_star';

  const birthVisual = getScoreTierVisual(data.birth.nota);
  const harmVisual = getScoreTierVisual(data.harmonized.nota);

  const stepLabel =
    action === 'birth_only'
      ? 'Estrela do nascimento · passo 1/3'
      : action === 'morph_numbers'
        ? 'Números harmonizados · passo 2/3'
        : 'Comparativo completo · passo 3/3';

  const renderNumberPills = (compact: boolean) => (
    <div
      className={`grid ${compact ? 'grid-cols-5 gap-1' : 'grid-cols-5 gap-1.5'} w-full`}
      aria-hidden="true"
    >
      {STAR_LABELS.map((label, idx) => {
        const beforeVal = data.birth.starNums[idx]!;
        const afterVal = data.harmonized.starNums[idx]!;
        const changed = beforeVal !== afterVal;
        return (
          <div
            key={label}
            className="rounded-xl bg-[#1C1C1C] border border-white/[0.06] px-1.5 py-2 text-center"
          >
            <div className="text-[9px] font-inter uppercase tracking-wider text-[#a0a0a0] truncate">
              {label.slice(0, 4)}
            </div>
            <div className="mt-0.5 font-cinzel text-sm font-bold tabular-nums transition-colors duration-500">
              {showMorph ? (
                <span style={{ color: harmVisual.text }}>{afterVal}</span>
              ) : (
                <span style={{ color: birthVisual.text }}>{beforeVal}</span>
              )}
            </div>
            {showMorph && changed ? (
              <div className="text-[9px] font-inter text-[#a0a0a0] line-through tabular-nums">
                {beforeVal}
              </div>
            ) : (
              <div className="text-[9px] font-inter text-transparent select-none">-</div>
            )}
          </div>
        );
      })}
    </div>
  );

  const phoneContent = (
    <ScaledMockupCanvas logicalWidth={375}>
      <div className="flex flex-col flex-1 min-h-0 justify-between bg-[#131313] p-4 gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-cinzel text-xs font-bold uppercase tracking-[0.1em] text-[#e5e2e1]">
            {showDual ? 'Antes × Depois' : 'Estrela Cabalística'}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              showDual ? harmVisual.badgeClass : birthVisual.badgeClass
            }`}
          >
            {showDual ? `${data.harmonized.nota}/100` : `${data.birth.nota}/100`}
          </span>
        </div>

        <div className="w-full max-w-[300px] mx-auto nm-mockup-enter" key={showDual ? 'dual' : 'single'}>
          <ProductHarmonyStar
            variant={showDual ? 'dual' : 'birth-only'}
            play
            birthName={data.birth.nome}
            birthScore={data.birth.nota}
            birthNums={[...data.birth.starNums]}
            harmonizedName={data.harmonized.nome}
            harmonizedScore={data.harmonized.nota}
            harmonizedNums={[...data.harmonized.starNums]}
          />
        </div>

        <div className="space-y-2.5">
          {renderNumberPills(true)}
          <ChatScorePanelCard
            birth={{ nome: data.birth.nome, score: data.birth.nota }}
            harmonized={
              showDual ? { nome: data.harmonized.nome, score: data.harmonized.nota } : null
            }
          />
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  const desktopContent = (
    <ScaledMockupCanvas logicalWidth={1120}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313] px-6 py-5">
        <div
          className={`flex-1 min-h-0 grid grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] gap-6 items-center ${
            device === 'both' ? 'pr-36' : ''
          }`}
        >
          <div className="nm-floating-card p-4 flex flex-col items-center justify-center min-h-0">
            <div
              className="w-full max-w-[380px] mx-auto"
              key={showDual ? 'desk-dual' : 'desk-single'}
            >
              <ProductHarmonyStar
                variant={showDual ? 'dual' : 'birth-only'}
                play
                birthName={data.birth.nome}
                birthScore={data.birth.nota}
                birthNums={[...data.birth.starNums]}
                harmonizedName={data.harmonized.nome}
                harmonizedScore={data.harmonized.nota}
                harmonizedNums={[...data.harmonized.starNums]}
              />
            </div>
          </div>

          <aside className="flex flex-col gap-3.5 min-w-0">
            <ChatPanelHeader title="Estrela dos 5 Números" hasSelection={showDual} />
            <ChatScorePanelCard
              birth={{ nome: data.birth.nome, score: data.birth.nota }}
              harmonized={
                showMorph ? { nome: data.harmonized.nome, score: data.harmonized.nota } : null
              }
            />
            {renderNumberPills(false)}
          </aside>
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  return (
    <MockupSceneShell
      sceneName="star"
      theme={theme}
      device={device}
      timeline={timeline}
      phoneContent={phoneContent}
      desktopContent={desktopContent}
      statusLabel={stepLabel}
      showStatusPill={showStatusPill}
      className={className}
      srSummary={
        srSummary ??
        `Comparação da Estrela Cabalística: ${data.birth.nome} (nota ${data.birth.nota}) evoluindo para ${data.harmonized.nome} (nota ${data.harmonized.nota}) com os 5 números destacados.`
      }
    />
  );
}

export default StarScene;
