import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReadingRadar } from '../chat/ReadingRadar.js';
import type { RadarAxesData } from '../chat/chat-types.js';
import { DashboardCheckoutButton } from '../DashboardCheckoutButton';
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
  'inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-[#111111] transition hover:bg-[#f2ca50] active:scale-[0.98]';

export interface DashboardHistoryItem {
  id: string;
  nome: string;
  dateLabel: string;
  score: number | null;
}

export interface AppDashboardProps {
  userId: string;
  nomeHoje: string;
  nomeHarmonizado: string | null;
  score: number;
  scoreLabel: string;
  scoreColor: string;
  bloqueios: string[];
  analysisId: string;
  radarAxes: RadarAxesData;
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

function useLocalChecklist(userId: string) {
  const [state, setState] = useState<ChecklistState>(EMPTY_CHECKLIST);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const key = checklistStorageKey(userId);
    setState(parseChecklistState(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null));
    setReady(true);
  }, [userId]);

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
    [persist, state],
  );

  return { state, toggle, ready };
}

function useOfferDismissed(userId: string) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(offerDismissStorageKey(userId)) === '1');
    } catch {
      setDismissed(false);
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
): { href: string; label: string; checkout?: boolean } {
  const resultado = `/app/resultado/${props.analysisId}`;
  if (!state.assinatura) {
    if (props.hasNomeSocial) {
      return { href: '/app/analise/nome-social', label: 'Escolher assinatura' };
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
  const { state: checklist, toggle: toggleChecklist }: ReturnType<typeof useLocalChecklist> =
    useLocalChecklist(props.userId);
  const { dismissed: offerDismissed, dismiss: dismissOffer }: ReturnType<typeof useOfferDismissed> =
    useOfferDismissed(props.userId);
  const [showAllBloqueios, setShowAllBloqueios] = useState(false);

  const doneCount = countChecklistDone(checklist);
  const cta = useMemo(() => nextChecklistCta(checklist, props), [checklist, props]);

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

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Hero */}
      <section className="rounded-2xl bg-[#1C1C1C] p-5 sm:p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
                  Seu nome hoje
                </p>
                <p className="font-cinzel text-xl font-bold leading-tight text-[#e5e2e1] sm:text-2xl">
                  {props.nomeHoje}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
                  Sua assinatura sugerida
                </p>
                <p className="font-cinzel text-xl font-bold leading-tight text-[#D4AF37] sm:text-2xl">
                  {props.nomeHarmonizado ?? 'Defina na harmonização'}
                </p>
              </div>
            </div>

            {(visibleBloqueios.length > 0 || hasMoreBloqueios) && (
              <div className="flex flex-wrap items-center gap-2">
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
            )}
          </div>

          <a
            href={resultadoHref}
            className="flex shrink-0 flex-col items-center text-center lg:min-w-[8rem]"
          >
            <span
              className="font-cinzel text-6xl font-bold leading-none sm:text-7xl"
              style={{ color: props.scoreColor }}
            >
              {props.score}
            </span>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A0A0A0]">
              Score
            </span>
            <span className="mt-1 text-xs text-[#A0A0A0]">{props.scoreLabel}</span>
          </a>
        </div>
      </section>

      {/* Checklist + Teia */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
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

        <section className="rounded-2xl bg-[#1C1C1C] p-5 sm:p-6">
          <h2 className="mb-1 font-cinzel text-lg font-bold text-[#e5e2e1]">
            Como o seu nome se sai em 5 áreas
          </h2>
          <p className="mb-3 text-xs text-[#A0A0A0]">Toque na teia para abrir a análise completa.</p>
          <a href={resultadoHref} className="block rounded-xl bg-[#131313]/60 p-2 transition hover:bg-[#131313]">
            <ReadingRadar
              axes={props.radarAxes}
              birthScore={props.score}
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
                <div className="flex items-center gap-3">
                  {row.score != null && (
                    <span className="font-cinzel text-lg font-bold tabular-nums text-[#e5e2e1]">
                      {row.score}
                    </span>
                  )}
                  <a
                    href={`/app/resultado/${row.id}`}
                    className="text-xs font-bold uppercase tracking-wide text-[#D4AF37] hover:text-[#f2ca50]"
                  >
                    Reabrir PDF
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
                <button
                  type="button"
                  onClick={dismissOffer}
                  className="mt-4 text-sm text-[#A0A0A0] hover:text-[#e5e2e1]"
                >
                  Agora não
                </button>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default AppDashboard;
