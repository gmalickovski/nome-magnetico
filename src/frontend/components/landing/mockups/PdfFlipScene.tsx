import { ChatPanelHeader } from '../../shared/chat-ui/index.js';
import { MockupSceneShell } from './MockupSceneShell.js';
import { PdfMockupPageSheet } from './PdfMockupPages.js';
import { ScaledMockupCanvas } from './ScaledMockupCanvas.js';
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
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

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

  const activeTheme: MockupTheme =
    autoCycleThemes && !timeline.reducedMotion
      ? THEME_ROTATION[
          (Math.max(0, THEME_ROTATION.indexOf(theme)) + timeline.cycle) % THEME_ROTATION.length
        ]!
      : theme;

  const data = RESULT_SCRIPTS[activeTheme];
  const action = timeline.currentAction ?? 'page_1';
  const activePage = ACTION_TO_PAGE[action];
  const pageMeta = data.pdfPages[activePage - 1]!;

  const phoneContent = (
    <ScaledMockupCanvas logicalWidth={375}>
      <div className="flex flex-col flex-1 min-h-0 justify-between bg-[#131313] p-4 gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="nm-score-eyebrow truncate">{pageMeta.label}</div>
            <div className="text-xs font-inter text-[#e5e2e1] font-medium truncate">
              {data.pdfReportName}
            </div>
          </div>
          <span className="rounded-full bg-[#1C1C1C] border border-[#D4AF37]/30 px-2.5 py-0.5 text-[10px] font-semibold text-[#f2ca50] tabular-nums shrink-0">
            {activePage}/4
          </span>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div
            key={`${activeTheme}-${activePage}`}
            className="w-full max-w-[258px] aspect-[794/1123] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/10 nm-mockup-page-flip"
          >
            <PdfMockupPageSheet theme={activeTheme} pageNumber={activePage} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {data.pdfPages.map((p) => {
            const selected = p.pageNumber === activePage;
            return (
              <span
                key={p.pageNumber}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  selected ? 'w-6 bg-[#f2ca50]' : 'w-2 bg-white/20'
                }`}
              />
            );
          })}
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  const desktopContent = (
    <ScaledMockupCanvas logicalWidth={1120}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313] px-6 py-4">
        <div
          className={`flex-1 min-h-0 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-center ${
            device === 'both' ? 'pr-24' : ''
          }`}
        >
          <div className="flex items-center justify-center min-h-0 h-full">
            <div
              key={`desk-${activeTheme}-${activePage}`}
              className="h-full max-h-[388px] aspect-[794/1123] rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.72)] ring-1 ring-white/10 nm-mockup-page-flip"
            >
              <PdfMockupPageSheet theme={activeTheme} pageNumber={activePage} />
            </div>
          </div>

          <aside className="flex flex-col gap-3 min-w-0">
            <ChatPanelHeader title="Páginas do PDF" hasSelection />
            <div className="space-y-2">
              {data.pdfPages.map((page) => {
                const isActive = page.pageNumber === activePage;
                return (
                  <div
                    key={page.pageNumber}
                    className={`rounded-2xl px-3.5 py-2.5 transition-all duration-300 border ${
                      isActive
                        ? 'bg-[#1C1C1C] border-[#D4AF37]/60 shadow-[0_0_0_2px_rgba(212,175,55,0.14)]'
                        : 'bg-[#171717] border-white/[0.05] opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-cinzel text-xs font-bold text-[#e5e2e1] truncate">
                        {page.pageNumber}. {page.label}
                      </span>
                      <span
                        className={`text-[10px] font-inter font-medium shrink-0 ${
                          isActive ? 'text-[#f2ca50]' : 'text-[#a0a0a0]'
                        }`}
                      >
                        {page.sourceDoc.replace('.dc.html', '')}
                      </span>
                    </div>
                    <p className="text-[11px] font-inter text-[#a0a0a0] mt-0.5 truncate">
                      {page.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  return (
    <MockupSceneShell
      sceneName="pdf-flip"
      theme={activeTheme}
      device={device}
      timeline={timeline}
      phoneContent={phoneContent}
      desktopContent={desktopContent}
      statusLabel={`Página ${activePage}/4 · ${pageMeta.label}`}
      reducedMotionLabel={`Reduced motion · Página 4/4 (${data.pdfPages[3]!.label})`}
      showStatusPill={showStatusPill}
      className={className}
      srSummary={
        srSummary ??
        `Prévia das páginas do relatório em PDF (${data.pdfReportName}): ${data.pdfPages.map((p) => p.label).join(', ')}.`
      }
    />
  );
}

export default PdfFlipScene;
