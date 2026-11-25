import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  getNextDelayMs,
  getTimelineCycleDurationMs,
  normalizeTimelineSteps,
  resolveReducedMotionState,
  resolveTimelineAt,
  type TimelineStep,
} from './mockup-timeline-core.js';

export type { TimelineStep, TimelineSnapshot } from './mockup-timeline-core.js';

export interface UseMockupTimelineOptions<TAction = string> {
  steps: ReadonlyArray<TimelineStep<TAction>>;
  /** Duração ativa mínima antes da pausa do loop (ms). */
  durationMs?: number;
  /** Pausa ao final de cada ciclo antes de reiniciar (padrão 1800 ms, entre 1,5 e 2 s). */
  loopPauseMs?: number;
  loop?: boolean;
  threshold?: number;
  /** Permite simular `prefers-reduced-motion` em ferramentas de vitrine/QA. */
  forceReducedMotion?: boolean;
}

export interface UseMockupTimelineResult<TAction = string, TEl extends HTMLElement = HTMLDivElement> {
  containerRef: RefObject<TEl>;
  stepIndex: number;
  currentAction: TAction | null;
  triggeredActions: TAction[];
  cycle: number;
  isPlaying: boolean;
  isInView: boolean;
  reducedMotion: boolean;
}

function readTabVisible(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState !== 'hidden';
}

/**
 * Motor de timeline determinístico para mockups da landing:
 * - inicia apenas quando o container entra na viewport (`IntersectionObserver`)
 * - pausa fora da viewport e quando a aba fica oculta (`visibilitychange`)
 * - respeita `prefers-reduced-motion: reduce` exibindo imediatamente o estado final parado
 * - usa apenas `setTimeout` pontual até o próximo passo (sem `setInterval` e sem rede)
 */
export function useMockupTimeline<TAction = string, TEl extends HTMLElement = HTMLDivElement>({
  steps,
  durationMs,
  loopPauseMs = 1800,
  loop = true,
  threshold = 0.15,
  forceReducedMotion = false,
}: UseMockupTimelineOptions<TAction>): UseMockupTimelineResult<TAction, TEl> {
  const containerRef = useRef<TEl>(null);
  const normalizedSteps = useMemo(() => normalizeTimelineSteps(steps), [steps]);
  const totalCycleMs = useMemo(
    () => getTimelineCycleDurationMs(normalizedSteps, durationMs, loopPauseMs),
    [normalizedSteps, durationMs, loopPauseMs],
  );

  // Inicializa de forma determinística no SSR e sincroniza em useEffect para evitar mismatch (#418/#425).
  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(false);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [cycle, setCycle] = useState<number>(0);

  const elapsedRef = useRef<number>(0);
  const activeSinceRef = useRef<number | null>(null);

  const effectiveReducedMotion = forceReducedMotion || systemReducedMotion;
  const isPlaying = !effectiveReducedMotion && isInView && isTabVisible && normalizedSteps.length > 0;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemReducedMotion(mq.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setSystemReducedMotion(event.matches);
    };

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setIsTabVisible(readTabVisible());

    const handleVisibility = () => {
      setIsTabVisible(readTabVisible());
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsInView(entry.isIntersecting);
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  // Se o roteiro mudar do zero, reinicia o progresso acumulado.
  useEffect(() => {
    elapsedRef.current = 0;
    activeSinceRef.current = null;
    setElapsedMs(0);
    setCycle(0);
  }, [normalizedSteps, totalCycleMs]);

  useEffect(() => {
    if (!isPlaying) {
      if (activeSinceRef.current !== null && typeof performance !== 'undefined') {
        const delta = Math.max(0, performance.now() - activeSinceRef.current);
        const nextElapsed = Math.min(totalCycleMs, elapsedRef.current + delta);
        elapsedRef.current = nextElapsed;
        activeSinceRef.current = null;
        setElapsedMs(nextElapsed);
      }
      return;
    }

    if (typeof window === 'undefined' || typeof performance === 'undefined') return;

    const now = performance.now();
    activeSinceRef.current = now;
    const currentElapsed = elapsedRef.current;

    const delay = getNextDelayMs(normalizedSteps, currentElapsed, totalCycleMs, loop);
    if (delay === null) {
      activeSinceRef.current = null;
      return;
    }

    const timerId = window.setTimeout(() => {
      const tickNow = performance.now();
      const startedAt = activeSinceRef.current ?? tickNow;
      const progressed = currentElapsed + Math.max(0, tickNow - startedAt);
      activeSinceRef.current = tickNow;

      if (loop && progressed >= totalCycleMs) {
        elapsedRef.current = 0;
        setElapsedMs(0);
        setCycle((c) => c + 1);
      } else {
        elapsedRef.current = progressed;
        setElapsedMs(progressed);
      }
    }, delay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isPlaying, elapsedMs, cycle, normalizedSteps, totalCycleMs, loop]);

  const snapshot = useMemo(() => {
    if (effectiveReducedMotion) {
      return resolveReducedMotionState(normalizedSteps);
    }
    return resolveTimelineAt(normalizedSteps, elapsedMs);
  }, [effectiveReducedMotion, normalizedSteps, elapsedMs]);

  return {
    containerRef,
    stepIndex: snapshot.stepIndex,
    currentAction: snapshot.currentAction,
    triggeredActions: snapshot.triggeredActions,
    cycle,
    isPlaying,
    isInView,
    reducedMotion: effectiveReducedMotion,
  };
}
