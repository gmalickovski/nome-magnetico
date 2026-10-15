import { formatBRLFromCents } from '../money/format-brl-cents';

export type NotificationPayloadInput = Record<string, unknown> & {
  amount?: number;
  amount_formatted?: string;
};

/**
 * Adiciona campos derivados ao payload transacional antes do envio ao n8n.
 * Mantém `amount` em centavos (compatibilidade) e expõe `amount_formatted` para templates.
 */
export function enrichNotificationPayload<T extends NotificationPayloadInput>(payload: T): T {
  if (typeof payload.amount !== 'number' || !Number.isFinite(payload.amount)) {
    return payload;
  }

  if (typeof payload.amount_formatted === 'string' && payload.amount_formatted.length > 0) {
    return payload;
  }

  return {
    ...payload,
    amount_formatted: formatBRLFromCents(payload.amount),
  };
}
