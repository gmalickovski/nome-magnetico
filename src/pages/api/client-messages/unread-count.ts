import type { APIRoute } from 'astro';
import { supabase } from '../../../backend/db/supabase';

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Nao autenticado' }), { status: 401 });
  }

  const { data, error } = await supabase
    .from('client_message_deliveries')
    .select('id, message_id, client_messages(status)')
    .eq('user_id', user.id)
    .contains('channels', ['popup'])
    .is('seen_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const count = (data ?? []).filter((delivery: any) => delivery.client_messages?.status === 'sent').length;

  return new Response(JSON.stringify({ count }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
