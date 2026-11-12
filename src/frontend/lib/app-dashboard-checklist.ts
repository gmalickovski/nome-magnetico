export type ChecklistKey = 'assinatura' | 'tracado' | 'redes' | 'pdf';

export const CHECKLIST_ITEMS: ReadonlyArray<{
  key: ChecklistKey;
  label: string;
}> = [
  { key: 'assinatura', label: 'Escolha a sua assinatura' },
  { key: 'tracado', label: 'Treine o traçado' },
  { key: 'redes', label: 'Use o nome nas redes' },
  { key: 'pdf', label: 'Baixe o seu PDF' },
];

export type ChecklistState = Record<ChecklistKey, boolean>;

export const EMPTY_CHECKLIST: ChecklistState = {
  assinatura: false,
  tracado: false,
  redes: false,
  pdf: false,
};

export function checklistStorageKey(userId: string) {
  return `nm-dashboard-checklist:${userId}`;
}

export function offerDismissStorageKey(userId: string) {
  return `nm-dashboard-offer-dismissed:${userId}`;
}

export function parseChecklistState(raw: string | null): ChecklistState {
  if (!raw) return { ...EMPTY_CHECKLIST };
  try {
    const parsed = JSON.parse(raw) as Partial<ChecklistState>;
    return {
      assinatura: Boolean(parsed.assinatura),
      tracado: Boolean(parsed.tracado),
      redes: Boolean(parsed.redes),
      pdf: Boolean(parsed.pdf),
    };
  } catch {
    return { ...EMPTY_CHECKLIST };
  }
}

export function countChecklistDone(state: ChecklistState): number {
  return CHECKLIST_ITEMS.filter((item) => state[item.key]).length;
}
