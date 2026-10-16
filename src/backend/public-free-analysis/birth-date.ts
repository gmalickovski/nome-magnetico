const ISO_BIRTH_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type ParsedBirthDate = { ok: true; isoDate: string } | { ok: false };

/**
 * Valida data de nascimento no formato YYYY-MM-DD (data real, não futura, ano >= 1900).
 */
export function parseIsoBirthDate(value: unknown, now = new Date()): ParsedBirthDate {
  if (typeof value !== 'string') return { ok: false };
  const trimmed = value.trim();
  if (!trimmed || !ISO_BIRTH_DATE.test(trimmed)) return { ok: false };

  const [yStr, mStr, dStr] = trimmed.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return { ok: false };
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return { ok: false };

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false };
  }

  const minYear = 1900;
  const maxDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (year < minYear || date.getTime() > maxDate.getTime()) return { ok: false };

  return { ok: true, isoDate: trimmed };
}

export function isoBirthDateToPtBr(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}
