import {
  ChatPanelHeader,
  ChatScorePanelCard,
  LifeTriangleBlockBadge,
  ProductHarmonyStar,
  ScoreCardRow,
} from '../../shared/chat-ui/index.js';
import { MapDownloadIcon } from '../../app/MapDownloadIcon.js';
import { MockupSceneShell } from './MockupSceneShell.js';
import { ScaledMockupCanvas } from './ScaledMockupCanvas.js';
import {
  DASHBOARD_SCENE_STEPS,
  RESULT_SCRIPTS,
  type DashboardExampleItem,
  type DashboardSceneAction,
} from './result-scripts.js';
import { MOCKUP_THEMES, type MockupDevice, type MockupTheme } from './types.js';
import { useMockupTimeline } from './useMockupTimeline.js';
import './mockup-animations.css';

export interface DashboardSceneProps {
  device?: MockupDevice;
  theme?: MockupTheme;
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

/** Espelha os tags de `MyAnalysesWorkspace.tsx`. */
const ORIGEM_TAG_CLASS: Record<DashboardExampleItem['origemTone'], string> = {
  nascimento: 'bg-white/[0.06] text-[#e5e2e1]',
  sistema: 'bg-[#D4AF37]/15 text-[#D4AF37]',
};

/**
 * Cena do painel "Minhas Análises" reproduzindo `MyAnalysesWorkspace.tsx` com
 * `ScoreCardRow`, `LifeTriangleBlockBadge`, botão dourado "Baixar PDF" (`MapDownloadIcon`)
 * e `ProductHarmonyStar`.
 */
export function DashboardScene({
  device = 'both',
  theme = 'social',
  srSummary,
  forceReducedMotion = false,
  showStatusPill = false,
  className = '',
}: DashboardSceneProps) {
  const data = RESULT_SCRIPTS[theme];
  const tokens = MOCKUP_THEMES[theme];
  const timeline = useMockupTimeline<DashboardSceneAction>({
    steps: DASHBOARD_SCENE_STEPS,
    loopPauseMs: 1800,
    forceReducedMotion,
  });

  const action = timeline.currentAction ?? 'birth_selected';
  const [birthItem, mainItem, thirdItem] = data.dashboardItems;
  const selectedIsMain =
    action === 'harmonized_selected' || action === 'pdf_tap';
  const selectedItem = selectedIsMain ? mainItem : birthItem;
  const isTappingCard = !timeline.reducedMotion && action === 'select_tap';
  const isTappingPdf = !timeline.reducedMotion && action === 'pdf_tap';
  const pdfReady = action === 'pdf_tap';

  const statusLabel =
    action === 'birth_selected'
      ? `Inspecionando nascimento (${birthItem.nome}) · passo 1/4`
      : action === 'select_tap'
        ? `Selecionando ${mainItem.nome} · passo 2/4`
        : action === 'harmonized_selected'
          ? 'Painel atualizado · passo 3/4'
          : 'Baixar PDF · passo 4/4';

  const renderAnalysisCard = (item: DashboardExampleItem, showTap: boolean) => {
    const isSelected = selectedItem.id === item.id;
    return (
      <div
        key={item.id}
        className={`relative rounded-2xl bg-[#1C1C1C] transition-all duration-200 border ${
          isSelected
            ? 'border-2 border-[#D4AF37] shadow-[0_0_0_4px_rgba(212,175,55,0.15)] bg-[#D4AF37]/[0.06]'
            : 'border-[#D4AF37]/20'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5 px-3.5 pt-3 pb-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[#A0A0A0] px-2 py-0.5 rounded-full bg-black/25 border border-white/5 whitespace-nowrap">
              {item.dateLabel}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                ORIGEM_TAG_CLASS[item.origemTone]
              }`}
            >
              {item.origemLabel}
            </span>
          </div>

          {item.isFavorite ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37] text-[#131313] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider">
              ★ Principal
            </span>
          ) : null}
        </div>

        <div className="px-3.5 pb-3 pt-1">
          <ScoreCardRow
            nome={item.nome}
            score={item.score}
            scoreTrailing={
              <LifeTriangleBlockBadge codigos={item.vidaBloqueiosCodigos} />
            }
          />
        </div>

        {showTap ? (
          <span className="absolute right-8 bottom-6 pointer-events-none z-20" aria-hidden="true">
            <span
              className="block w-8 h-8 rounded-full nm-mockup-tap-ripple"
              style={{ border: `2px solid ${tokens.cursorCoreHex}` }}
            />
            <span
              className="block w-3.5 h-3.5 rounded-full nm-mockup-tap-core shadow-md"
              style={{
                backgroundColor: tokens.cursorCoreHex,
                boxShadow: `0 0 14px ${tokens.cursorRingRgba}`,
              }}
            />
          </span>
        ) : null}
      </div>
    );
  };

  const renderPdfCta = (compact: boolean) => (
    <div className="relative inline-flex items-center shrink-0">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider transition-all duration-300 ${
          pdfReady
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_2px_16px_rgba(16,185,129,0.28)]'
            : 'bg-[#D4AF37] text-[#131313] shadow-[0_2px_16px_rgba(212,175,55,0.35)]'
        } ${compact ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-xs'}`}
      >
        <MapDownloadIcon className="w-4 h-4 shrink-0" />
        <span>{pdfReady ? 'PDF pronto ✓' : 'Baixar PDF'}</span>
      </span>

      {isTappingPdf ? (
        <span className="absolute left-12 top-1/2 pointer-events-none z-20" aria-hidden="true">
          <span
            className="block w-8 h-8 rounded-full nm-mockup-tap-ripple"
            style={{ border: `2px solid ${tokens.cursorCoreHex}` }}
          />
          <span
            className="block w-3.5 h-3.5 rounded-full nm-mockup-tap-core shadow-md"
            style={{
              backgroundColor: tokens.cursorCoreHex,
              boxShadow: `0 0 14px ${tokens.cursorRingRgba}`,
            }}
          />
        </span>
      ) : null}
    </div>
  );

  const phoneContent = (
    <ScaledMockupCanvas logicalWidth={375}>
      <div className="flex flex-col flex-1 min-h-0 justify-between bg-[#1a1a1a] p-4 gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-cinzel text-base font-bold text-[#e5e2e1] whitespace-nowrap">
            Minhas Análises
          </h3>
          {renderPdfCta(true)}
        </div>

        <div className="flex flex-col gap-2.5">
          {renderAnalysisCard(mainItem, isTappingCard)}
          {renderAnalysisCard(birthItem, false)}
          {renderAnalysisCard(thirdItem, false)}
        </div>

        <div className="rounded-2xl bg-[#141414] border border-white/[0.06] px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-cinzel uppercase tracking-wider text-[#f2ca50]">
              Selecionada
            </div>
            <div className="text-xs font-medium text-[#e5e2e1] truncate">
              {selectedItem.nome} · {selectedItem.score}/100
            </div>
          </div>
          <LifeTriangleBlockBadge codigos={selectedItem.vidaBloqueiosCodigos} />
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  const desktopContent = (
    <ScaledMockupCanvas logicalWidth={1180}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#1a1a1a] px-6 py-4">
        <div
          className={`flex-1 min-h-0 grid grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] gap-5 items-start ${
            device === 'both' ? 'pr-24' : ''
          }`}
        >
          <section className="flex flex-col gap-2.5 min-w-0">
            <h3 className="font-cinzel text-xl font-bold text-[#e5e2e1]">
              Minhas Análises
            </h3>
            {renderAnalysisCard(mainItem, isTappingCard)}
            {renderAnalysisCard(birthItem, false)}
            {renderAnalysisCard(thirdItem, false)}
          </section>

          <aside className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <ChatPanelHeader title="Painel de análise" hasSelection={selectedIsMain} />
              {renderPdfCta(false)}
            </div>

            <ChatScorePanelCard
              birth={{ nome: birthItem.nome, score: birthItem.score }}
              harmonized={
                selectedIsMain ? { nome: mainItem.nome, score: mainItem.score } : null
              }
            />

            <div className="nm-floating-card p-3 flex items-center justify-center">
              <div className="w-full max-w-[235px]">
                <ProductHarmonyStar
                  variant={selectedIsMain ? 'dual' : 'birth-only'}
                  play
                  birthName={birthItem.nome}
                  birthScore={birthItem.score}
                  birthNums={[...birthItem.starNums]}
                  harmonizedName={mainItem.nome}
                  harmonizedScore={mainItem.score}
                  harmonizedNums={[...mainItem.starNums]}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  return (
    <MockupSceneShell
      sceneName="dashboard"
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
        `Painel Minhas Análises exibindo ${birthItem.nome} (${birthItem.score}/100), ${mainItem.nome} favoritada (${mainItem.score}/100) e botão Baixar PDF.`
      }
    />
  );
}

export default DashboardScene;
