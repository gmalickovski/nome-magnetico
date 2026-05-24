import type { APIRoute } from 'astro';
import { supabase } from '../../../backend/db/supabase';

const PRODUCT_LABELS: Record<string, string> = {
  nome_social: 'Nome Social',
  nome_bebe: 'Nome de Bebe',
  nome_empresa: 'Nome Empresarial',
};

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Nao autenticado' }), { status: 401 });
  }

  const now = new Date();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, product_type, starts_at, ends_at, amount_paid, stripe_session_id, payment_provider')
    .eq('user_id', user.id)
    .order('ends_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const deduped = new Map<string, NonNullable<typeof data>[number]>();

  for (const subscription of data ?? []) {
    const current = deduped.get(subscription.product_type);
    if (!current || new Date(subscription.ends_at) > new Date(current.ends_at)) {
      deduped.set(subscription.product_type, subscription);
    }
  }

  const subscriptions = Array.from(deduped.values()).map((subscription) => {
    const endsAt = new Date(subscription.ends_at);
    const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 86400000));
    const isTrial = String(subscription.stripe_session_id || '').startsWith('trial_');

    return {
      ...subscription,
      product_label: PRODUCT_LABELS[subscription.product_type] ?? subscription.product_type,
      is_active: endsAt > now,
      is_trial: isTrial,
      access_label: isTrial ? 'Acesso presente/trial' : 'Acesso comprado',
      days_left: daysLeft,
    };
  });

  return new Response(JSON.stringify({ subscriptions }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
