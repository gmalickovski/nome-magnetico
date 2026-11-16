import { ArquetipoResumoCard } from '../ArquetipoResumoCard';
import type { ArchetypeSummary } from '../../../../shared/archetype-summary';
import { GlossaryInlineTerm } from '../../glossary/GlossaryInlineTerm';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReadingRadar } from '../chat/ReadingRadar.js';
import type { RadarAxesData } from '../chat/chat-types.js';
import { hasUnfinishedChatSession, syncAnaliseCtaLabels } from '../chat/chat-session-storage.js';
import { DashboardCheckoutButton } from '../DashboardCheckoutButton';
import { PDFFeedbackButton } from '../PDFFeedbackButton';
import { getScoreTierVisual } from '../../landing/ProductResultFrame';
import type { ActivePromotion, PriceInfo } from '../../../../backend/payments/prices';
import {
  CHECKLIST_ITEMS,
  type ChecklistKey,
  type ChecklistState,
  checklistSlideStorageKey,
  checklistStorageKey,
  countChecklistDone,
  EMPTY_CHECKLIST,
  getVibrationActivationInfo,
  offerDismissStorageKey,
  parseChecklistState,
  persistSlideChecklist,
} from '../../../lib/app-dashboard-checklist';
import {
  FAVORITE_ANALYSIS_CHANGE_EVENT,
  getStoredFavoriteAnalysisId,
  persistFavoriteAnalysis,
} from '../../../lib/favorite-analysis';

/** CTA dourado do painel: primário da marca (#D4AF37), hover #f2ca50; texto #111111 */
const CTA_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-[#111111] shadow-[0_2px_16px_rgba(212,175,55,0.28)] transition hover:bg-[#f2ca50] hover:shadow-[0_4px_24px_rgba(212,175,55,0.45)] active:scale-[0.98]';

export interface DashboardHeroStarNumbers {
  destino: number;
  expressao: number;
  motivacao: number;
  missao: number;
  impressao: number;
}

export interface DashboardHeroSlide {
  arquetipo?: ArchetypeSummary | null;
  arquetipoNascimento?: ArchetypeSummary | null;
  origem?: 'manual' | 'gerado';
  id: string;
  nome: string;
  birthName: string;
  score: number;
  birthScore: number;
  bloqueiosCount: number;
  bloqueiosTitulos: string[];
  compatibilidade: 'favoravel' | 'neutro' | 'desfavoravel' | null;
  starNumbers: DashboardHeroStarNumbers;
  productType: string;
  isFree: boolean;
  isFavorite: boolean;
  dateLabel: string;
  resultadoHrefOverride?: string;
  pdfAnalysisId?: string;
  checklistAnalysisId?: string;
  birthRadarAxes?: RadarAxesData;
  harmonizedRadarAxes?: RadarAxesData | null;
  radarLabels?: Record<string, string>;
  initialChecklist?: Partial<Record<ChecklistKey, boolean>>;
}

export interface DashboardHistoryItem {
  id: string;
  nome: string;
  dateLabel: string;
  score: number | null;
  productType?: string;
  isFree?: boolean;
  isFavorite?: boolean;
}

export interface AppDashboardProps {
  userId: string;
  nomeHoje: string;
  nomeHarmonizado: string | null;
  score: number;
  birthScore?: number;
  scorePotencial?: number | null;
  scoreLabel: string;
  scoreColor: string;
  bloqueios: string[];
  analysisId: string;
  featuredProductType?: string;
  featuredIsFree?: boolean;
  signatureChosen?: boolean;
  pdfReady?: boolean;
  radarAxes: RadarAxesData;
  harmonizedRadarAxes?: RadarAxesData | null;
  radarLabels: Record<string, string>;
  history: DashboardHistoryItem[];
  heroSlides?: DashboardHeroSlide[];
  hasNomeSocial: boolean;
  isAdmin: boolean;
  isExpired: boolean;
  accessEndLabel: string | null;
  hasPaidAccess: boolean;
  onlyFreeAnalysis: boolean;
  socialPrice: PriceInfo;
  promotion: ActivePromotion | null;
}

const STAR_POINT_ITEMS: ReadonlyArray<{
  key: keyof DashboardHeroStarNumbers;
  label: string;
}> = [
  { key: 'destino', label: 'Destino' },
  { key: 'expressao', label: 'Expressão' },
  { key: 'motivacao', label: 'Motivação' },
  { key: 'missao', label: 'Missão' },
  { key: 'impressao', label: 'Impressão' },
];

function buildInitialChecklistMap(slides: readonly DashboardHeroSlide[]): Record<string, ChecklistState> {
  const map: Record<string, ChecklistState> = {};
  for (const slide of slides) {
    map[slide.id] = slide.initialChecklist
      ? parseChecklistState(slide.initialChecklist)
      : { ...EMPTY_CHECKLIST };
  }
  return map;
}

function useSlideChecklists(userId: string, slides: readonly DashboardHeroSlide[]) {
  const [bySlide, setBySlide] = useState<Record<string, ChecklistState>>(() =>
    buildInitialChecklistMap(slides),
  );

  useEffect(() => {
    setBySlide((prev) => {
      const next: Record<string, ChecklistState> = {};
      for (const slide of slides) {
        const dbHasSaved = Boolean(
          slide.initialChecklist && Object.keys(slide.initialChecklist).length > 0,
        );
        const slideKeyStorage = checklistSlideStorageKey(userId, slide.id);
        const localRaw =
          typeof localStorage !== 'undefined' ? localStorage.getItem(slideKeyStorage) : null;

        if (dbHasSaved) {
          next[slide.id] = parseChecklistState(slide.initialChecklist);
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(slideKeyStorage, JSON.stringify(next[slide.id]));
            }
          } catch {
            /* ignore */
          }
        } else if (localRaw) {
          next[slide.id] = parseChecklistState(localRaw);
        } else if (prev[slide.id]) {
          next[slide.id] = prev[slide.id];
        } else {
          // Migra eventual checklist legado antigo sem perder histórico
          const legacyRaw =
            typeof localStorage !== 'undefined' ? localStorage.getItem(checklistStorageKey(userId)) : null;
          next[slide.id] = legacyRaw ? parseChecklistState(legacyRaw) : { ...EMPTY_CHECKLIST };
        }
      }
      return next;
    });
  }, [userId, slides]);

  const toggle = useCallback(
    (slide: DashboardHeroSlide, key: ChecklistKey) => {
      setBySlide((prev) => {
        const current = prev[slide.id] ?? { ...EMPTY_CHECKLIST };
        const updated: ChecklistState = { ...current, [key]: !current[key] };
        const targetAnalysisId = slide.checklistAnalysisId ?? slide.pdfAnalysisId ?? slide.id;
        void persistSlideChecklist({
          userId,
          analysisId: targetAnalysisId,
          slideKey: slide.id,
          state: updated,
        });
        return { ...prev, [slide.id]: updated };
      });
    },
    [userId],
  );

  return { bySlide, toggle };
}

function useOfferDismissed(userId: string) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(offerDismissStorageKey(userId)) === '1');
    } catch {
      /* ignore */
    }
  }, [userId]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(offerDismissStorageKey(userId), '1');
    } catch {
      /* ignore */
    }
  }, [userId]);

  return { dismissed, dismiss };
}

function StarIcon({ filled, className = 'h-3.5 w-3.5' }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
      />
    </svg>
  );
}

export function AppDashboard(props: AppDashboardProps) {
  const { dismissed: offerDismissed, dismiss: dismissOffer } = useOfferDismissed(props.userId);
  const [hasUnfinishedSession, setHasUnfinishedSession] = useState(false);

  const baseSlides = useMemo<DashboardHeroSlide[]>(() => {
    if (props.heroSlides && props.heroSlides.length > 0) {
      return props.heroSlides;
    }
    const isFallbackFree = Boolean(props.featuredIsFree || !props.nomeHarmonizado);
    return [
      {
        id: props.analysisId,
        nome: props.nomeHarmonizado ?? props.nomeHoje,
        birthName: props.nomeHoje,
        score: Math.max(0, Math.min(100, Math.round(props.scorePotencial ?? props.score))),
        birthScore: Math.max(0, Math.min(100, Math.round(props.birthScore ?? props.score))),
        bloqueiosCount: props.bloqueios.length,
        bloqueiosTitulos: props.bloqueios,
        compatibilidade: null,
        starNumbers: { destino: 0, expressao: 0, motivacao: 0, missao: 0, impressao: 0 },
        productType: props.featuredProductType ?? (isFallbackFree ? 'analise_gratuita' : 'nome_social'),
        isFree: isFallbackFree,
        isFavorite: false,
        dateLabel: '',
        birthRadarAxes: props.radarAxes,
        harmonizedRadarAxes: isFallbackFree ? null : (props.harmonizedRadarAxes ?? null),
        radarLabels: props.radarLabels,
      },
    ];
  }, [props]);

  const { bySlide: checklistsBySlide, toggle: toggleSlideChecklist } = useSlideChecklists(
    props.userId,
    baseSlides,
  );

  const serverFavoriteId = useMemo(
    () => baseSlides.find((s) => s.isFavorite && !s.isFree)?.id ?? null,
    [baseSlides],
  );

  const [favoriteId, setFavoriteId] = useState<string | null>(() => {
    if (serverFavoriteId) return serverFavoriteId;
    return getStoredFavoriteAnalysisId(props.userId);
  });

  // Ordem fixa cronológica (esquerda -> direita): nome de nascimento inicial em 0, depois análises por data
  const orderedSlides = baseSlides;

  const [activeIndex, setActiveIndex] = useState<number>(() => {
    const fav = serverFavoriteId ?? getStoredFavoriteAnalysisId(props.userId);
    if (fav) {
      const idx = baseSlides.findIndex((s) => s.id === fav && !s.isFree);
      if (idx >= 0) return idx;
    }
    return 0;
  });

  useEffect(() => {
    const stored = getStoredFavoriteAnalysisId(props.userId);
    const initial = serverFavoriteId ?? stored ?? null;
    setFavoriteId(initial);

    const onFavoriteChange = (ev: Event) => {
      const detail = (ev as CustomEvent<{ userId?: string; analysisId?: string | null }>).detail;
      if (!detail || detail.userId === props.userId) {
        setFavoriteId(detail?.analysisId ?? getStoredFavoriteAnalysisId(props.userId));
      }
    };
    const onStorage = () => {
      setFavoriteId(getStoredFavoriteAnalysisId(props.userId));
    };

    window.addEventListener(FAVORITE_ANALYSIS_CHANGE_EVENT, onFavoriteChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(FAVORITE_ANALYSIS_CHANGE_EVENT, onFavoriteChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [props.userId, serverFavoriteId]);

  const [slidePhase, setSlidePhase] = useState<'idle' | 'entering-next' | 'entering-prev'>('idle');

  const safeIndex = Math.min(activeIndex, Math.max(0, orderedSlides.length - 1));
  const activeSlide = orderedSlides[safeIndex] ?? orderedSlides[0];
  const hasMultipleSlides = orderedSlides.length > 1;
  const canGoPrev = hasMultipleSlides && safeIndex > 0;
  const canGoNext = hasMultipleSlides && safeIndex < orderedSlides.length - 1;

  const triggerSlideTransition = useCallback((direction: 'next' | 'prev', nextIndex: number) => {
    setSlidePhase(direction === 'next' ? 'entering-next' : 'entering-prev');
    setActiveIndex(nextIndex);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlidePhase('idle');
      });
    });
  }, []);

  const goPrevSlide = useCallback(() => {
    if (safeIndex <= 0) return;
    triggerSlideTransition('prev', safeIndex - 1);
  }, [safeIndex, triggerSlideTransition]);

  const goNextSlide = useCallback(() => {
    if (safeIndex >= orderedSlides.length - 1) return;
    triggerSlideTransition('next', safeIndex + 1);
  }, [orderedSlides.length, safeIndex, triggerSlideTransition]);

  const handleToggleFavorite = useCallback(
    (targetId: string, isFreeRow = false) => {
      if (isFreeRow) return;
      const nextFav = favoriteId === targetId ? null : targetId;
      setFavoriteId(nextFav);
      void persistFavoriteAnalysis(props.userId, nextFav);
    },
    [favoriteId, props.userId],
  );

  const targetScore = Math.max(0, Math.min(100, Math.round(activeSlide?.score ?? 0)));
  const activeVisual = getScoreTierVisual(targetScore);

  const [displayedScore, setDisplayedScore] = useState<number>(targetScore);
  const animFrameRef = useRef<number | null>(null);
  const displayedRef = useRef<number>(targetScore);
  displayedRef.current = displayedScore;

  // Sincroniza o botão dinâmico "+ Nova Análise" / "Retomar Análise" no dashboard e no header SSR
  useEffect(() => {
    const syncSession = () => {
      setHasUnfinishedSession(hasUnfinishedChatSession(props.userId));
      syncAnaliseCtaLabels();
    };
    syncSession();
    window.addEventListener('pageshow', syncSession);
    window.addEventListener('focus', syncSession);
    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener('pageshow', syncSession);
      window.removeEventListener('focus', syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, [props.userId]);

  // Anima o arco e o contador do score com curva quadrática suave (800ms)
  useEffect(() => {
    const start = displayedRef.current;
    if (start === targetScore) return;

    const duration = 800;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = progress * (2 - progress);
      setDisplayedScore(Math.round(start + (targetScore - start) * ease));
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetScore]);

  const activeChecklist = checklistsBySlide[activeSlide.id] ?? { ...EMPTY_CHECKLIST };
  const doneCount = countChecklistDone(activeChecklist);
  const vibrationInfo = getVibrationActivationInfo(doneCount, CHECKLIST_ITEMS.length);

  const activeBirthAxes = activeSlide.birthRadarAxes ?? props.radarAxes;
  const activeHarmonizedAxes = activeSlide.isFree
    ? null
    : (activeSlide.harmonizedRadarAxes ?? props.harmonizedRadarAxes ?? null);
  const hasDistinctHarmonizedName =
    activeSlide.productType !== 'nome_social' ||
    activeSlide.nome.trim().toLowerCase() !== activeSlide.birthName.trim().toLowerCase();
  const showChecklistCard =
    !activeSlide.isFree && Boolean(activeHarmonizedAxes) && hasDistinctHarmonizedName;
  const activeBirthScoreForRadar = Math.max(
    0,
    Math.min(100, Math.round(activeSlide.birthScore ?? props.birthScore ?? props.score)),
  );
  const activeOverlayScoreForRadar = Math.max(
    0,
    Math.min(100, Math.round(activeSlide.score ?? props.scorePotencial ?? props.score)),
  );
  const activeRadarLabels = activeSlide.radarLabels ?? props.radarLabels;

  const showOfferCard = useMemo(() => {
    if (offerDismissed || props.isAdmin) return false;
    if (props.onlyFreeAnalysis && !props.hasNomeSocial) return true;
    if (props.hasNomeSocial) return true;
    if (props.isExpired) return true;
    return false;
  }, [offerDismissed, props]);

  const resultadoHref = activeSlide.resultadoHrefOverride ?? `/app/resultado/${activeSlide.id}`;
  const pdfAnalysisId = activeSlide.pdfAnalysisId ?? activeSlide.id;
  const isCurrentFavorite = !activeSlide.isFree && favoriteId === activeSlide.id;
  const gainPts = activeSlide.score - activeSlide.birthScore;

  const compatPill =
    activeSlide.compatibilidade === 'favoravel'
      ? {
          label: '✦ Harmônica / Favorável',
          className: 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
        }
      : activeSlide.compatibilidade === 'neutro'
        ? {
            label: '◈ Neutra',
            className: 'border border-amber-500/30 bg-amber-500/15 text-amber-300',
          }
        : activeSlide.compatibilidade === 'desfavoravel'
          ? {
              label: '⚠ Tensão Vibracional',
              className: 'border border-red-500/30 bg-red-500/15 text-red-300',
            }
          : null;

  const radius = 114;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * displayedScore) / 100;

  const slideMotionClass =
    slidePhase === 'entering-next'
      ? 'translate-x-5 opacity-0'
      : slidePhase === 'entering-prev'
        ? '-translate-x-5 opacity-0'
        : 'translate-x-0 opacity-100';

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Card Hero principal + carrossel quando houver múltiplas análises */}
      <section className="relative" aria-label="Resumo da análise principal">
        <div className="flex items-center gap-2 lg:gap-3">
          {hasMultipleSlides && (
            <button
              type="button"
              onClick={goPrevSlide}
              disabled={!canGoPrev}
              aria-hidden={!canGoPrev}
              tabIndex={canGoPrev ? 0 : -1}
              aria-label="Análise anterior"
              className={`hidden sm:inline-flex h-10 w-8 shrink-0 items-center justify-center bg-transparent transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff] ${
                canGoPrev
                  ? 'cursor-pointer text-[#e5e2e1]/55 hover:scale-110 hover:text-[#f2ca50] active:scale-95'
                  : 'pointer-events-none opacity-0'
              }`}
            >
              <ChevronIcon direction="left" />
            </button>
          )}

          <div
            className="nm-floating-card mx-auto w-full min-w-0 flex-1 overflow-hidden rounded-2xl p-5 sm:p-8 lg:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
            style={{
              borderColor: `${activeVisual.stroke}59`,
              transition: 'border-color 0.7s ease',
            }}
          >
            <div
              key={activeSlide.id}
              className={`flex flex-col items-center gap-7 text-center transition-all duration-300 ease-out lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center lg:gap-8 lg:text-left ${slideMotionClass}`}
            >
              {/* Lado Esquerdo (Desktop) / Base (Mobile): Nome, Tags em Pílula, 5 Pontas da Estrela, 2 Botões */}
              <div className="order-2 flex w-full min-w-0 flex-1 flex-col items-center lg:order-1 lg:items-start">
                <div className="flex w-full flex-wrap items-center justify-center gap-2 lg:justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                      isCurrentFavorite
                        ? 'bg-[#D4AF37]/15 text-[#f2ca50]'
                        : !activeSlide.isFree
                          ? 'bg-[#D4AF37]/10 text-[#f2ca50]/90'
                          : 'bg-white/[0.06] text-[#A0A0A0]'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        !activeSlide.isFree ? 'bg-[#f2ca50]' : 'bg-[#A0A0A0]'
                      }`}
                    />
                    {isCurrentFavorite
                      ? 'Análise principal'
                      : !activeSlide.isFree
                        ? 'Assinatura harmonizada'
                        : 'Nome de nascimento'}
                  </span>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {hasMultipleSlides && (
                      <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[#A0A0A0]">
                        {safeIndex + 1} / {orderedSlides.length}
                      </span>
                    )}
                    {!activeSlide.isFree && (
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(activeSlide.id)}
                        aria-pressed={isCurrentFavorite}
                        aria-label={
                          isCurrentFavorite
                            ? 'Remover análise como principal do dashboard'
                            : 'Favoritar esta análise como principal do dashboard'
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 ${
                          isCurrentFavorite
                            ? 'bg-[#D4AF37] text-[#131313] shadow-[0_2px_14px_rgba(212,175,55,0.3)] hover:bg-[#f2ca50]'
                            : 'bg-white/[0.06] text-[#e5e2e1] hover:bg-[#D4AF37]/15 hover:text-[#f2ca50]'
                        }`}
                      >
                        <StarIcon filled={isCurrentFavorite} className="h-3.5 w-3.5" />
                        <span>{isCurrentFavorite ? 'Favorita' : 'Favoritar'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Nome grande */}
                <h1
                  className={`mt-3.5 font-cinzel text-2xl font-bold leading-tight tracking-wide break-words sm:text-3xl lg:text-[34px] xl:text-[38px] ${
                    !activeSlide.isFree ? 'text-[#f2ca50]' : 'text-[#e5e2e1]'
                  }`}
                >
                  {activeSlide.nome || 'Nome não informado'}
                </h1>

                {/* Tags em formato pílula relacionadas à análise */}
                <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <span
                    className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-semibold ${activeVisual.badgeClass}`}
                    style={{ backgroundColor: activeVisual.fill }}
                  >
                    {activeVisual.label}
                  </span>

                  <span
                    className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-semibold ${
                      activeSlide.bloqueiosCount === 0
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                        : 'border-red-500/30 bg-red-500/15 text-red-300'
                    }`}
                  >
                    {activeSlide.bloqueiosCount === 0
                      ? '✓ 0 Bloqueios'
                      : `⚠ ${activeSlide.bloqueiosCount} ${activeSlide.bloqueiosCount === 1 ? 'Bloqueio ativo' : 'Bloqueios ativos'}`}
                  </span>

                  {compatPill && (
                    <span
                      className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold ${compatPill.className}`}
                    >
                      {compatPill.label}
                    </span>
                  )}

                  {!activeSlide.isFree && gainPts > 0 && (
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-1 text-xs font-semibold text-emerald-300">
                      +{gainPts} pts sobre o nome de nascimento
                    </span>
                  )}

                  {activeSlide.origem === 'manual' && (
                    <span className="inline-flex items-center rounded-full border border-[#bea5ff]/30 bg-[#bea5ff]/10 px-3.5 py-1 text-xs font-semibold text-[#d7c6ff]">
                      Nome informado por você
                    </span>
                  )}

                  {activeSlide.isFree &&
                    activeSlide.bloqueiosTitulos.slice(0, 2).map((titulo) => (
                      <span
                        key={titulo}
                        className="inline-flex items-center rounded-full border border-red-500/25 bg-red-500/10 px-3.5 py-1 text-xs font-medium text-red-300"
                      >
                        {titulo}
                      </span>
                    ))}
                </div>

                {/* As 5 pontas da estrela e seus números */}
                <div className="mt-5 w-full">
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#A0A0A0]">
                    As 5 pontas da estrela
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 sm:gap-3">
                    {STAR_POINT_ITEMS.map((item) => (
                      <div
                        key={item.key}
                        className={`flex flex-col items-center justify-center rounded-xl bg-[#131313]/85 px-3 py-3 ${
                          item.key === 'destino' ? 'col-span-2 sm:col-span-1' : ''
                        }`}
                      >
                        <span
                          className="font-cinzel text-xl font-bold leading-none tabular-nums sm:text-2xl"
                          style={{ color: activeVisual.text }}
                        >
                          {activeSlide.starNumbers[item.key] || '—'}
                        </span>
                        <span className="mt-1.5 text-xs sm:text-sm font-medium tracking-wide text-[#e5e2e1]/90">
                          {item.key === 'expressao' ? <GlossaryInlineTerm slug="numero-de-expressao">{item.label}</GlossaryInlineTerm> : item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apenas dois botões: Baixar PDF e Ver Painel de Análise */}
                <div className="mt-6 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:w-auto">
                  <PDFFeedbackButton
                    analysisId={pdfAnalysisId}
                    productType={activeSlide.productType}
                    isFree={activeSlide.isFree}
                    forceFreePdf={Boolean(activeSlide.isFree || !hasDistinctHarmonizedName)}
                    label="Baixar PDF"
                    showLabel
                    showFab={false}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.07] px-5 py-2.5 text-sm font-semibold text-[#e5e2e1] transition hover:bg-white/[0.12] hover:text-[#f2ca50] active:scale-[0.98]"
                  />
                  <a href={resultadoHref} className={CTA_CLASS}>
                    Ver Painel de Análise
                  </a>
                </div>
              </div>

              {/* Lado Direito (Desktop) / Topo (Mobile): Apenas o círculo grande do score */}
              <div className="order-1 flex shrink-0 items-center justify-center p-2 lg:order-2 lg:h-full lg:justify-end">
                <a
                  href={resultadoHref}
                  className="group relative flex h-56 w-56 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff] sm:h-64 sm:w-64 lg:h-[280px] lg:w-[280px]"
                  aria-label={`Score ${targetScore} para ${activeSlide.nome}. Clique para ver o painel de análise.`}
                >
                  <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 260 260">
                    <circle
                      cx="130"
                      cy="130"
                      r={radius}
                      className="stroke-white/[0.06]"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    <circle
                      cx="130"
                      cy="130"
                      r={radius}
                      stroke={activeVisual.stroke}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      style={{ transition: 'stroke 0.8s ease' }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <span
                      className="font-cinzel text-[58px] font-bold leading-none tracking-tight tabular-nums sm:text-[64px] lg:text-[72px]"
                      style={{ color: activeVisual.text }}
                    >
                      {displayedScore}
                    </span>
                    <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[#A0A0A0]">
                      Pontos
                    </span>
                    <span
                      className={`mt-3 inline-flex items-center rounded-full border px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider ${activeVisual.badgeClass}`}
                      style={{ backgroundColor: activeVisual.fill }}
                    >
                      {activeVisual.label}
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {hasMultipleSlides && (
            <button
              type="button"
              onClick={goNextSlide}
              disabled={!canGoNext}
              aria-hidden={!canGoNext}
              tabIndex={canGoNext ? 0 : -1}
              aria-label="Próxima análise"
              className={`hidden sm:inline-flex h-10 w-8 shrink-0 items-center justify-center bg-transparent transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff] ${
                canGoNext
                  ? 'cursor-pointer text-[#e5e2e1]/55 hover:scale-110 hover:text-[#f2ca50] active:scale-95'
                  : 'pointer-events-none opacity-0'
              }`}
            >
              <ChevronIcon direction="right" />
            </button>
          )}
        </div>

        {/* Navegação do carrossel no mobile + indicadores */}
        {hasMultipleSlides && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goPrevSlide}
              disabled={!canGoPrev}
              aria-hidden={!canGoPrev}
              tabIndex={canGoPrev ? 0 : -1}
              aria-label="Análise anterior"
              className={`sm:hidden inline-flex h-8 w-8 items-center justify-center bg-transparent transition-all duration-200 ${
                canGoPrev
                  ? 'cursor-pointer text-[#e5e2e1]/65 hover:text-[#f2ca50] active:scale-95'
                  : 'pointer-events-none opacity-0'
              }`}
            >
              <ChevronIcon direction="left" />
            </button>

            <div className="flex items-center gap-2" role="tablist" aria-label="Selecionar análise">
              {orderedSlides.map((slide, idx) => {
                const isSelected = idx === safeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-label={`Ver análise ${idx + 1}: ${slide.nome}`}
                    onClick={() => {
                      if (idx === safeIndex) return;
                      triggerSlideTransition(idx > safeIndex ? 'next' : 'prev', idx);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isSelected
                        ? 'w-7 bg-[#D4AF37]'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={goNextSlide}
              disabled={!canGoNext}
              aria-hidden={!canGoNext}
              tabIndex={canGoNext ? 0 : -1}
              aria-label="Próxima análise"
              className={`sm:hidden inline-flex h-8 w-8 items-center justify-center bg-transparent transition-all duration-200 ${
                canGoNext
                  ? 'cursor-pointer text-[#e5e2e1]/65 hover:text-[#f2ca50] active:scale-95'
                  : 'pointer-events-none opacity-0'
              }`}
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        )}
      </section>

      {/* Teia dinâmica + Checklist por card (somente em nomes harmonizados) */}
      <div
        className={`grid gap-6 lg:gap-8 ${
          showChecklistCard ? 'lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        <section className="nm-reading-card flex flex-col justify-between rounded-2xl bg-[#1C1C1C] p-5 sm:p-6 shadow-[0_6px_18px_rgba(0,0,0,0.28)]">
          <h2 className="mb-2 font-cinzel text-lg font-bold text-[#e5e2e1]">
            <GlossaryInlineTerm slug="mapa-vibracional">Mapa Vibracional</GlossaryInlineTerm>
          </h2>
          <div className="flex flex-1 items-center justify-center rounded-xl py-2">
            <ReadingRadar
              variant="dashboard"
              axes={activeBirthAxes}
              overlayAxes={activeHarmonizedAxes}
              birthScore={activeBirthScoreForRadar}
              overlayScore={activeHarmonizedAxes ? activeOverlayScoreForRadar : null}
              labels={activeRadarLabels}
              showNumericLabels={Boolean(activeHarmonizedAxes)}
              className="mx-auto w-full"
            />
          </div>
        </section>

        {showChecklistCard && (
          <section className="rounded-2xl bg-[#1C1C1C] p-5 sm:p-6 shadow-[0_6px_18px_rgba(0,0,0,0.28)]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-[#e5e2e1]">
                  Jornada de Ativação
                </h2>
                <p className="mt-0.5 text-xs text-[#A0A0A0]">
                  {activeSlide.nome}
                </p>
              </div>
              <p className="text-xs font-medium tabular-nums text-[#A0A0A0]">
                {doneCount} de {CHECKLIST_ITEMS.length} concluídos
              </p>
            </div>

            {/* Grau de Ativação Vibracional + Barra de Progresso */}
            <div className="mt-4 space-y-2 pb-4 border-b border-white/[0.06]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#A0A0A0]">
                    Grau de Vibração
                  </span>
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors duration-500"
                    style={vibrationInfo.badgeStyle}
                  >
                    {vibrationInfo.levelName}
                  </span>
                </div>
                <span
                  className="font-cinzel text-base font-bold tabular-nums transition-colors duration-500"
                  style={{ color: vibrationInfo.textColor }}
                >
                  {vibrationInfo.percentage}%
                </span>
              </div>

              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
                role="progressbar"
                aria-valuenow={vibrationInfo.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Grau de Vibração: ${vibrationInfo.percentage}% (${vibrationInfo.levelName})`}
              >
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${vibrationInfo.barGradient} transition-all duration-700 ease-out`}
                  style={{ width: `${vibrationInfo.percentage}%` }}
                />
              </div>

              <p className="text-xs leading-relaxed text-[#A0A0A0]">
                {vibrationInfo.summary}
              </p>
            </div>

            {/* 6 Passos em checkboxes redondos sem fundo escuro interno */}
            <ul className="mt-4 space-y-1.5">
              {CHECKLIST_ITEMS.map((item) => {
                const checked = activeChecklist[item.key];
                return (
                  <li key={item.key}>
                    <label className="group flex cursor-pointer items-start gap-3.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSlideChecklist(activeSlide, item.key)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                          checked
                            ? 'border-[#34D399] bg-[#34D399]/20 text-[#34D399] shadow-[0_0_12px_rgba(52,211,153,0.28)]'
                            : 'border-[#D4AF37]/40 bg-transparent text-transparent group-hover:border-[#f2ca50]'
                        }`}
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-medium leading-snug transition-colors ${
                            checked
                              ? 'text-emerald-300/90 line-through decoration-emerald-400/40'
                              : 'text-[#e5e2e1]'
                          }`}
                        >
                          {item.step}. {item.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-[#A0A0A0]">
                          {item.description}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {/* Resumo do Arquétipo vinculado ao card selecionado no carrossel */}
      {activeSlide.arquetipo && activeSlide.starNumbers.expressao > 0 && (
        <section
          className="rounded-2xl bg-[#1C1C1C] p-5 sm:p-6 shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
          aria-label="Arquétipo do nome selecionado"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-cinzel text-lg font-bold text-[#e5e2e1]">
                <GlossaryInlineTerm slug="arquetipo">Arquétipo</GlossaryInlineTerm>: {activeSlide.arquetipo.nome}
              </h2>
              <p className="mt-0.5 text-xs text-[#A0A0A0]">
                {activeSlide.nome}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#221F2A] px-3 py-1 text-xs font-medium text-[#d7c6ff]">
                <GlossaryInlineTerm slug="numero-de-expressao">Expressão</GlossaryInlineTerm>&nbsp;{activeSlide.starNumbers.expressao}
              </span>
              {activeSlide.arquetipo.sombra && (
                <span className="inline-flex items-center rounded-full bg-[#241B1A] px-3 py-1 text-xs font-medium text-[#f5b79f]">
                  Sombra: {activeSlide.arquetipo.sombra}
                </span>
              )}
            </div>
          </div>

          <ArquetipoResumoCard
            variant="dashboard"
            arquetipo={activeSlide.arquetipo}
            expressao={activeSlide.starNumbers.expressao}
            arquetipoNascimento={
              !activeSlide.isFree &&
              activeSlide.birthName &&
              activeSlide.nome.trim().toLowerCase() !== activeSlide.birthName.trim().toLowerCase()
                ? activeSlide.arquetipoNascimento
                : undefined
            }
            isSuggestion={
              !activeSlide.isFree &&
              Boolean(activeSlide.birthName) &&
              activeSlide.nome.trim().toLowerCase() !== activeSlide.birthName.trim().toLowerCase()
            }
          />
        </section>
      )}

      {/* Histórico */}
      {props.history.length > 0 && (
        <section className="rounded-2xl bg-[#1C1C1C] p-5 sm:p-6 shadow-[0_6px_18px_rgba(0,0,0,0.28)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-cinzel text-lg font-bold text-[#e5e2e1]">Suas análises</h2>
            <a
              href="/app/analises"
              className="text-xs font-semibold text-[#D4AF37] hover:text-[#f2ca50]"
            >
              Ver todas
            </a>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {props.history.map((row) => {
              const rowFav = !row.isFree && favoriteId === row.id;
              const rowVisual = row.score != null ? getScoreTierVisual(row.score) : null;
              const clampedScore =
                row.score != null ? Math.max(0, Math.min(100, Math.round(row.score))) : 0;
              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between md:gap-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center sm:gap-3">
                    {!row.isFree && (
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(row.id, Boolean(row.isFree))}
                        aria-pressed={rowFav}
                        aria-label={
                          rowFav
                            ? `Remover ${row.nome} dos favoritos`
                            : `Favoritar ${row.nome} como análise principal`
                        }
                        title={rowFav ? 'Análise principal no dashboard' : 'Definir como análise principal'}
                        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition sm:mt-0 ${
                          rowFav
                            ? 'bg-[#D4AF37]/20 text-[#f2ca50]'
                            : 'text-[#A0A0A0] hover:bg-white/[0.06] hover:text-[#f2ca50]'
                        }`}
                      >
                        <StarIcon filled={rowFav} className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="block font-cinzel text-base font-bold leading-snug text-[#f2ca50] break-words sm:truncate sm:text-lg">
                        {row.nome}
                      </span>
                      <p className="nm-caption mt-0.5 text-[#A0A0A0]">{row.dateLabel}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end md:gap-5">
                    {row.score != null && rowVisual && (
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="font-cinzel text-lg font-bold leading-none tabular-nums shrink-0"
                          style={{ color: rowVisual.text }}
                        >
                          {clampedScore}
                        </span>
                        <div
                          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.08] sm:w-32 sm:flex-none md:w-40"
                          role="progressbar"
                          aria-valuenow={clampedScore}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Score ${clampedScore} de 100 (${rowVisual.label})`}
                        >
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${rowVisual.barGradient} transition-all duration-700 ease-out`}
                            style={{ width: `${Math.max(clampedScore, 3)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 shrink-0">
                      <a
                        href={`/app/resultado/${row.id}`}
                        className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-[#D4AF37]/15 px-4 text-xs font-bold uppercase tracking-wide text-[#f2ca50] transition hover:bg-[#D4AF37]/25 sm:flex-none"
                      >
                        Abrir Painel
                      </a>
                      <PDFFeedbackButton
                        analysisId={row.id}
                        productType={row.productType ?? 'nome_social'}
                        isFree={Boolean(row.isFree)}
                        label="Baixar PDF"
                        showLabel={false}
                        showFab={false}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#e5e2e1] ring-1 ring-white/10 transition hover:bg-white/[0.12] hover:text-[#f2ca50]"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Oferta */}
      {showOfferCard && (
        <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#1C1C1C] p-5 sm:p-6">
          {props.onlyFreeAnalysis && !props.hasNomeSocial && !props.isAdmin ? (
            <>
              <p className="text-sm leading-relaxed text-[#e5e2e1]">
                Quer ver todas as sugestões para o seu nome?
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <DashboardCheckoutButton
                  product="nome_social"
                  priceInfo={props.socialPrice}
                  promotion={props.promotion}
                  label="Ver a análise completa"
                  className={CTA_CLASS}
                />
                <button
                  type="button"
                  onClick={dismissOffer}
                  className="text-sm text-[#A0A0A0] hover:text-[#e5e2e1]"
                >
                  Agora não
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[#e5e2e1]">
                {props.isAdmin
                  ? 'Acesso de administrador.'
                  : props.hasNomeSocial && props.accessEndLabel
                    ? `Seu acesso está ativo até ${props.accessEndLabel}.`
                    : props.hasNomeSocial
                      ? 'Seu acesso ao Nome Social está ativo.'
                      : props.isExpired
                        ? 'Seu acesso expirou.'
                        : null}
              </p>
              {(props.isExpired || (!props.hasNomeSocial && props.hasPaidAccess)) && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a href="/comprar" className={CTA_CLASS}>
                    Renovar acesso
                  </a>
                  <button
                    type="button"
                    onClick={dismissOffer}
                    className="text-sm text-[#A0A0A0] hover:text-[#e5e2e1]"
                  >
                    Agora não
                  </button>
                </div>
              )}
              {props.hasNomeSocial && !props.isExpired && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a href="/app/analise/nome-social" className={CTA_CLASS}>
                    {hasUnfinishedSession ? 'Retomar Análise' : 'Abrir chat de análise'}
                  </a>
                  <button
                    type="button"
                    onClick={dismissOffer}
                    className="text-sm text-[#A0A0A0] hover:text-[#e5e2e1]"
                  >
                    Agora não
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default AppDashboard;
