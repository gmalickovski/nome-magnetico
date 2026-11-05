import {
  isoBirthDateToPtBr,
  parseIsoBirthDate,
} from '../../../../backend/public-free-analysis/birth-date';

const PT_BIRTH_DATE = /^\d{2}\/\d{2}\/\d{4}$/;

/**
 * Normaliza data de nascimento para DD/MM/AAAA antes de funções cabalísticas (triângulos, destino, score).
 * Aceita YYYY-MM-DD (coluna DATE / ranking.dataNascimento) sem alterar a matemática em triangle.ts.
 */
export function normalizeBirthDateForNumerology(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (PT_BIRTH_DATE.test(trimmed)) return trimmed;

  const parsed = parseIsoBirthDate(trimmed);
  if (parsed.ok) return isoBirthDateToPtBr(parsed.isoDate);

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isoBirthDateToPtBr(trimmed);
  }

  return trimmed;
}
