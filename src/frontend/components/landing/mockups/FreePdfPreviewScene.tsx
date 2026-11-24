import { MockupSceneShell } from './MockupSceneShell.js';
import { useMockupTimeline, type TimelineStep } from './useMockupTimeline.js';
import './mockup-animations.css';

type FreePdfAction = 'page_1' | 'page_2' | 'page_3';

const STEPS: ReadonlyArray<TimelineStep<FreePdfAction>> = [
  { at: 0, action: 'page_1' },
  { at: 2400, action: 'page_2' },
  { at: 4800, action: 'page_3' },
];

const PAGES: Record<FreePdfAction, { n: 1 | 2 | 3; label: string }> = {
  page_1: { n: 1, label: 'Capa' },
  page_2: { n: 2, label: 'Seu mapa em 1 página' },
  page_3: { n: 3, label: 'Parte 1 · Você hoje' },
};

/**
 * Prévia do PDF gratuito que a pessoa recebe por e-mail: páginas reais (exemplo fictício)
 * passando uma a uma, com a legenda da página. Sem moldura de aparelho.
 */
export function FreePdfPreviewScene({
  srSummary,
  forceReducedMotion = false,
  className = '',
}: {
  srSummary?: string;
  forceReducedMotion?: boolean;
  className?: string;
}) {
  const timeline = useMockupTimeline<FreePdfAction>({
    steps: STEPS,
    loopPauseMs: 2400,
    forceReducedMotion,
  });
  const action = timeline.currentAction ?? 'page_1';
  const page = PAGES[action];

  const framelessContent = (
    <div className="flex flex-col items-center gap-3">
      <div className="grid w-full max-w-[360px]">
        {[1, 2, 3].map((n) => (
          <img
            key={n}
            src={`/landing/pdf/free-${n}.webp`}
            alt=""
            width={909}
            height={1286}
            loading="lazy"
            decoding="async"
            className={`col-start-1 row-start-1 w-full aspect-[595/842] rounded-xl bg-white object-cover ring-1 ring-white/10 shadow-[var(--nm-card-shadow)] transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              n === page.n ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 min-h-[24px]">
        <span className="font-cinzel text-xs font-bold uppercase tracking-[0.1em] text-[#e5e2e1]">
          {page.label}
        </span>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                n === page.n ? 'w-6 bg-[#f2ca50]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </span>
      </div>
    </div>
  );

  return (
    <MockupSceneShell
      sceneName="free-pdf"
      theme="social"
      device="both"
      timeline={timeline}
      framelessContent={framelessContent}
      statusLabel={`Página ${page.n}/3 · ${page.label}`}
      className={className}
      srSummary={
        srSummary ??
        'Prévia do PDF gratuito: capa, mapa do nome em uma página e a leitura da sua situação de hoje.'
      }
    />
  );
}

export default FreePdfPreviewScene;
