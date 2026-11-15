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
  countChecklistDone,
  checklistStorageKey,
  offerDismissStorageKey,
  parseChecklistState,
  EMPTY_CHECKLIST,
} from '../../../lib/app-dashboard-checklist';
import {
  FAVORITE_ANALYSIS_CHANGE_EVENT,
  getStoredFavoriteAnalysisId,
  orderSlidesWithFavorite,
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
  id: string;
  nome: string;
  birthName: string;
  score: number;
  birthScore: number;
  bloqueiosCount: number;
  bloqueiosTitulos: string[];
  compatibilidadeLabel: string;
  starNumbers: DashboardHeroStarNumbers;
  productType: string;
  isFree: boolean;
  isFavorite: boolean;
  dateLabel: string;
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

export interface DashboardRecommendedReading {
  badge: string;
  title: string;
  subtitle: string;
  href: string;
  ctaLabel: string;
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
  recommendedReading?: DashboardRecommendedReading | null;
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

function useLocalChecklist(
  userId: string,
  autoDetected: { assinatura?: boolean; pdf?: boolean },
) {
  const [state, setState] = useState<ChecklistState>(() => ({
    ...EMPTY_CHECKLIST,
    assinatura: Boolean(autoDetected.assinatura),
    pdf: Boolean(autoDetected.pdf),
  }));

  useEffect(() => {
    const key = checklistStorageKey(userId);
    const parsed = parseChecklistState(
      typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
    );
    setState({
      ...parsed,
      assinatura: parsed.assinatura || Boolean(autoDetected.assinatura),
      pdf: parsed.pdf || Boolean(autoDetected.pdf),
    });
  }, [userId, autoDetected.assinatura, autoDetected.pdf]);

  const persist = useCallback(
    (next: ChecklistState) => {
      setState(next);
      try {
        localStorage.setItem(checklistStorageKey(userId), JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [userId],
  );

  const toggle = useCallback(
    (key: ChecklistKey) => {
      persist({ ...state, [key]: !state[key] });
    },
    [state, persist],
  );

  return { state, toggle };
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

function nextChecklistCta(
  state: ChecklistState,
  props: AppDashboardProps,
  hasUnfinishedSession: boolean,
): { href: string; label: string; checkout?: boolean } {
  const resultado = `/app/resultado/${props.analysisId}`;
  if (!state.assinatura) {
    if (props.hasNomeSocial) {
      return {
        href: '/app/analise/nome-social',
        label: hasUnfinishedSession ? 'Retomar análise' : 'Escolher assinatura',
      };
    }
    return { href: '/comprar', label: 'Ver a análise completa', checkout: true };
  }
  if (!state.tracado) {
    return { href: `${resultado}#guia-assinatura`, label: 'Treine o traçado' };
  }
  if (!state.redes) {
    return { href: `${resultado}#guia-assinatura`, label: 'Use o nome nas redes' };
  }
  if (!state.pdf) {
    return { href: resultado, label: 'Baixar o seu PDF' };
  }
  return { href: resultado, label: 'Ver sua análise' };
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
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
      />
    </svg>
  );
}

export function AppDashboard(props: AppDashboardProps) {
  const { state: checklist, toggle: toggleChecklist } = useLocalChecklist(props.userId, {
    assinatura: props.signatureChosen,
    pdf: props.pdfReady,
  });
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
        compatibilidadeLabel: 'Mapa Cabalístico',
        starNumbers: { destino: 0, expressao: 0, motivacao: 0, missao: 0, impressao: 0 },
        productType: props.featuredProductType ?? (isFallbackFree ? 'analise_gratuita' : 'nome_social'),
        isFree: isFallbackFree,
        isFavorite: false,
        dateLabel: '',
      },
    ];
  }, [props]);

  const serverFavoriteId = useMemo(
    () => baseSlides.find((s) => s.isFavorite && !s.isFree)?.id ?? null,
    [baseSlides],
  );

  const [favoriteId, setFavoriteId] = useState<string | null>(() => {
    if (serverFavoriteId) return serverFavoriteId;
    return getStoredFavoriteAnalysisId(props.userId);
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

  const orderedSlides = useMemo(
    () => orderSlidesWithFavorite(baseSlides, favoriteId),
    [baseSlides, favoriteId],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [slidePhase, setSlidePhase] = useState<'idle' | 'entering-next' | 'entering-prev'>('idle');

  const safeIndex = Math.min(activeIndex, Math.max(0, orderedSlides.length - 1));
  const activeSlide = orderedSlides[safeIndex] ?? orderedSlides[0];
  const hasMultipleSlides = orderedSlides.length > 1;

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
    if (orderedSlides.length <= 1) return;
    const prevIdx = (safeIndex - 1 + orderedSlides.length) % orderedSlides.length;
    triggerSlideTransition('prev', prevIdx);
  }, [orderedSlides.length, safeIndex, triggerSlideTransition]);

  const goNextSlide = useCallback(() => {
    if (orderedSlides.length <= 1) return;
    const nextIdx = (safeIndex + 1) % orderedSlides.length;
    triggerSlideTransition('next', nextIdx);
  }, [orderedSlides.length, safeIndex, triggerSlideTransition]);

  const handleToggleFavorite = useCallback(
    (targetId: string, isFreeRow = false) => {
      if (isFreeRow) return;
      const nextFav = favoriteId === targetId ? null : targetId;
      setFavoriteId(nextFav);
      if (nextFav) {
        setActiveIndex(0);
      }
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

  const birthScoreValue = Math.max(0, Math.min(100, Math.round(props.birthScore ?? props.score)));
  const harmonizedScoreValue = Math.max(
    0,
    Math.min(100, Math.round(props.scorePotencial ?? props.score)),
  );

  const doneCount = countChecklistDone(checklist);
  const cta = useMemo(
    () => nextChecklistCta(checklist, props, hasUnfinishedSession),
    [checklist, props, hasUnfinishedSession],
  );

  const showOfferCard = useMemo(() => {
    if (offerDismissed) return false;
    if (props.onlyFreeAnalysis && !props.hasNomeSocial) return true;
    if (props.hasNomeSocial || props.isAdmin) return true;
    if (props.isExpired) return true;
    return false;
  }, [offerDismissed, props]);

  const resultadoHref = `/app/resultado/${activeSlide.id}`;
  const isCurrentFavorite = !activeSlide.isFree && favoriteId === activeSlide.id;
  const gainPts = activeSlide.score - activeSlide.birthScore;

  const radius = 104;
  const strokeWidth = 12;
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
        <div className="flex items-center gap-3 lg:gap-4">
          {hasMultipleSlides && (
            <button
              type="button"
              onClick={goPrevSlide}
              aria-label="Análise anterior"
              className="hidden sm:inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1C1C1C] text-[#e5e2e1] shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-white/10 transition hover:bg-[#D4AF37] hover:text-[#131313] hover:ring-[#D4AF37] active:scale-95"
            >
              <ChevronIcon direction="left" />
            </button>
          )}

          <div className="nm-floating-card mx-auto w-full min-w-0 flex-1 overflow-hidden rounded-2xl p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div
              key={activeSlide.id}
              className={`flex flex-col items-center gap-7 text-center transition-all duration-300 ease-out lg:grid lg:grid-cols-[268px_minmax(0,1fr)] lg:items-center lg:gap-10 lg:text-left ${slideMotionClass}`}
            >
              {/* Lado Esquerdo (Desktop) / Topo (Mobile): Apenas o círculo grande do score */}
              <div className="flex shrink-0 items-center justify-center p-1 lg:h-full lg:p-2">
                <a
                  href={resultadoHref}
                  className="group relative flex h-52 w-52 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff] sm:h-56 sm:w-56 lg:h-60 lg:w-60"
                  aria-label={`Score ${targetScore} para ${activeSlide.nome}. Clique para ver o painel de análise.`}
                >
                  <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 240 240">
                    <circle
                      cx="120"
                      cy="120"
                      r={radius}
                      className="stroke-white/[0.06]"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    <circle
                      cx="120"
                      cy="120"
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
                      className="font-cinzel text-[52px] font-bold leading-none tracking-tight tabular-nums sm:text-[58px]"
                      style={{ color: activeVisual.text }}
                    >
                      {displayedScore}
                    </span>
                    <span className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[#A0A0A0]">
                      Pontos
                    </span>
                    <span
                      className={`mt-2.5 inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${activeVisual.badgeClass}`}
                    >
                      {activeVisual.label}
                    </span>
                  </div>
                </a>
              </div>

              {/* Lado Direito (Desktop) / Base (Mobile): Nome, Tags, 5 Pontas da Estrela, 2 Botões */}
              <div className="flex w-full min-w-0 flex-1 flex-col items-center lg:items-start">
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

                {/* Tags de características de harmonização */}
                <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      activeSlide.bloqueiosCount === 0
                        ? 'bg-emerald-500/12 text-emerald-300'
                        : 'bg-[#FF6B6B]/15 text-[#FF6B6B]'
                    }`}
                  >
                    {activeSlide.bloqueiosCount === 0
                      ? '0 Bloqueios'
                      : `${activeSlide.bloqueiosCount} ${activeSlide.bloqueiosCount === 1 ? 'Bloqueio ativo' : 'Bloqueios ativos'}`}
                  </span>

                  <span className="inline-flex items-center rounded-full bg-[#bea5ff]/12 px-3 py-1 text-xs font-medium text-[#d7c6ff]">
                    {activeSlide.compatibilidadeLabel}
                  </span>

                  {!activeSlide.isFree && gainPts > 0 && (
                    <span className="inline-flex items-center rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-semibold text-emerald-300">
                      +{gainPts} pts sobre o nome de nascimento
                    </span>
                  )}

                  {activeSlide.isFree &&
                    activeSlide.bloqueiosTitulos.slice(0, 2).map((titulo) => (
                      <span
                        key={titulo}
                        className="inline-flex items-center rounded-full bg-[#FF6B6B]/10 px-3 py-1 text-xs font-medium text-[#FF6B6B]"
                      >
                        {titulo}
                      </span>
                    ))}
                </div>

                {/* As 5 pontas da estrela e seus números */}
                <div className="mt-5 w-full">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A0A0A0]">
                    As 5 pontas da estrela
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 sm:grid sm:grid-cols-5 sm:gap-2.5">
                    {STAR_POINT_ITEMS.map((item) => (
                      <div
                        key={item.key}
                        className="flex min-w-[84px] flex-1 basis-[28%] flex-col items-center justify-center rounded-xl bg-[#131313]/85 px-2.5 py-2.5 sm:basis-auto sm:min-w-0"
                      >
                        <span
                          className="font-cinzel text-lg font-bold leading-none tabular-nums sm:text-xl"
                          style={{ color: activeVisual.text }}
                        >
                          {activeSlide.starNumbers[item.key] || '—'}
                        </span>
                        <span className="mt-1 text-[10px] font-medium tracking-wide text-[#A0A0A0]">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apenas dois botões: Baixar PDF e Ver Painel de Análise */}
                <div className="mt-6 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:w-auto">
                  <PDFFeedbackButton
                    analysisId={activeSlide.id}
                    productType={activeSlide.productType}
                    isFree={activeSlide.isFree}
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
            </div>
          </div>

          {hasMultipleSlides && (
            <button
              type="button"
              onClick={goNextSlide}
              aria-label="Próxima análise"
              className="hidden sm:inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1C1C1C] text-[#e5e2e1] shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-white/10 transition hover:bg-[#D4AF37] hover:text-[#131313] hover:ring-[#D4AF37] active:scale-95"
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
              aria-label="Análise anterior"
              className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1C1C1C] text-[#e5e2e1] ring-1 ring-white/10 transition hover:bg-[#D4AF37] hover:text-[#131313] active:scale-95"
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
              aria-label="Próxima análise"
              className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1C1C1C] text-[#e5e2e1] ring-1 ring-white/10 transition hover:bg-[#D4AF37] hover:text-[#131313] active:scale-95"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        )}
      </section>

      {/* Checklist + Teia + Leitura Recomendada */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-[#1C1C1C] p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-cinzel text-lg font-bold text-[#e5e2e1]">Seus próximos passos</h2>
              <p className="text-xs font-medium text-[#A0A0A0]">
                {doneCount} de 4 feitos
              </p>
            </div>
            <ul className="space-y-3">
              {CHECKLIST_ITEMS.map((item) => {
                const checked = checklist[item.key];
                return (
                  <li key={item.key}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#131313]/80 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChecklist(item.key)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D4AF37]/40 bg-transparent accent-[#D4AF37]"
                      />
                      <span
                        className={`text-sm leading-snug ${checked ? 'text-emerald-400/90 line-through decoration-emerald-400/40' : 'text-[#e5e2e1]'}`}
                      >
                        {item.label}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5">
              {cta.checkout && !props.hasNomeSocial ? (
                <DashboardCheckoutButton
                  product="nome_social"
                  priceInfo={props.socialPrice}
                  promotion={props.promotion}
                  label={cta.label}
                  className={`${CTA_CLASS} w-full sm:w-auto`}
                />
              ) : (
                <a href={cta.href} className={`${CTA_CLASS} w-full sm:w-auto`}>
                  {cta.label}
                </a>
              )}
            </div>
          </section>

          {props.recommendedReading && (
            <section className="nm-floating-card rounded-2xl p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7c6ff]">
                {props.recommendedReading.badge}
              </p>
              <h3 className="mt-1.5 font-cinzel text-lg font-bold text-[#e5e2e1]">
                {props.recommendedReading.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A0A0A0]">
                {props.recommendedReading.subtitle}
              </p>
              <div className="mt-4">
                <a
                  href={props.recommendedReading.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#f2ca50] transition hover:text-[#D4AF37]"
                >
                  {props.recommendedReading.ctaLabel}
                </a>
              </div>
            </section>
          )}
        </div>

        <section className="rounded-2xl bg-[#1C1C1C] p-5 sm:p-6">
          <h2 className="mb-1 font-cinzel text-lg font-bold text-[#e5e2e1]">
            Como o seu nome se sai em 5 áreas
          </h2>
          <p className="mb-3 text-xs text-[#A0A0A0]">
            {props.harmonizedRadarAxes
              ? 'Comparação entre o nome de nascimento e sua assinatura harmonizada. Toque para detalhar.'
              : 'Toque na teia para abrir o painel de análise completo.'}
          </p>
          <a href={resultadoHref} className="block rounded-xl bg-[#131313]/60 p-2 transition hover:bg-[#131313]">
            <ReadingRadar
              axes={props.radarAxes}
              overlayAxes={props.harmonizedRadarAxes ?? undefined}
              birthScore={birthScoreValue}
              overlayScore={props.harmonizedRadarAxes ? harmonizedScoreValue : undefined}
              labels={props.radarLabels}
              className="pointer-events-none max-w-[320px] mx-auto [&_svg]:max-w-[320px]"
            />
          </a>
        </section>
      </div>

      {/* Histórico */}
      {props.history.length > 0 && (
        <section className="rounded-2xl bg-[#1C1C1C] p-5 sm:p-6">
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
              return (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex items-center gap-2.5">
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
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                          rowFav
                            ? 'bg-[#D4AF37]/20 text-[#f2ca50]'
                            : 'text-[#A0A0A0] hover:bg-white/[0.06] hover:text-[#f2ca50]'
                        }`}
                      >
                        <StarIcon filled={rowFav} className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#e5e2e1]">{row.nome}</p>
                      <p className="text-xs text-[#A0A0A0]">{row.dateLabel}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {row.score != null && (
                      <span className="font-cinzel text-lg font-bold tabular-nums text-[#e5e2e1]">
                        {row.score}
                      </span>
                    )}
                    <PDFFeedbackButton
                      analysisId={row.id}
                      productType={row.productType ?? 'nome_social'}
                      isFree={Boolean(row.isFree)}
                      label="PDF"
                      showLabel
                      showFab={false}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-[#e5e2e1] ring-1 ring-white/10 transition hover:bg-white/[0.1] hover:text-[#f2ca50]"
                    />
                    <a
                      href={`/app/resultado/${row.id}`}
                      className="text-xs font-bold uppercase tracking-wide text-[#D4AF37] hover:text-[#f2ca50]"
                    >
                      Ver painel
                    </a>
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
