const SAO_PAULO = 'America/Sao_Paulo';

/** Rótulo "até dd/mm" no fuso de São Paulo. */
export function formatPromoValidUntilLabel(endsAtIso: string | null | undefined, now = new Date()): string | null {
  if (!endsAtIso) return null;
  const end = new Date(endsAtIso);
  if (Number.isNaN(end.getTime()) || end.getTime() <= now.getTime()) return null;

  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO,
    day: '2-digit',
    month: '2-digit',
  }).formatToParts(end);

  const day = parts.find((p) => p.type === 'day')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  if (!day || !month) return null;
  return `até ${day}/${month}`;
}
