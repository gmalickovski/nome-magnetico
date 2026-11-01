import { getPostHogDistinctId } from './analytics';

export interface CreateCheckoutBody {
  product_type: string;
  couponCode?: string;
  expected_final_cents?: number;
  chosen_signature?: string;
  analysis_id?: string;
  source?: 'card_pdf' | 'paywall_free';
  utm_source?: string;
  utm_campaign?: string;
}

export type CreateCheckoutResult =
  | { ok: true; url: string }
  | { ok: true; bypass: true; redirectUrl: string }
  | { ok: false; error: string; alreadyActive?: boolean; redirectUrl?: string }
  | {
      ok: false;
      priceChanged: true;
      message: string;
      pricing: { cents: number; formatted: string; hasDiscount: boolean; discountedFormatted?: string };
      finalCents: number;
    };

export async function postCreateCheckout(body: CreateCheckoutBody): Promise<CreateCheckoutResult> {
  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      ph_distinct_id: getPostHogDistinctId(),
    }),
  });
  const data = (await res.json()) as {
    url?: string;
    bypass?: boolean;
    redirectUrl?: string;
    error?: string;
    code?: string;
    price_changed?: boolean;
    message?: string;
    pricing?: { cents: number; formatted: string; hasDiscount: boolean; discountedFormatted?: string };
    effective?: { final_cents: number };
  };

  if (data.price_changed && data.effective?.final_cents) {
    return {
      ok: false,
      priceChanged: true,
      message: data.message ?? 'O valor foi atualizado.',
      pricing: data.pricing ?? { cents: data.effective.final_cents, formatted: '', hasDiscount: false },
      finalCents: data.effective.final_cents,
    };
  }

  if (!res.ok) {
    if (data.code === 'already_active') {
      return {
        ok: false,
        error: data.error ?? 'Produto já ativo',
        alreadyActive: true,
        redirectUrl: data.redirectUrl,
      };
    }
    return { ok: false, error: data.error ?? 'Erro ao criar sessão' };
  }
  if (data.bypass && data.redirectUrl) {
    return { ok: true, bypass: true, redirectUrl: data.redirectUrl };
  }
  if (!data.url) {
    return { ok: false, error: 'URL de pagamento não retornada' };
  }
  return { ok: true, url: data.url };
}

/** Confirma mudança de preço com o usuário e reenvia com expected_final_cents. */
export function checkoutFailureMessage(
  result: Extract<CreateCheckoutResult, { ok: false }>,
): string {
  if ('priceChanged' in result && result.priceChanged) return result.message;
  if ('error' in result) return result.error;
  return 'Erro ao criar sessão';
}

export async function postCreateCheckoutWithPriceConfirm(
  body: CreateCheckoutBody,
  formatPrice: (cents: number) => string,
): Promise<CreateCheckoutResult> {
  const first = await postCreateCheckout(body);
  if (!('priceChanged' in first) || !first.priceChanged) {
    return first;
  }

  const label = formatPrice(first.finalCents);
  const proceed = window.confirm(`${first.message}\n\nNovo valor: ${label}\n\nContinuar para o pagamento?`);
  if (!proceed) {
    return { ok: false, error: 'Checkout cancelado — o valor na página foi atualizado.' };
  }

  return postCreateCheckout({
    ...body,
    expected_final_cents: first.finalCents,
  });
}
