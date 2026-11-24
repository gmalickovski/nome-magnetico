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
    loopPauseMs: 3000,
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
            className="rounded-xl bg-[#1C1C1C] border border-white/[0.06] px-1.5 py-2.5 text-center"
          >
            <div className="text-[10px] font-inter uppercase tracking-wider text-[#a0a0a0] truncate">
              {label.slice(0, 4)}
            </div>
            <div className="mt-1 font-cinzel text-xl font-bold tabular-nums leading-none transition-colors duration-700">
              <span style={{ color: showMorph ? harmVisual.text : birthVisual.text }}>
                {showMorph ? afterVal : beforeVal}
              </span>
            </div>
            <div
              className={`mt-1 font-cinzel text-[13px] font-semibold tabular-nums leading-none text-[#f2ca50] transition-opacity duration-700 ${
                showMorph && changed ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {beforeVal}
            </div>
          </div>
        );
      })}
    </div>
  );

  const framelessContent = (
    <div className="w-full max-w-[460px] mx-auto flex flex-col gap-4">
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

        <div className="nm-floating-card p-4 w-full">
          <div className="grid w-full max-w-[360px] mx-auto">
            {(['birth-only', 'dual'] as const).map((variant) => (
              <div
                key={variant}
                className={`col-start-1 row-start-1 transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  (variant === 'dual') === showDual ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ProductHarmonyStar
                  variant={variant}
                  play
                  birthName={data.birth.nome}
                  birthScore={data.birth.nota}
                  birthNums={[...data.birth.starNums]}
                  harmonizedName={data.harmonized.nome}
                  harmonizedScore={data.harmonized.nota}
                  harmonizedNums={[...data.harmonized.starNums]}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {renderNumberPills(true)}
          <div className="grid">
            <div
              className={`col-start-1 row-start-1 transition-opacity duration-[1100ms] ${
                showDual ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <ChatScorePanelCard birth={{ nome: data.birth.nome, score: data.birth.nota }} />
            </div>
            <div
              className={`col-start-1 row-start-1 transition-opacity duration-[1100ms] ${
                showDual ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <ChatScorePanelCard
                birth={{ nome: data.birth.nome, score: data.birth.nota }}
                harmonized={{ nome: data.harmonized.nome, score: data.harmonized.nota }}
              />
            </div>
          </div>
        </div>
    </div>
  );


  void device;
  return (
    <MockupSceneShell
      sceneName="star"
      theme={theme}
      device={device}
      timeline={timeline}
      framelessContent={framelessContent}
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
