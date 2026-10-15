const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Formata valor Stripe/Supabase em centavos de BRL para exibição (e-mails, UI).
 */
export function formatBRLFromCents(cents: number): string {
  if (!Number.isFinite(cents)) {
    throw new RangeError('formatBRLFromCents: cents must be a finite number');
  }
  // pt-BR usa NBSP entre símbolo e valor; normalizamos para espaço comum (e-mails/n8n).
  return brlFormatter.format(cents / 100).replace(/\u00A0/g, ' ');
}
