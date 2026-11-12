import { useSyncExternalStore, type ReactNode } from 'react';

/** Estado do header desktop publicado por ilhas da página (ex.: chat). DEV-282 */
export interface DesktopHeaderProgress {
  currentStep: number;
  totalSteps: number;
}

export interface DesktopHeaderSnapshot {
  progress: DesktopHeaderProgress | null;
  actions: ReactNode | null;
}

const EMPTY: DesktopHeaderSnapshot = { progress: null, actions: null };

let snapshot: DesktopHeaderSnapshot = EMPTY;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function publishDesktopHeader(next: DesktopHeaderSnapshot): void {
  snapshot = next;
  emit();
}

export function clearDesktopHeader(): void {
  if (snapshot === EMPTY) return;
  snapshot = EMPTY;
  emit();
}

export function getDesktopHeaderSnapshot(): DesktopHeaderSnapshot {
  return snapshot;
}

export function subscribeDesktopHeader(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDesktopHeaderSnapshot(): DesktopHeaderSnapshot {
  return useSyncExternalStore(subscribeDesktopHeader, getDesktopHeaderSnapshot, () => EMPTY);
}
