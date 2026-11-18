import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SavedAnalysisItem } from './types.js';
import { ScoreCardRow } from '../../landing/ScoreCardRow.js';
import { LifeTriangleBlockBadge } from '../../landing/LifeTriangleBlockBadge.js';
import { ChatSidebarSection } from '../chat/ChatSidebarSection.js';
import {
  MobileReadingBottomSheet,
  type ReadingSheetSnap,
} from '../chat/MobileReadingBottomSheet.js';
import MobileDockActionBridge from '../MobileDockActionBridge.js';
import type {
  ChatDockLayout,
  DockPrimaryActionId,
  DockSecondaryActionId,
} from '../chat/mobile-dock-screen.js';
import { PDFFeedbackButton } from '../PDFFeedbackButton.js';
import { ChatPdfPreparingOverlay } from '../chat/ChatPdfPreparingOverlay.js';
import { usePdfDownloadOverlay } from '../../../lib/pdf-download.js';
import {
  getStoredFavoriteAnalysisId,
  persistFavoriteAnalysis,
} from '../../../lib/favorite-analysis.js';
import { syncAnaliseCtaLabels } from '../chat/chat-session-storage.js';
import { getScoreTierVisual } from '../../landing/score-tier-visual.js';

export interface MyAnalysesWorkspaceProps {
  initialItems: SavedAnalysisItem[];
  userId: string;
  hasAnyPaidAccess: boolean;
  isLocked: boolean;
  initialSelectedId?: string | null;
  initialPanelOpen?: boolean;
}

const PRODUCT_LABEL: Record<string, string> = {
  analise_gratuita: 'Nome Atual',
  nome_social: 'Nome Social',
  nome_bebe: 'Nome de Bebê',
  nome_empresa: 'Nome Empresarial',
};

type OrigemNome = NonNullable<SavedAnalysisItem['origemNome']>;

/** DEV-317: tags de origem do nome (só em Minhas análises). */
const ORIGEM_TAG: Record<OrigemNome, { rotulo: string; classe: string }> = {
  nascimento: { rotulo: 'Nome de nascimento', classe: 'bg-white/[0.06] text-[#e5e2e1]' },
  // Sem tag no card: só nascimento e teste recebem tag. No filtro aparece como "Sugestões do sistema".
  sistema: { rotulo: 'Sugestões do sistema', classe: '' },
  teste: { rotulo: 'Suas sugestões', classe: 'bg-[#bea5ff]/15 text-[#d7c6ff]' },
};

/**
 * DEV-317: filtros de Minhas análises, nesta ordem. "Nome Social" junta todas as harmonizações
 * (sistema + suas sugestões). Opções somáveis: o card aparece se bater com qualquer uma marcada.
 */
const FILTROS_ORIGEM: { id: string; rotulo: string; origens: OrigemNome[] }[] = [
  { id: 'nascimento', rotulo: 'Nome de nascimento', origens: ['nascimento'] },
  { id: 'social', rotulo: 'Nome Social', origens: ['sistema', 'teste'] },
  { id: 'teste', rotulo: 'Suas sugestões', origens: ['teste'] },
  { id: 'sistema', rotulo: 'Sugestões do sistema', origens: ['sistema'] },
];

const MOBILE_STACK_QUERY = '(max-width: 767px)';

interface OpcaoFiltro {
  id: string;
  grupo: 'origem';
  rotulo: string;
  total: number;
}

const CHIP_BASE =
  'flex-shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-300 cursor-pointer';
const CHIP_ATIVO = 'bg-[#D4AF37] text-[#131313]';
const CHIP_INATIVO = 'bg-[#1C1C1C] text-[#A0A0A0] hover:text-[#e5e2e1]';

/** DEV-317: faixa de chips com rolagem por toque, sem barra; setas sutis aparecem só quando há mais para um lado. */
function ChipScroller({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lados, setLados] = useState({ esq: false, dir: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () =>
      setLados({ esq: el.scrollLeft > 4, dir: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    medir();
    // Mede de novo depois do layout e das fontes (o tamanho do conteúdo muda sem mudar o contêiner).
    const raf = requestAnimationFrame(medir);
    const t = window.setTimeout(medir, 250);
    el.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    ro?.observe(el);
    for (const filho of Array.from(el.children)) ro?.observe(filho);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      el.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
      ro?.disconnect();
    };
  }, [children]);
  const rolar = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });
  const seta = (dir: 1 | -1, visivel: boolean) => (
    <button
      type="button"
      aria-label={dir === 1 ? 'Ver mais filtros à direita' : 'Ver mais filtros à esquerda'}
      onClick={() => rolar(dir)}
      tabIndex={visivel ? 0 : -1}
      className={`absolute top-1/2 z-10 -translate-y-1/2 px-0.5 text-sm text-[#A0A0A0] transition-opacity duration-300 ${
        dir === 1 ? 'right-0' : 'left-0'
      } ${visivel ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <span aria-hidden="true">{dir === 1 ? '›' : '‹'}</span>
    </button>
  );
  return (
    <div className="relative px-3" role="group" aria-label={label}>
      {seta(-1, lados.esq)}
      <div ref={ref} className="flex items-center gap-2 overflow-x-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {seta(1, lados.dir)}
    </div>
  );
}

function isMobileStackedViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_STACK_QUERY).matches;
}

function CandidateSummaryBlock({ item }: { item: SavedAnalysisItem }) {
  const candidates = item.panelData.candidateSummary ?? [];
  if (candidates.length <= 1) return null;

  return (
    <div className="rounded-2xl bg-[#1C1C1C] border border-white/[0.06] p-4 sm:p-5 space-y-3">
      <div>
        <p className="text-[10px] font-cinzel uppercase tracking-[0.14em] text-[#D4AF37]">
          Ranking dos candidatos
        </p>
        <p className="text-xs text-[#A0A0A0] mt-0.5">
          Nomes avaliados nesta análise em ordem de harmonia vibracional
        </p>
      </div>
      <div className="space-y-2">
        {candidates.map((cand, idx) => {
          const visual = getScoreTierVisual(cand.score);
          return (
            <div
              key={`${cand.nome}-${idx}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-black/25 px-3 py-2.5 border border-white/[0.05]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-cinzel text-sm font-bold text-[#e5e2e1] truncate">
                  {idx + 1}. {cand.nome}
                </p>
                <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                  Expr {cand.expressao} · Mot {cand.motivacao} · Imp {cand.impressao} · Mis{' '}
                  {cand.missao}
                  {cand.bloqueios > 0 ? ` · ${cand.bloqueios} bloqueio(s)` : ' · Sem bloqueios'}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${visual.badgeClass}`}
              >
                {cand.score}/100
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function resolvePdfAnalysisId(analysis: SavedAnalysisItem | null): string | null {
  if (!analysis || analysis.status !== 'complete') return null;
  if (analysis.pdfAnalysisId !== undefined) return analysis.pdfAnalysisId;
  return analysis.isSynthetic ? null : analysis.id;
}

function AnalysesRightPanelChrome({
  expanded,
  onToggleExpand,
  selectedAnalysis,
  children,
}: {
  expanded: boolean;
  onToggleExpand: () => void;
  selectedAnalysis: SavedAnalysisItem | null;
  children: React.ReactNode;
}) {
  const pdfAnalysisId = resolvePdfAnalysisId(selectedAnalysis);
  const titleNode = (
    <div className="flex items-center gap-2.5 min-w-0 pr-20">
      <h2
        id="desktop-summary-title"
        data-expanded={expanded ? 'true' : 'false'}
        className="font-cinzel font-bold uppercase tracking-[0.1em] text-[#e5e2e1] text-left break-words whitespace-normal leading-snug min-w-0"
      >
        Painel de análise
      </h2>
    </div>
  );

  return (
    <div className="flex flex-col min-h-0 h-full w-full relative">
      <div className="shrink-0 relative w-full mb-4 sm:mb-5 px-1 min-h-[36px] flex items-center">
        {expanded ? (
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">{titleNode}</div>
        ) : (
          titleNode
        )}

        <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5">
          {selectedAnalysis && pdfAnalysisId && (
            <PDFFeedbackButton
              analysisId={pdfAnalysisId}
              productType={selectedAnalysis.productType}
              isFree={selectedAnalysis.isFree}
              forceFreePdf={
                selectedAnalysis.isFree ||
                selectedAnalysis.productType === 'analise_gratuita' ||
                (selectedAnalysis.productType === 'nome_social' && !selectedAnalysis.panelData.harmonizedPanel)
              }
              isAnalyst={selectedAnalysis.isAnalystGenerated}
              showFab={false}
              showLabel={false}
              label="Baixar PDF"
              className="p-1.5 rounded-lg bg-transparent text-[#e5e2e1]/80 hover:text-[#f2ca50] transition-colors duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]/70 cursor-pointer"
            />
          )}

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg bg-transparent text-[#e5e2e1]/80 hover:text-[#f2ca50] transition-colors duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]/70 cursor-pointer"
            title={expanded ? 'Recolher painel' : 'Expandir painel'}
            aria-label={expanded ? 'Recolher painel' : 'Expandir painel'}
          >
            {expanded ? (
              <svg
                className="w-[18px] h-[18px] sm:w-5 sm:h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75" />
                <path d="M15 9h4.5M15 9V4.5M15 9l5.25-5.25" />
                <path d="M9 15v4.5M9 15H4.5M9 15l-5.25 5.25" />
                <path d="M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
              </svg>
            ) : (
              <svg
                className="w-[18px] h-[18px] sm:w-5 sm:h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9" />
                <path d="M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9" />
                <path d="M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15" />
                <path d="M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 chat-scroll-pane pt-0.5">
        {expanded ? (
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">{children}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default function MyAnalysesWorkspace({
  initialItems,
  userId,
  hasAnyPaidAccess,
  isLocked,
  initialSelectedId = null,
  initialPanelOpen = false,
}: MyAnalysesWorkspaceProps) {
  const [items, setItems] = useState<SavedAnalysisItem[]>(initialItems);
  // DEV-317: filtros somáveis (produto e origem). Dentro do mesmo grupo vale "ou"; entre grupos, "e".
  const [filtros, setFiltros] = useState<Set<string>>(() => new Set());
  const [filtroAberto, setFiltroAberto] = useState(false);
  const alternarFiltro = (id: string) =>
    setFiltros((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  useEffect(() => {
    if (!filtroAberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltroAberto(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtroAberto]);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (initialSelectedId && initialItems.some((item) => item.id === initialSelectedId)) {
      return initialSelectedId;
    }
    return initialItems[0]?.id ?? null;
  });
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [mobileSheetSnap, setMobileSheetSnap] = useState<ReadingSheetSnap>(
    initialPanelOpen && initialItems.some(item => item.id === initialSelectedId) ? 'full' : 'closed',
  );
  const [favoriteId, setFavoriteId] = useState<string | null>(() => {
    const fromServer = initialItems.find((item) => item.isFavorite)?.id ?? null;
    if (fromServer) return fromServer;
    return null;
  });
  const [deleteTarget, setDeleteTarget] = useState<SavedAnalysisItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const {
    phase: pdfOverlayPhase,
    isDownloading: isPdfDownloading,
    startDownload: startPdfDownload,
    retry: retryPdfDownload,
    dismiss: dismissPdfOverlay,
  } = usePdfDownloadOverlay();

  useEffect(() => {
    const sync = () => syncAnaliseCtaLabels();
    sync();
    window.addEventListener('pageshow', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('pageshow', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const serverFav = items.find((item) => item.isFavorite)?.id ?? null;
    if (!serverFav) {
      const stored = getStoredFavoriteAnalysisId(userId);
      if (stored && items.some((item) => item.id === stored && item.canFavorite)) {
        setFavoriteId(stored);
      }
    }
  }, [userId, items]);

  // Só o Nome Social está à venda: o filtro é só pela origem do nome (sem filtro de produto).
  const filteredItems = useMemo(() => {
    const aceitas = new Set(
      FILTROS_ORIGEM.filter((f) => filtros.has(f.id)).flatMap((f) => f.origens),
    );
    return items.filter(
      (item) => aceitas.size === 0 || (item.origemNome != null && aceitas.has(item.origemNome)),
    );
  }, [items, filtros]);
  const opcoesFiltro: OpcaoFiltro[] = useMemo(
    () =>
      FILTROS_ORIGEM.map((f) => ({
        id: f.id,
        grupo: 'origem' as const,
        rotulo: f.rotulo,
        total: items.filter((i) => i.origemNome != null && f.origens.includes(i.origemNome)).length,
      })).filter((o) => o.total > 0),
    [items],
  );

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const selectedAnalysis = useMemo(
    () => items.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null,
    [items, filteredItems, selectedId],
  );

  const handleSelectAnalysis = useCallback((item: SavedAnalysisItem) => {
    setSelectedId(item.id);
    if (isMobileStackedViewport()) {
      setMobileSheetSnap('full');
    }
  }, []);

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, item: SavedAnalysisItem) => {
      e.preventDefault();
      e.stopPropagation();
      if (!item.canFavorite) return;
      const nextFav = favoriteId === item.id ? null : item.id;
      setFavoriteId(nextFav);
      void persistFavoriteAnalysis(userId, nextFav);
    },
    [favoriteId, userId],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/delete-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao excluir');
      }
      const removedId = deleteTarget.id;
      setItems((prev) => prev.filter((item) => item.id !== removedId));
      if (favoriteId === removedId) {
        setFavoriteId(null);
      }
      if (selectedId === removedId) {
        setMobileSheetSnap('closed');
      }
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível excluir a análise.');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, favoriteId, selectedId]);

  const analysesDockLayout = useMemo<ChatDockLayout>(
    () => ({
      screen: 'chat_suggestions',
      middleSecondaries: [],
      showPdfCircle: false,
    }),
    [],
  );

  const handleDockSecondary = useCallback(
    (action: DockSecondaryActionId) => {
      if (action === 'reading' || action === 'summary') {
        if (!selectedAnalysis) return;
        setMobileSheetSnap((prev) => (prev === 'closed' ? 'full' : 'closed'));
      }
    },
    [selectedAnalysis],
  );

  const handleDockPrimary = useCallback((_action: DockPrimaryActionId) => {}, []);

  const renderRightPanelBody = (analysis: SavedAnalysisItem | null) => {
    if (!analysis) {
      return (
        <div className="rounded-2xl bg-[#1C1C1C] border border-white/[0.06] p-6 text-center">
          <p className="font-cinzel text-sm font-bold text-[#e5e2e1] mb-1">
            Nenhuma análise selecionada
          </p>
          <p className="text-xs text-[#A0A0A0]">
            Selecione um nome à esquerda para visualizar o painel numerológico completo.
          </p>
        </div>
      );
    }

    if (analysis.status !== 'complete') {
      const isProcessing = analysis.status === 'processing' || analysis.status === 'pending';
      return (
        <div className="rounded-2xl bg-[#1C1C1C] border border-white/[0.06] p-6 text-center space-y-3">
          <h3 className="font-cinzel text-lg font-bold text-[#e5e2e1]">
            {analysis.nomeExibido}
          </h3>
          <p className="text-sm text-[#A0A0A0]">
            {isProcessing
              ? 'Esta análise ainda está sendo processada.'
              : analysis.errorMessage || 'Esta análise encontrou um erro durante o processamento.'}
          </p>
          <a
            href={`/app/resultado/${analysis.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] text-[#131313] font-bold text-xs px-5 py-2.5 hover:bg-[#f2ca50] transition-all"
          >
            {isProcessing ? 'Acompanhar processamento' : 'Ver detalhes do erro'}
          </a>
        </div>
      );
    }

    const p = analysis.panelData;
    return (
      <div className="flex flex-col gap-4">
        <ChatSidebarSection
          birthPanel={p.birthPanel}
          harmonizedPanel={p.harmonizedPanel}
          showScoreCard={p.showScoreCard}
          showStarDetail={p.showStarDetail}
          starPanelData={p.starPanelData}
          isSuggestion={p.isSuggestion}
          radarAxes={p.radarAxes}
          radarOverlayAxes={p.radarOverlayAxes}
          radarLabels={p.radarLabels}
          radarShowNumericLabels={p.radarShowNumericLabels}
          contextChips={p.contextChips}
          showRadar={p.showRadar}
          readingSummary={p.readingSummary}
          showReadingSummary={p.showReadingSummary}
        />
        <CandidateSummaryBlock item={analysis} />
      </div>
    );
  };

  if (isLocked) {
    return (
      <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#1a1a1a]">
        <div className="hidden lg:block h-14 shrink-0" aria-hidden="true" />
        <div className="flex-1 min-h-0 chat-scroll-pane px-4 sm:px-6 md:px-10 py-8 flex items-center justify-center max-lg:pb-[var(--nm-mobile-dock-clearance)]">
          <section className="w-full max-w-xl rounded-2xl bg-[#1C1C1C] border border-[#D4AF37]/20 p-8 md:p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#A0A0A0]">
              Área bloqueada
            </p>
            <h1 className="font-cinzel text-2xl font-bold text-[#e5e2e1] md:text-3xl">
              Minhas Análises
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#A0A0A0]">
              Suas análises pagas aparecerão aqui depois que você adquirir um produto ou acessar uma análise já comprada.
            </p>
            <a
              href="/app"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#131313] transition hover:bg-[#f2ca50]"
            >
              Ver produtos
            </a>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#1a1a1a]">
      <div className="hidden lg:block h-14 shrink-0" aria-hidden="true" />

      <div
        className={`flex-1 min-h-0 w-full mx-auto grid ${
          panelExpanded
            ? 'grid-cols-1 px-2.5 sm:px-4 md:px-5 lg:px-6 md:pr-1 lg:pr-1.5'
            : [
                'grid-cols-1',
                'md:grid-cols-[minmax(300px,42%)_minmax(0,1fr)]',
                'lg:grid-cols-[minmax(330px,38%)_minmax(0,1fr)]',
                'xl:grid-cols-[minmax(360px,35%)_minmax(0,1fr)]',
                '2xl:grid-cols-[minmax(390px,33%)_minmax(0,1fr)]',
                'gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-8',
                'px-2.5 sm:px-4 md:pl-5 lg:pl-6 xl:pl-8 2xl:pl-10 md:pr-1 lg:pr-1.5',
              ].join(' ')
        }`}
      >
        {/* Coluna Esquerda (menor no desktop): lista empilhada da última análise feita */}
        <section
          aria-label="Lista de análises salvas"
          className={`relative flex flex-col min-h-0 min-w-0 py-3 md:py-3 lg:py-4 ${
            panelExpanded ? 'hidden' : ''
          }`}
        >
          <div className="flex-1 min-h-0 chat-scroll-pane space-y-3 pb-4 pt-1 pl-0.5 max-lg:pb-[var(--nm-mobile-dock-clearance)] lg:pb-6 pr-0.5 sm:pr-1">
            {/* Cabeçalho da coluna esquerda */}
            <h1 className="px-0.5 font-cinzel text-2xl sm:text-[1.65rem] font-bold text-[#e5e2e1] tracking-wide leading-tight">
              Minhas Análises
            </h1>
            {/* Desktop: botão Filtrar na linha de baixo, sozinho */}
            <div className="relative hidden md:flex items-center px-0.5">
              {opcoesFiltro.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFiltroAberto((v) => !v)}
                  aria-expanded={filtroAberto}
                  aria-controls="analises-filtro"
                  className={`hidden md:inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors duration-300 ${
                    filtros.size > 0 ? 'bg-[#D4AF37] text-[#131313]' : 'bg-[#1C1C1C] text-[#e5e2e1] hover:bg-white/[0.06]'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
                  </svg>
                  Filtrar{filtros.size > 0 ? ` · ${filtros.size}` : ''}
                </button>
              )}
              {filtroAberto && (
                <>
                  <button
                    type="button"
                    aria-label="Fechar filtro"
                    onClick={() => setFiltroAberto(false)}
                    className="hidden md:block fixed inset-0 z-[84] cursor-default"
                  />
                  <div
                    id="analises-filtro"
                    role="dialog"
                    aria-label="Filtrar análises"
                    className="hidden md:block absolute left-0 top-full z-[85] mt-2 w-72 rounded-2xl bg-[#1c1c1c] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                  >
                    {(['origem'] as const).map((grupo) => {
                      const ops = opcoesFiltro.filter((o) => o.grupo === grupo);
                      if (ops.length === 0) return null;
                      return (
                        <div key={grupo} className="pb-2">
                          <p className="nm-eyebrow px-2 pb-1.5 pt-1">Mostrar</p>
                          <div className="flex flex-col gap-1">
                            {ops.map((op) => {
                              const ativo = filtros.has(op.id);
                              return (
                                <button
                                  key={op.id}
                                  type="button"
                                  onClick={() => alternarFiltro(op.id)}
                                  aria-pressed={ativo}
                                  className={`flex min-h-10 items-center justify-between gap-3 rounded-2xl px-3 text-sm transition-colors duration-300 ${
                                    ativo ? 'bg-[#D4AF37]/12 text-[#f2ca50]' : 'text-[#e5e2e1]/85 hover:bg-white/[0.04]'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span
                                      aria-hidden="true"
                                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                                        ativo ? 'bg-[#D4AF37] text-[#131313]' : 'bg-white/[0.08]'
                                      }`}
                                    >
                                      {ativo ? '✓' : ''}
                                    </span>
                                    {op.rotulo}
                                  </span>
                                  <span className="text-xs text-[#A0A0A0]">{op.total}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {filtros.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setFiltros(new Set())}
                        className="mt-1 w-full rounded-full px-3 py-2 text-xs text-[#A0A0A0] transition-colors duration-300 hover:bg-white/[0.04] hover:text-[#e5e2e1]"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile: só os chips somáveis, com rolagem por toque e setas sutis */}
            {opcoesFiltro.length > 0 && (
              <div className="md:hidden -mx-0.5">
                <ChipScroller label="Filtrar análises">
                  <button
                    type="button"
                    onClick={() => setFiltros(new Set())}
                    aria-pressed={filtros.size === 0}
                    className={`${CHIP_BASE} ${filtros.size === 0 ? CHIP_ATIVO : CHIP_INATIVO}`}
                  >
                    Todos
                  </button>
                  {opcoesFiltro.map((op) => {
                    const ativo = filtros.has(op.id);
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => alternarFiltro(op.id)}
                        aria-pressed={ativo}
                        className={`${CHIP_BASE} ${ativo ? CHIP_ATIVO : CHIP_INATIVO}`}
                      >
                        {op.rotulo}
                      </button>
                    );
                  })}
                </ChipScroller>
              </div>
            )}

            {/* Empty state ou Lista empilhada */}
            {filteredItems.length === 0 ? (
              <div className="bg-[#1C1C1C] border border-[#D4AF37]/20 rounded-2xl p-8 sm:p-10 text-center">
                <div className="text-4xl mb-3">✨</div>
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] mb-2">
                  Nenhuma análise ainda
                </h2>
                <p className="text-xs sm:text-sm text-[#A0A0A0] mb-5">
                  Inicie sua primeira análise numerológica.
                </p>
                <a
                  href="/app/analise/nome-social"
                  className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] text-[#131313] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full hover:bg-[#f2ca50] transition-all"
                >
                  Começar Agora
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3" id="analysis-list">
                {filteredItems.map((item) => {
                  const isSelected = selectedAnalysis?.id === item.id;
                  const isFav = Boolean(favoriteId && favoriteId === item.id);

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      data-analysis-id={item.id}
                      data-product={item.productType}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectAnalysis(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectAnalysis(item);
                        }
                      }}
                      className={`analysis-card relative min-w-0 w-full text-left cursor-pointer rounded-2xl transition-all duration-150 select-none bg-[#1C1C1C] border focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] ${
                        isSelected
                          ? 'border-2 border-[#D4AF37] shadow-[0_0_0_4px_rgba(212,175,55,0.15)] bg-[#D4AF37]/[0.06]'
                          : 'border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:bg-[#1C1C1C]/90'
                      }`}
                    >
                      {/* Cabeçalho do card: apenas data + favoritar/excluir */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-3.5 pb-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-[#A0A0A0] px-2.5 py-0.5 rounded-full bg-black/25 border border-white/5 whitespace-nowrap">
                            {item.dateFormatted}
                          </span>
                          {item.origemNome && item.origemNome !== 'sistema' && (
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${ORIGEM_TAG[item.origemNome].classe}`}>
                              {ORIGEM_TAG[item.origemNome].rotulo}
                            </span>
                          )}
                        </div>

                        <div
                          className="flex items-center gap-1.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.canFavorite && (
                            <button
                              type="button"
                              data-favorite-id={item.id}
                              data-user-id={userId}
                              data-is-favorite={isFav ? 'true' : 'false'}
                              aria-pressed={isFav}
                              onClick={(e) => handleToggleFavorite(e, item)}
                              title={
                                isFav
                                  ? 'Análise principal do dashboard'
                                  : 'Favoritar como principal no dashboard'
                              }
                              className={`favorite-analysis-btn inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                isFav
                                  ? 'bg-[#D4AF37] text-[#131313] shadow-[0_2px_12px_rgba(212,175,55,0.28)]'
                                  : 'bg-white/[0.06] text-gray-300 hover:bg-[#D4AF37]/15 hover:text-[#f2ca50]'
                              }`}
                            >
                              <svg
                                className="w-3 h-3"
                                viewBox="0 0 24 24"
                                fill={isFav ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                />
                              </svg>
                              <span className="fav-label">
                                {isFav ? 'Principal' : 'Favoritar'}
                              </span>
                            </button>
                          )}

                          {item.canDelete && (
                            <button
                              type="button"
                              data-delete-id={item.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeleteTarget(item);
                              }}
                              title="Excluir análise"
                              aria-label={`Excluir análise ${item.nomeExibido}`}
                              className="delete-analysis p-1.5 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="15"
                                height="15"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Corpo enxuto: nome, score, nível, tag de bloqueio do Triângulo da Vida e barra */}
                      {item.status === 'complete' && item.cardData ? (
                        <div className="px-4 sm:px-5 pb-4 pt-1.5">
                          <ScoreCardRow
                            nome={item.cardData.nome}
                            score={item.cardData.score}
                            scoreTrailing={
                              <LifeTriangleBlockBadge
                                codigos={item.cardData.vidaBloqueiosCodigos}
                                fallbackCount={item.cardData.bloqueios}
                              />
                            }
                          />
                        </div>
                      ) : (
                        <div className="px-4 sm:px-5 pb-4 pt-2 flex items-center justify-between gap-3">
                          <h4 className="font-cinzel text-base sm:text-lg font-bold text-[#e5e2e1] truncate">
                            {item.nomeExibido}
                          </h4>
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                              item.status === 'error'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {item.status === 'error' ? 'Erro na análise' : 'Processando...'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Coluna Direita (Desktop/Tablet md+): título "Painel de análise" sem ponto + ícone baixar PDF + expandir */}
        <aside className="hidden md:flex flex-col min-h-0 min-w-0 py-2 md:py-3 lg:py-4 w-full">
          <AnalysesRightPanelChrome
            expanded={panelExpanded}
            onToggleExpand={() => setPanelExpanded((v) => !v)}
            selectedAnalysis={selectedAnalysis}
          >
            {renderRightPanelBody(selectedAnalysis)}
          </AnalysesRightPanelChrome>
        </aside>
      </div>

      {/* Ponte para Dock Mobile: separador + ícone de painel exatamente igual à análise */}
      <MobileDockActionBridge
        layout={analysesDockLayout}
        summaryPanelOpen={mobileSheetSnap !== 'closed'}
        summaryBadge={Boolean(selectedAnalysis)}
        showReadingAction={Boolean(selectedAnalysis)}
        pdfModel={null}
        onSecondary={handleDockSecondary}
        onPrimary={handleDockPrimary}
      />

      {/* Bottom Sheet Mobile idêntico ao usado no processo de análise */}
      {selectedAnalysis && (
        <MobileReadingBottomSheet
          snap={mobileSheetSnap}
          onSnapChange={setMobileSheetSnap}
          onClose={() => setMobileSheetSnap('closed')}
          birthPanel={selectedAnalysis.panelData.birthPanel}
          harmonizedPanel={selectedAnalysis.panelData.harmonizedPanel}
          showScoreCard={selectedAnalysis.panelData.showScoreCard}
          showStarDetail={selectedAnalysis.panelData.showStarDetail}
          starPanelData={selectedAnalysis.panelData.starPanelData}
          isSuggestion={selectedAnalysis.panelData.isSuggestion}
          radarAxes={selectedAnalysis.panelData.radarAxes}
          radarOverlayAxes={selectedAnalysis.panelData.radarOverlayAxes}
          radarLabels={selectedAnalysis.panelData.radarLabels}
          radarShowNumericLabels={selectedAnalysis.panelData.radarShowNumericLabels}
          contextChips={selectedAnalysis.panelData.contextChips}
          showRadar={selectedAnalysis.panelData.showRadar}
          readingSummary={selectedAnalysis.panelData.readingSummary}
          showReadingSummary={selectedAnalysis.panelData.showReadingSummary}
          scrollToHarmonizedOnEnter={Boolean(selectedAnalysis.panelData.harmonizedPanel)}
          headerFromCard={{
            suggestedName: selectedAnalysis.nomeExibido,
            chosenScore: selectedAnalysis.panelData.chosenScore ?? selectedAnalysis.score ?? 0,
            baseScore: selectedAnalysis.panelData.baseScore ?? selectedAnalysis.score ?? 0,
          }}
          panelPrimary={
            (() => {
              const targetPdfId = resolvePdfAnalysisId(selectedAnalysis);
              if (!targetPdfId) return null;
              return {
                variant: 'pdf' as const,
                onClick: () => {
                  void startPdfDownload({
                    analysisId: targetPdfId,
                    productType: selectedAnalysis.productType,
                    forceFreePdf:
                      selectedAnalysis.isFree ||
                      selectedAnalysis.productType === 'analise_gratuita' ||
                      (selectedAnalysis.productType === 'nome_social' && !selectedAnalysis.panelData.harmonizedPanel),
                  });
                },
                pdfModel: {
                  visible: true,
                  phase: isPdfDownloading
                    ? ('loading' as const)
                    : pdfOverlayPhase === 'error'
                      ? ('error' as const)
                      : ('ready' as const),
                  displayName: selectedAnalysis.nomeExibido,
                  assinaturaLabel: selectedAnalysis.nomeExibido,
                  suggestionRank: 0,
                  score: selectedAnalysis.score ?? 0,
                  isFree: selectedAnalysis.isFree,
                  emailConfirmed: true,
                  analysisId: targetPdfId,
                  priceLabel: '',
                  screen: 'analises',
                },
              };
            })()
          }
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <div
          id="delete-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-[#1C1C1C] w-full max-w-sm rounded-2xl border border-red-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-modal-title" className="font-cinzel text-xl font-bold text-red-400 mb-2">
              Excluir Análise
            </h3>
            <p className="text-[#A0A0A0] text-sm mb-6 leading-relaxed">
              Tem certeza que deseja excluir{' '}
              <span className="text-[#e5e2e1] font-medium">{deleteTarget.nomeExibido}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium bg-[#2a2a2a] hover:bg-[#333] text-gray-300 transition-colors cursor-pointer disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleConfirmDelete()}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatPdfPreparingOverlay
        phase={pdfOverlayPhase}
        onRetry={retryPdfDownload}
        onDismissError={dismissPdfOverlay}
      />
    </div>
  );
}
