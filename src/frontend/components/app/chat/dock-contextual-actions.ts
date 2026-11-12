import type { ChatPdfCtaModel } from './ChatPdfCta.js';
import type {
  DockIconKind,
  DockPrimaryActionId,
  DockSecondaryActionId,
  MobileDockLayout,
} from './mobile-dock-screen.js';

export interface DockContextualAction {
  key: string;
  kind: 'secondary' | 'primary' | 'pdf' | 'reading';
  label: string;
  icon?: DockIconKind;
  secondaryId?: DockSecondaryActionId;
  primaryId?: DockPrimaryActionId;
  disabled?: boolean;
  badge?: boolean;
  primaryGold?: boolean;
}

export interface DockReadingActionInput {
  visible: boolean;
  badge: boolean;
}

export function collectDockContextualActions(
  layout: MobileDockLayout,
  options: {
    pdfModel?: ChatPdfCtaModel | null;
    pdfExiting?: boolean;
    reading?: DockReadingActionInput;
  }
): DockContextualAction[] {
  const items: DockContextualAction[] = [];

  if (options.reading?.visible) {
    items.push({
      key: 'reading',
      kind: 'reading',
      label: 'Abrir leitura',
      icon: 'scroll-text',
      secondaryId: 'reading',
      badge: options.reading.badge,
    });
  }

  const secondaries =
    layout.screen === 'resultado' ? layout.secondaries : layout.middleSecondaries;

  secondaries.forEach((action, index) => {
    items.push({
      key: `sec-${action.id}-${index}`,
      kind: 'secondary',
      label: action.label,
      icon: action.icon,
      secondaryId: action.id,
    });
  });

  if (layout.screen !== 'resultado' && options.pdfModel && (options.pdfModel.visible || options.pdfExiting)) {
    items.push({
      key: 'pdf',
      kind: 'pdf',
      label: options.pdfModel.isFree ? 'Desbloquear análise' : 'Baixar PDF',
    });
  }

  const primary = layout.primary;
  if (primary) {
    items.push({
      key: `primary-${primary.id}`,
      kind: 'primary',
      label: primary.label,
      icon: primary.icon,
      primaryId: primary.id,
      disabled: primary.disabled,
      primaryGold: true,
    });
  }

  return items;
}

/** 320px: 1 ação visível; demais no menu. ≥390px: até 2 visíveis. */
export function maxVisibleContextualActions(viewportWidth: number): number {
  if (viewportWidth <= 320) return 1;
  return 2;
}

export function splitDockContextualActions(
  actions: DockContextualAction[],
  viewportWidth: number
): { visible: DockContextualAction[]; overflow: DockContextualAction[] } {
  if (actions.length === 0) return { visible: [], overflow: [] };
  const max = maxVisibleContextualActions(viewportWidth);
  if (actions.length <= max) return { visible: actions, overflow: [] };
  return { visible: actions.slice(0, max), overflow: actions.slice(max) };
}
