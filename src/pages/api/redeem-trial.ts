import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '../../backend/db/supabase';
import { recordHqAccessTrialUse } from '../../backend/payments/prices';

const VALID_PRODUCTS = ['nome_social', 'nome_bebe', 'nome_empresa'] as const;
type TrialProduct = typeof VALID_PRODUCTS[number];

const schema = z.object({
  trialCode: z.string().min(1),
  trialDays: z.number().int().min(0),
  productType: z.string().optional(),
});

function resolveProducts(productType?: string): TrialProduct[] {
  const requested = (productType ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is TrialProduct => VALID_PRODUCTS.includes(item as TrialProduct));

  if (requested.length > 0) {
    return Array.from(new Set(requested));
  }

  return [...VALID_PRODUCTS];
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Nao autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body invalido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Parametros invalidos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { trialCode, trialDays, productType } = parsed.data;
  const products = resolveProducts(productType);
  const now = new Date();
  const authedUser = user;

  async function recordTrialUseInHq() {
    await recordHqAccessTrialUse({
      trialCode,
      productType,
      userId: authedUser.id,
      userEmail: authedUser.email,
    }).catch((err) => console.error('[api/redeem-trial] Falha ao registrar trial no HQ:', err));
  }

  const { data: existing } = await supabase
    .from('trial_redemptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('trial_code', trialCode)
    .single();

  if (existing) {
    await recordTrialUseInHq();
    return new Response(
      JSON.stringify({ error: 'Codigo ja resgatado por este usuario' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { data: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('product_type, ends_at')
    .eq('user_id', user.id)
    .in('product_type', products)
    .gt('ends_at', now.toISOString());

  const activeProducts = new Set((activeSubscriptions ?? []).map((subscription) => subscription.product_type));
  const productsToCreate = products.filter((product) => !activeProducts.has(product));

  if (productsToCreate.length === 0) {
    await recordTrialUseInHq();
    return new Response(
      JSON.stringify({ success: false, alreadyActive: true, error: 'Voce ja possui acesso ativo para este produto.' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const endsAt =
    trialDays === 0
      ? null
      : new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString();

  // Trial global segue como usuario teste. Trial por produto fica escopado
  // apenas nas subscriptions, para nao liberar os demais produtos.
  if (productsToCreate.length === VALID_PRODUCTS.length) {
    await supabase
      .from('profiles')
      .update({ is_test: true, test_ends_at: endsAt })
      .eq('id', user.id);
  }

  const subscriptionEndsAt =
    endsAt ?? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

  for (const pt of productsToCreate) {
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      product_type: pt,
      starts_at: now.toISOString(),
      ends_at: subscriptionEndsAt,
      stripe_session_id: `trial_${trialCode}`,
      amount_paid: 0,
    });
  }

  await supabase.from('trial_redemptions').insert({
    user_id: user.id,
    trial_code: trialCode,
    trial_days: trialDays,
    product_type: products.length === VALID_PRODUCTS.length ? 'all' : products.join(','),
    source: 'link',
  });

  await recordTrialUseInHq();

  return new Response(JSON.stringify({ success: true, endsAt, skippedActiveProducts: Array.from(activeProducts) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
