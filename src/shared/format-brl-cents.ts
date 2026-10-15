const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Formata valor em centavos de BRL (Stripe/Supabase) para exibição, e-mails e UI.
 */
export function formatBRLFromCents(cents: number): string {
  if (!Number.isFinite(cents)) {
    throw new RangeError('formatBRLFromCents: cents must be a finite number');
  }
  // pt-BR usa NBSP entre símbolo e valor; normalizamos para espaço comum (e-mails/n8n).
  return brlFormatter.format(cents / 100).replace(/\u00A0/g, ' ');
}

/** Variante de landing/cards: remove centavos ,00 quando o valor é inteiro em reais. */
export function formatBRLDisplayFromCents(cents: number): string {
  return formatBRLFromCents(cents).replace(/,00$/, '');
}
