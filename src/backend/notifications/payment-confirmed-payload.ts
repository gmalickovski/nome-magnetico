/**
 * Payload do evento `payment.confirmed` enviado ao n8n via notify().
 * Função pura: não faz I/O, para poder ser testada sem mocks.
 */

export interface PaymentConfirmedSession {
  id: string;
  amount_total?: number | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
}

export interface PaymentConfirmedInput {
  session: PaymentConfirmedSession;
  profile: { email?: string | null; nome?: string | null } | null;
  userId: string;
  productType: string;
  productName?: string;
  accessUrl: string;
  paymentIntentId?: string;
}

export type PaymentConfirmedPayload = {
  email: string;
  firstName: string;
  accessUrl: string;
  productType: string;
  productName?: string;
  amount: number;
  payment_id: string;
  userId: string;
};

/** Primeiro e-mail não vazio: perfil, depois e-mail do checkout, depois dados do cliente. */
export function resolvePaymentRecipientEmail(
  session: PaymentConfirmedSession,
  profile: { email?: string | null } | null,
): string | null {
  const candidates = [profile?.email, session.customer_email, session.customer_details?.email];
  for (const c of candidates) {
    const v = typeof c === 'string' ? c.trim() : '';
    if (v) return v;
  }
  return null;
}

/** Devolve `null` quando não há destinatário (o chamador loga e não envia). */
export function buildPaymentConfirmedPayload(
  input: PaymentConfirmedInput,
): PaymentConfirmedPayload | null {
  const email = resolvePaymentRecipientEmail(input.session, input.profile);
  if (!email) return null;

  const amount =
    typeof input.session.amount_total === 'number' && Number.isFinite(input.session.amount_total)
      ? input.session.amount_total
      : 0;

  return {
    email,
    firstName: input.profile?.nome?.trim() || email.split('@')[0],
    accessUrl: input.accessUrl,
    productType: input.productType,
    productName: input.productName,
    amount,
    payment_id: input.paymentIntentId ?? input.session.id,
    userId: input.userId,
  };
}
