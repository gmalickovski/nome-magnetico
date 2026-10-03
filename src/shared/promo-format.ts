import { PRODUCT_LABELS } from './product-labels';

export type RegistryState = 'active' | 'scheduled' | 'expired' | 'inactive';

export const STATE_LABELS: Record<RegistryState, string> = {
  active: 'Ativo',
  scheduled: 'Agendado',
  expired: 'Expirado',
  inactive: 'Desativado',
};

export const STATE_CLASSES: Record<RegistryState, string> = {
  active: 'bg-emerald-500/10 text-emerald-300',
  scheduled: 'bg-[#d7c6ff]/10 text-[#d7c6ff]',
  expired: 'bg-white/5 text-[#76746a]',
  inactive: 'bg-red-500/10 text-red-300',
};

export const KIND_LABELS: Record<string, string> = {
  trial: 'Teste',
  gift: 'Presente',
  coupon: 'Cupom',
};

export function formatDiscount(type: string | null, value: number | null): string {
  if (!type || value === null || value === undefined) return '—';
  if (type === 'percent') return `${value}% OFF`;
  return `− ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)}`;
}

export function formatProducts(types: string[]): string {
  if (!types || types.length === 0) return 'Todos os produtos';
  return types.map((type) => PRODUCT_LABELS[type] ?? type).join(', ');
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

/** "20", "20,5" ou "1.234,50" em reais para centavos. `null` se inválido. */
export function reaisToCents(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(parseFloat(normalized) * 100);
  return cents > 0 ? cents : null;
}

/** Valor de `datetime-local` (hora local do navegador) para ISO com fuso. */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
