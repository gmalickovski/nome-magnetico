import { formatBRLFromCents } from '../money/format-brl-cents';

/** DEV-163 · Aviso de reembolso feito no Dashboard do Stripe (charge.refunded). */

export const APP_REFUND_SOURCE = 'nome-magnetico-app';

type ChargeRefundLike = {
  amount_refunded?: number | null;
  refunds?: { data?: Array<{ id: string; metadata?: Record<string, string> | null }> } | null;
};

/** Reembolso pedido pelo próprio app já avisa o cliente em /api/request-refund; não avisar de novo. */
export function isAppInitiatedRefund(charge: ChargeRefundLike): boolean {
  return (charge.refunds?.data ?? []).some((r) => r.metadata?.source === APP_REFUND_SOURCE);
}

export function buildDashboardRefundPayload(input: {
  charge: ChargeRefundLike;
  profile: { email: string; nome?: string | null };
  userId: string;
  productType: string;
  productName: string;
  amountPaidCents?: number | null;
  skipAdminSlack: boolean;
}) {
  const amount = input.charge.amount_refunded ?? input.amountPaidCents ?? 0;
  return {
    email: input.profile.email,
    firstName: input.profile.nome ?? input.profile.email.split('@')[0],
    userId: input.userId,
    productType: input.productType,
    productName: input.productName,
    amount,
    amount_formatted: formatBRLFromCents(amount),
    skipAdminSlack: input.skipAdminSlack,
  };
}
