import type { ProductType } from '../../shared/product-labels';
import { PRODUCT_LABELS } from '../../shared/product-labels';

export const MOTIVO_CART_ABANDONED = {
  pix_expired: 'O pagamento via Pix da sua análise de Nome Social não foi concluído.',
  card_declined: 'O pagamento com cartão da sua análise de Nome Social não foi concluído.',
  checkout_expired: 'Você começou o checkout da sua análise de Nome Social e ele ficou pendente.',
} as const;

export type RecoveryReasonType = 'expired' | 'declined';
export type RecoveryPaymentMethod = 'pix' | 'card';

/**
 * Resolve o método de pagamento a partir do erro ou payment method details do PaymentIntent.
 * Nunca confia cegamente em payment_method_types que contenha 'pix' quando o checkout é dual (card + pix).
 */
export function resolvePaymentMethodFromIntent(pi: {
  last_payment_error?: {
    payment_method?: { type?: string | null } | null;
    type?: string | null;
    code?: string | null;
  } | null;
  charges?: {
    data?: Array<{
      payment_method_details?: { type?: string | null } | null;
    }>;
  } | null;
  payment_method_types?: string[] | null;
}): RecoveryPaymentMethod {
  const errorMethod = pi.last_payment_error?.payment_method?.type?.toLowerCase();
  if (errorMethod === 'pix') return 'pix';
  if (errorMethod === 'card') return 'card';

  const chargeMethod = pi.charges?.data?.[0]?.payment_method_details?.type?.toLowerCase();
  if (chargeMethod === 'pix') return 'pix';
  if (chargeMethod === 'card') return 'card';

  if (pi.last_payment_error?.code === 'payment_intent_payment_attempt_expired') {
    return 'pix';
  }

  // Fallback seguro: se payment_method_types é exclusivamente pix
  if (pi.payment_method_types?.length === 1 && pi.payment_method_types[0] === 'pix') {
    return 'pix';
  }

  return 'card';
}

export interface CartAbandonedPayload {
  email: string;
  firstName: string;
  productName: string;
  checkoutUrl: string;
  user_id: string;
  product_type: string;
  payment_id: string;
  motivo: string;
  reason_type: RecoveryReasonType;
  payment_method?: RecoveryPaymentMethod;
  [key: string]: unknown;
}

export interface EnrichedPaymentFailedPayload {
  email: string;
  firstName: string;
  productType: string;
  productName: string;
  reason_type: RecoveryReasonType;
  payment_id: string;
  reason?: string | null;
  payment_method?: RecoveryPaymentMethod;
  amount?: number;
  user_id?: string;
  [key: string]: unknown;
}

/**
 * Valida se uma URL é um endpoint HTTPS válido.
 * Rejeita vazios, strings malformadas ou protocolos não-HTTPS.
 */
export function isValidHttpsCheckoutUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Confere que a URL não possui parâmetros UTM concatenados diretamente.
 * As UTMs do Brevo são configuradas à parte no template de envio.
 */
export function hasNoConcatenatedUtm(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      !parsed.searchParams.has('utm_source') &&
      !parsed.searchParams.has('utm_medium') &&
      !parsed.searchParams.has('utm_campaign')
    );
  } catch {
    return true;
  }
}

/**
 * Resolve o texto exato do motivo de recuperação para os 3 casos definidos pelo Growth:
 * 1. Pix expirado ou não pago
 * 2. Cartão recusado
 * 3. Checkout abandonado / expirado
 */
export function resolveRecoveryMotivo(
  caseType: 'pix_expired' | 'card_declined' | 'checkout_expired',
): string {
  return MOTIVO_CART_ABANDONED[caseType];
}

export function buildCartAbandonedPayload(input: {
  email: string;
  firstName: string;
  productType: ProductType | string;
  checkoutUrl: string;
  userId: string;
  paymentId: string;
  reasonType: RecoveryReasonType;
  paymentMethod?: RecoveryPaymentMethod;
  motivo: string;
}): CartAbandonedPayload | null {
  if (!isValidHttpsCheckoutUrl(input.checkoutUrl)) {
    return null;
  }
  if (!hasNoConcatenatedUtm(input.checkoutUrl)) {
    return null;
  }
  const email = input.email.trim();
  const userId = input.userId.trim();
  if (!email || !userId) {
    return null;
  }

  const prodKey = input.productType as ProductType;
  const productName = prodKey in PRODUCT_LABELS ? PRODUCT_LABELS[prodKey] : 'Nome Social';

  return {
    email,
    firstName: input.firstName.trim() || email.split('@')[0] || 'Cliente',
    productName,
    checkoutUrl: input.checkoutUrl.trim(),
    user_id: userId,
    product_type: String(input.productType),
    payment_id: input.paymentId,
    motivo: input.motivo,
    reason_type: input.reasonType,
    ...(input.paymentMethod ? { payment_method: input.paymentMethod } : {}),
  };
}

/**
 * Deduplicador de falhas de pagamento entre eventos com diferentes IDs
 * da mesma tentativa (ex.: checkout.session.async_payment_failed e payment_intent.payment_failed).
 */
export class FailedPaymentDeduplicator {
  private processed = new Map<string, number>();
  private readonly ttlMs: number;

  constructor(ttlMs = 15 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  /**
   * Tenta registrar as chaves associadas a uma falha.
   * Retorna true se for o primeiro registro (deve processar);
   * Retorna false se qualquer chave já tiver sido processada dentro da janela TTL.
   */
  shouldProcess(keys: (string | null | undefined)[]): boolean {
    const now = Date.now();
    this.cleanup(now);

    const validKeys = keys
      .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
      .map((k) => k.trim());

    if (validKeys.length === 0) {
      return true;
    }

    for (const key of validKeys) {
      const exp = this.processed.get(key);
      if (exp && exp > now) {
        return false;
      }
    }

    const expiresAt = now + this.ttlMs;
    for (const key of validKeys) {
      this.processed.set(key, expiresAt);
    }
    return true;
  }

  reset(): void {
    this.processed.clear();
  }

  private cleanup(now: number): void {
    for (const [key, exp] of this.processed.entries()) {
      if (exp <= now) {
        this.processed.delete(key);
      }
    }
  }
}

export const failedPaymentDeduplicator = new FailedPaymentDeduplicator();
