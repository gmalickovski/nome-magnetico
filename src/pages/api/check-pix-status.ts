import type { APIRoute } from 'astro';
import { supabase } from '../../backend/db/supabase';

export const GET: APIRoute = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Autenticação necessária' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const chargeId = url.searchParams.get('chargeId');
  if (!chargeId) {
    return new Response(
      JSON.stringify({ error: 'chargeId obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Stripe PaymentIntent id (pi_...) — fluxo atual.
  // Prefixo asaas_ permanece apenas para cobranças legadas ainda em polling.
  const { data } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .or(
      [
        `stripe_payment_intent_id.eq.${chargeId}`,
        `stripe_session_id.eq.${chargeId}`,
        `stripe_session_id.eq.asaas_${chargeId}`,
      ].join(',')
    )
    .limit(1);

  const paid = (data?.length ?? 0) > 0;

  return new Response(
    JSON.stringify({ paid }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
