import { useEffect, useState } from 'react';
import { MockupSceneShell } from './MockupSceneShell.js';
import {
  PDF_FLIP_STEPS,
  RESULT_SCRIPTS,
  type PdfFlipAction,
} from './result-scripts.js';
import type { MockupDevice, MockupTheme } from './types.js';
import { useMockupTimeline } from './useMockupTimeline.js';
import './mockup-animations.css';

export interface PdfFlipSceneProps {
  device?: MockupDevice;
  theme?: MockupTheme;
  /** Quando true (ex.: bloco "O que você leva" na Home), alterna Social → Artístico → Bebê a cada ciclo. */
  autoCycleThemes?: boolean;
  /** Notifica o tema exibido quando `autoCycleThemes` alterna entre ciclos. */
  onActiveThemeChange?: (theme: MockupTheme) => void;
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

/** Páginas reais do PDF (exemplo fictício) usadas como imagem em /public/landing/pdf. */
const REAL_PDF_NAMES: Record<MockupTheme, string> = {
  social: 'Alexandra M. Vale · Relatório Nome Social',
  artistico: 'Luna Vale · Relatório Nome Artístico',
  bebe: 'Lou · Manual para os pais',
};

const REAL_PDF_PAGES: Record<MockupTheme, ReadonlyArray<{ label: string }>> = {
  social: [{ label: 'Capa' }, { label: 'Resumo em 1 página' }, { label: 'Triângulo da Vida' }, { label: 'Seu nome novo' }],
  artistico: [{ label: 'Capa' }, { label: 'Resumo em 1 página' }, { label: 'Parte 1 · Você e sua área' }, { label: 'Anexo · Triângulo da Vida' }],
  bebe: [{ label: 'Capa' }, { label: 'Carta aos pais' }, { label: 'Parte 2 · O nome' }, { label: 'Parte 4 · Crescer juntos' }],
};

const THEME_ROTATION: readonly MockupTheme[] = ['social', 'artistico', 'bebe'];

const ACTION_TO_PAGE: Record<PdfFlipAction, 1 | 2 | 3 | 4> = {
  page_1: 1,
  page_2: 2,
  page_3: 3,
  page_4: 4,
};

/**
 * Cena das páginas do PDF passando (Capa → Resumo → Parte 1 → Triângulo / Uso),
 * baseada nos templates de `docs/architecture/pdf-layout-base/` nos temas social, artístico e bebê.
 */
export function PdfFlipScene({
  device = 'both',
  theme = 'social',
  autoCycleThemes = false,
  onActiveThemeChange,
  srSummary,
  forceReducedMotion = false,
  showStatusPill = false,
  className = '',
}: PdfFlipSceneProps) {
  const timeline = useMockupTimeline<PdfFlipAction>({
    steps: PDF_FLIP_STEPS,
    loopPauseMs: 1800,
    forceReducedMotion,
  });

  // Ao trocar a aba, a troca automática recomeça a partir do tema clicado.
  const [anchorCycle, setAnchorCycle] = useState(0);
  useEffect(() => {
    setAnchorCycle(timeline.cycle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const activeTheme: MockupTheme =
    autoCycleThemes && !timeline.reducedMotion
      ? THEME_ROTATION[
          (Math.max(0, THEME_ROTATION.indexOf(theme)) +
            Math.max(0, timeline.cycle - anchorCycle)) %
            THEME_ROTATION.length
        ]!
      : theme;

  useEffect(() => {
    onActiveThemeChange?.(activeTheme);
  }, [activeTheme, onActiveThemeChange]);

  const data = RESULT_SCRIPTS[activeTheme];
  const action = timeline.currentAction ?? 'page_1';
  const activePage = ACTION_TO_PAGE[action];
  const pages = REAL_PDF_PAGES[activeTheme];
  const pageMeta = pages[activePage - 1]!;

  void device;

  // Folha A4 real (print do PDF gerado pelo sistema), sem moldura de aparelho.
  const framelessContent = (
    <div className="flex flex-col items-center gap-4">
      <div className="grid w-full max-w-[460px]">
        {[1, 2, 3, 4].map((n) => (
          <img
            key={`${activeTheme}-${n}`}
            src={`/landing/pdf/${activeTheme}-${n}.webp`}
            alt=""
            width={909}
            height={1286}
            loading="lazy"
            decoding="async"
            className={`col-start-1 row-start-1 w-full aspect-[595/842] rounded-xl bg-white object-cover ring-1 ring-white/10 shadow-[var(--nm-card-shadow)] transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              n === activePage ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              n === activePage ? 'w-6 bg-[#f2ca50]' : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <MockupSceneShell
      sceneName="pdf-flip"
      theme={activeTheme}
      device={device}
      timeline={timeline}
      framelessContent={framelessContent}
      statusLabel={`Página ${activePage}/4 · ${pageMeta.label}`}
      reducedMotionLabel={`Reduced motion · Página 4/4 (${pages[3]!.label})`}
      showStatusPill={showStatusPill}
      className={className}
      srSummary={
        srSummary ??
        `Prévia de páginas reais do relatório em PDF (${REAL_PDF_NAMES[activeTheme]}): ${pages.map((p) => p.label).join(', ')}.`
      }
    />
  );
}

export default PdfFlipScene;
