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

/** 320px: 1 ação visível no bloco contextual; demais no menu. ≥390px: até 2. */
export function maxVisibleContextualActions(viewportWidth: number): number {
  if (viewportWidth <= 320) return 1;
  return 2;
}

/** Menor = vai para o menu de overflow antes. */
export function dockOverflowEvictionRank(action: DockContextualAction): number {
  if (action.secondaryId === 'share') return 0;
  if (action.secondaryId === 'redo_analysis') return 1;
  if (action.secondaryId === 'restart') return 2;
  if (action.secondaryId === 'free_pdf') return 3;
  if (action.secondaryId === 'reading') return 4;
  if (action.kind === 'reading') return 4;
  if (action.secondaryId === 'other_options') return 900;
  if (action.kind === 'pdf') return 950;
  if (action.kind === 'primary') {
    if (action.primaryId === 'download_pdf' || action.primaryId === 'generate_pdf') return 960;
    return 850;
  }
  return 50;
}

export function dockActionNeverOverflows(action: DockContextualAction): boolean {
  if (action.secondaryId === 'other_options') return true;
  if (action.kind === 'primary' && action.primaryId === 'unlock_nome_social') return true;
  if (action.kind === 'primary' && action.primaryId === 'generate_pdf') return true;
  return false;
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

export function splitDockContextualActions(
  actions: DockContextualAction[],
  viewportWidth: number
): { visible: DockContextualAction[]; overflow: DockContextualAction[] } {
  if (actions.length === 0) return { visible: [], overflow: [] };
  const max = maxVisibleContextualActions(viewportWidth);
  if (actions.length <= max) {
    return { visible: sortDockVisibleActions(actions), overflow: [] };
  }

  const overflow: DockContextualAction[] = [];
  let pool = [...actions];

  while (pool.length > max) {
    const evictable = pool
      .filter((a) => !dockActionNeverOverflows(a))
      .sort((a, b) => dockOverflowEvictionRank(a) - dockOverflowEvictionRank(b));

    if (evictable.length > 0) {
      const victim = evictable[0];
      pool = pool.filter((a) => a.key !== victim.key);
      overflow.push(victim);
      continue;
    }

    const pinnedEvictable = pool
      .filter((a) => isPinnedPdfAction(a) || a.kind === 'reading')
      .sort((a, b) => dockOverflowEvictionRank(a) - dockOverflowEvictionRank(b));
    if (pinnedEvictable.length > 0 && !isPinnedPdfAction(pinnedEvictable[0])) {
      const victim = pinnedEvictable[0];
      pool = pool.filter((a) => a.key !== victim.key);
      overflow.push(victim);
      continue;
    }

  // 320px: prioridade absoluta do PDF — remove leitura antes do PDF
    if (viewportWidth <= 320) {
      const nonPdf = pool.filter((a) => !isPinnedPdfAction(a));
      if (nonPdf.length > 0) {
        const victim = [...nonPdf].sort(
          (a, b) => dockOverflowEvictionRank(a) - dockOverflowEvictionRank(b)
        )[0];
        pool = pool.filter((a) => a.key !== victim.key);
        overflow.push(victim);
        continue;
      }
    }

    break;
  }

  overflow.sort((a, b) => dockOverflowEvictionRank(a) - dockOverflowEvictionRank(b));

  return { visible: sortDockVisibleActions(pool), overflow };
}
