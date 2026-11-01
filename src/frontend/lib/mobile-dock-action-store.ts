import { useSyncExternalStore } from 'react';
import type { MobileDockLayout } from '../components/app/chat/mobile-dock-screen.js';
import type {
  DockPrimaryActionId,
  DockSecondaryActionId,
} from '../components/app/chat/mobile-dock-screen.js';
import type { ChatPdfCtaModel } from '../components/app/chat/ChatPdfCta.js';

export interface MobileDockActionState {
  layout: MobileDockLayout | null;
  summaryPanelOpen: boolean;
  restartExitActive: boolean;
  summaryBadge: boolean;
  pdfModel: ChatPdfCtaModel | null;
  pdfExiting: boolean;
}

export interface MobileDockActionHandlers {
  onBack: () => void;
  onSecondary: (action: DockSecondaryActionId, position: number) => void;
  onPrimary: (action: DockPrimaryActionId) => void;
  onPdfClick?: () => void;
}

export interface MobileDockActionSnapshot {
  state: MobileDockActionState;
  handlers: MobileDockActionHandlers;
}

let snapshot: MobileDockActionSnapshot | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function publishMobileDockAction(next: MobileDockActionSnapshot): void {
  snapshot = next;
  emit();
}

export function clearMobileDockAction(): void {
  if (!snapshot) return;
  snapshot = null;
  emit();
}

export function getMobileDockActionSnapshot(): MobileDockActionSnapshot | null {
  return snapshot;
}

export function subscribeMobileDockAction(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function useMobileDockActionSnapshot(): MobileDockActionSnapshot | null {
  return useSyncExternalStore(subscribeMobileDockAction, getMobileDockActionSnapshot, () => null);
}
