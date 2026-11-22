export interface TimelineStep<TAction = string> {
  at: number;
  action: TAction;
}

export interface TimelineSnapshot<TAction = string> {
  stepIndex: number;
  currentAction: TAction | null;
  triggeredActions: TAction[];
}

/**
 * Ordena os passos por `at` sem mutar o array original e garante tempos não-negativos.
 */
export function normalizeTimelineSteps<TAction>(
  steps: ReadonlyArray<TimelineStep<TAction>>,
): TimelineStep<TAction>[] {
  return [...steps]
    .map((step) => ({
      at: Number.isFinite(step.at) ? Math.max(0, Math.round(step.at)) : 0,
      action: step.action,
    }))
    .sort((a, b) => a.at - b.at);
}

/**
 * Duração total de um ciclo: duração ativa + pausa no final (padrão 1,8 s).
 */
export function getTimelineCycleDurationMs<TAction>(
  steps: ReadonlyArray<TimelineStep<TAction>>,
  durationMs?: number,
  loopPauseMs = 1800,
): number {
  const normalized = normalizeTimelineSteps(steps);
  const lastStepAt = normalized.length > 0 ? normalized[normalized.length - 1]!.at : 0;
  const activeDuration = Math.max(
    Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs!)) : 0,
    lastStepAt,
  );
  const safePause = Number.isFinite(loopPauseMs) ? Math.max(0, Math.round(loopPauseMs)) : 0;
  return activeDuration + safePause;
}

/**
 * Resolve quais passos já dispararam para um `elapsedMs` dentro do ciclo atual.
 */
export function resolveTimelineAt<TAction>(
  steps: ReadonlyArray<TimelineStep<TAction>>,
  elapsedMs: number,
): TimelineSnapshot<TAction> {
  const normalized = normalizeTimelineSteps(steps);
  if (normalized.length === 0) {
    return { stepIndex: -1, currentAction: null, triggeredActions: [] };
  }

  const safeElapsed = Math.max(0, elapsedMs);
  const triggeredActions: TAction[] = [];
  let stepIndex = -1;

  for (let i = 0; i < normalized.length; i++) {
    const step = normalized[i]!;
    if (step.at <= safeElapsed) {
      stepIndex = i;
      triggeredActions.push(step.action);
    } else {
      break;
    }
  }

  return {
    stepIndex,
    currentAction: stepIndex >= 0 ? normalized[stepIndex]!.action : null,
    triggeredActions,
  };
}

/**
 * Estado final parado para `prefers-reduced-motion: reduce`.
 */
export function resolveReducedMotionState<TAction>(
  steps: ReadonlyArray<TimelineStep<TAction>>,
): TimelineSnapshot<TAction> {
  const normalized = normalizeTimelineSteps(steps);
  if (normalized.length === 0) {
    return { stepIndex: -1, currentAction: null, triggeredActions: [] };
  }

  return {
    stepIndex: normalized.length - 1,
    currentAction: normalized[normalized.length - 1]!.action,
    triggeredActions: normalized.map((s) => s.action),
  };
}

/**
 * Calcula o tempo exato até o próximo passo ou até o reinício do loop.
 * Retorna `null` quando a animação única já terminou (`loop = false`).
 */
export function getNextDelayMs<TAction>(
  steps: ReadonlyArray<TimelineStep<TAction>>,
  elapsedMs: number,
  totalCycleMs: number,
  loop: boolean,
): number | null {
  const normalized = normalizeTimelineSteps(steps);
  const safeElapsed = Math.max(0, elapsedMs);

  for (const step of normalized) {
    if (step.at > safeElapsed) {
      return Math.max(16, step.at - safeElapsed);
    }
  }

  if (!loop) return null;
  if (totalCycleMs <= 0) return 1800;

  if (safeElapsed < totalCycleMs) {
    return Math.max(16, totalCycleMs - safeElapsed);
  }

  return 0;
}
