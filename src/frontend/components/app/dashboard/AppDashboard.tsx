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

/** CTA dourado do painel: primário da marca (#D4AF37), hover #f2ca50; texto #111111 */
const CTA_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-[#111111] shadow-[0_2px_16px_rgba(212,175,55,0.28)] transition hover:bg-[#f2ca50] hover:shadow-[0_4px_24px_rgba(212,175,55,0.45)] active:scale-[0.98]';

export interface DashboardHistoryItem {
  id: string;
  nome: string;
  dateLabel: string;
  score: number | null;
  productType?: string;
  isFree?: boolean;
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
  hasNomeSocial: boolean;
  isAdmin: boolean;
  isExpired: boolean;
  accessEndLabel: string | null;
  hasPaidAccess: boolean;
  onlyFreeAnalysis: boolean;
  socialPrice: PriceInfo;
  promotion: ActivePromotion | null;
}

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

export function AppDashboard(props: AppDashboardProps) {
  const { state: checklist, toggle: toggleChecklist } = useLocalChecklist(props.userId, {
    assinatura: props.signatureChosen,
    pdf: props.pdfReady,
  });
  const { dismissed: offerDismissed, dismiss: dismissOffer } = useOfferDismissed(props.userId);
  const [showAllBloqueios, setShowAllBloqueios] = useState(false);
  const [hasUnfinishedSession, setHasUnfinishedSession] = useState(false);

  const hasHarmonizedComparison = Boolean(props.nomeHarmonizado);
  const birthScoreValue = Math.max(0, Math.min(100, Math.round(props.birthScore ?? props.score)));
  const harmonizedScoreValue = Math.max(
    0,
    Math.min(100, Math.round(props.scorePotencial ?? props.score)),
  );

  const [activeView, setActiveView] = useState<'birth' | 'harmonized'>(() =>
    hasHarmonizedComparison ? 'harmonized' : 'birth',
  );

  const targetScore =
    activeView === 'harmonized' && hasHarmonizedComparison ? harmonizedScoreValue : birthScoreValue;
  const activeName =
    activeView === 'harmonized' && props.nomeHarmonizado ? props.nomeHarmonizado : props.nomeHoje;
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

  const doneCount = countChecklistDone(checklist);
  const cta = useMemo(
    () => nextChecklistCta(checklist, props, hasUnfinishedSession),
    [checklist, props, hasUnfinishedSession],
  );

  const visibleBloqueios = showAllBloqueios ? props.bloqueios : props.bloqueios.slice(0, 3);
  const hasMoreBloqueios = props.bloqueios.length > 3;

  const showOfferCard = useMemo(() => {
    if (offerDismissed) return false;
    if (props.onlyFreeAnalysis && !props.hasNomeSocial) return true;
    if (props.hasNomeSocial || props.isAdmin) return true;
    if (props.isExpired) return true;
    return false;
  }, [offerDismissed, props]);

  const resultadoHref = `/app/resultado/${props.analysisId}`;

  const radius = 102;
  const strokeWidth = 11;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * displayedScore) / 100;
  const isShowingHarmonized = activeView === 'harmonized' && hasHarmonizedComparison;
  const harmonizedGain = harmonizedScoreValue - birthScoreValue;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Hero estilo Landing Page: horizontal no desktop, empilhado compacto no mobile */}
      <section className="nm-floating-card mx-auto w-full max-w-[420px] rounded-2xl p-6 sm:p-7 lg:max-w-none lg:px-10 lg:py-8 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:text-left">
          {/* Desktop esquerda / Mobile embaixo: Nome grande em Cinzel e dados abaixo */}
          <div className="order-2 flex min-w-0 flex-1 flex-col items-center lg:order-1 lg:items-start">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                isShowingHarmonized
                  ? 'bg-[#D4AF37]/12 text-[#f2ca50]'
                  : 'bg-white/[0.06] text-[#A0A0A0]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isShowingHarmonized ? 'bg-[#f2ca50]' : 'bg-[#A0A0A0]'
                }`}
              />
              {isShowingHarmonized ? 'Assinatura sugerida' : 'Nome de nascimento'}
            </span>

            <h1
              className={`mt-3 font-cinzel text-2xl font-bold leading-tight tracking-wide break-words sm:text-3xl lg:text-4xl xl:text-[42px] ${
                isShowingHarmonized ? 'text-[#f2ca50]' : 'text-[#e5e2e1]'
              }`}
            >
              {activeName || 'Nome não informado'}
            </h1>

            <div className="mt-4 flex flex-col items-center gap-3 lg:items-start">
              <div className="flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${activeVisual.badgeClass}`}
                >
                  <span className="tabular-nums font-bold">{targetScore}/100 pts</span>
                  <span aria-hidden="true">•</span>
                  <span>{activeVisual.label}</span>
                </span>

                {isShowingHarmonized && harmonizedGain > 0 && (
                  <span className="inline-flex items-center rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-semibold text-emerald-300">
                    +{harmonizedGain} pts sobre o nome atual ({birthScoreValue} pts)
                  </span>
                )}

                {!isShowingHarmonized && props.scorePotencial != null && (
                  <span className="inline-flex items-center rounded-full bg-[#bea5ff]/12 px-3 py-1 text-xs font-medium text-[#d7c6ff]">
                    Potencial até {props.scorePotencial} pts
                  </span>
                )}
              </div>

              {isShowingHarmonized ? (
                <p className="text-xs font-medium text-[#A0A0A0] sm:text-sm">
                  Sem bloqueios ativos nos 4 triângulos • Alinhada ao seu Destino
                </p>
              ) : visibleBloqueios.length > 0 || hasMoreBloqueios ? (
                <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  {visibleBloqueios.map((titulo) => (
                    <span
                      key={titulo}
                      className="rounded-full bg-[#FF6B6B]/15 px-3 py-1 text-xs font-medium text-[#FF6B6B]"
                    >
                      {titulo}
                    </span>
                  ))}
                  {hasMoreBloqueios && !showAllBloqueios && (
                    <button
                      type="button"
                      onClick={() => setShowAllBloqueios(true)}
                      className="text-xs font-semibold text-[#e5e2e1] underline underline-offset-2 hover:text-[#D4AF37]"
                    >
                      ver todos
                    </button>
                  )}
                  {hasMoreBloqueios && showAllBloqueios && (
                    <a
                      href={`${resultadoHref}#bloqueios`}
                      className="text-xs font-semibold text-[#D4AF37] underline underline-offset-2"
                    >
                      Ver no relatório
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs font-medium text-[#A0A0A0] sm:text-sm">
                  Sem sequências de bloqueio nos 4 triângulos
                </p>
              )}
            </div>
          </div>

          {/* Desktop direita / Mobile topo: Botão de alternância + Visor Circular SVG do Score */}
          <div className="order-1 flex shrink-0 flex-col items-center justify-center lg:order-2">
            {hasHarmonizedComparison && (
              <div
                className="mb-4 inline-flex items-center rounded-full bg-[#131313] p-1 ring-1 ring-white/10"
                role="tablist"
                aria-label="Alternar nome exibido no score"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'birth'}
                  onClick={() => setActiveView('birth')}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeView === 'birth'
                      ? 'bg-[#D4AF37] text-[#131313]'
                      : 'text-[#A0A0A0] hover:text-[#e5e2e1]'
                  }`}
                >
                  Nome atual
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'harmonized'}
                  onClick={() => setActiveView('harmonized')}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeView === 'harmonized'
                      ? 'bg-[#D4AF37] text-[#131313]'
                      : 'text-[#A0A0A0] hover:text-[#e5e2e1]'
                  }`}
                >
                  Harmonizado
                </button>
              </div>
            )}

            <a
              href={resultadoHref}
              className="group relative flex h-48 w-48 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff] sm:h-52 sm:w-52"
              aria-label={`Score ${targetScore} para ${activeName}. Clique para abrir o relatório completo.`}
            >
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 224 224">
                <circle
                  cx="112"
                  cy="112"
                  r={radius}
                  className="stroke-white/[0.06]"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="112"
                  cy="112"
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

              <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
                <span
                  className="font-cinzel text-[48px] font-bold leading-none tracking-tight tabular-nums sm:text-[52px]"
                  style={{ color: activeVisual.text }}
                >
                  {displayedScore}
                </span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#A0A0A0]">
                  Pontos
                </span>
                <span
                  className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${activeVisual.badgeClass}`}
                >
                  {activeVisual.label}
                </span>
              </div>
            </a>
          </div>
        </div>
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
              : 'Toque na teia para abrir a análise completa.'}
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
            {props.history.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#e5e2e1]">{row.nome}</p>
                  <p className="text-xs text-[#A0A0A0]">{row.dateLabel}</p>
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
                    Ver relatório
                  </a>
                </div>
              </li>
            ))}
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
