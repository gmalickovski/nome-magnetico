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

export function isPinnedPdfAction(action: DockContextualAction): boolean {
  return (
    action.kind === 'pdf' ||
    (action.kind === 'primary' &&
      (action.primaryId === 'download_pdf' || action.primaryId === 'generate_pdf'))
  );
}

/** PDF e download no fim da barra; demais antes. */
export function sortDockVisibleActions(actions: DockContextualAction[]): DockContextualAction[] {
  const pinnedEnd = actions.filter((a) => isPinnedPdfAction(a));
  const rest = actions.filter((a) => !isPinnedPdfAction(a));
  return [...rest, ...pinnedEnd];
}

/** CTA principal ancorado à direita (PDF ou Desbloquear) — não rola com as contextuais. */
export function isDockScrollFixedAction(action: DockContextualAction): boolean {
  if (isPinnedPdfAction(action)) return true;
  if (action.kind === 'primary' && action.primaryId === 'unlock_nome_social') return true;
  return false;
}

export function partitionDockContextualActions(actions: DockContextualAction[]): {
  scrollable: DockContextualAction[];
  fixed: DockContextualAction[];
} {
  const ordered = sortDockVisibleActions(actions);
  return {
    scrollable: ordered.filter((a) => !isDockScrollFixedAction(a)),
    fixed: ordered.filter((a) => isDockScrollFixedAction(a)),
  };
}
