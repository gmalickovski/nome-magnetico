import type { APIRoute } from 'astro';
import { supabase } from '../../../backend/db/supabase';

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Nao autenticado' }), { status: 401 });
  }

  const { data, error } = await supabase
    .from('client_message_deliveries')
    .select('id, message_id, created_at, seen_at, dismissed_at, rendered_title, rendered_body_markdown, client_messages(public_title, body_markdown, sent_at, status)')
    .eq('user_id', user.id)
    .contains('channels', ['popup'])
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const messages = (data ?? [])
    .filter((delivery: any) => delivery.client_messages?.status === 'sent')
    .map((delivery: any) => ({
      id: delivery.id,
      messageId: delivery.message_id,
      title: delivery.rendered_title || delivery.client_messages?.public_title || 'Notificacao',
      bodyMarkdown: delivery.rendered_body_markdown || delivery.client_messages?.body_markdown || '',
      createdAt: delivery.client_messages?.sent_at || delivery.created_at,
      seenAt: delivery.seen_at,
      dismissedAt: delivery.dismissed_at,
    }));

  if (url.searchParams.get('markSeen') === '1') {
    const unreadIds = messages
      .filter((message) => !message.seenAt)
      .map((message) => message.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('client_message_deliveries')
        .update({ popup_status: 'seen', seen_at: new Date().toISOString() })
        .in('id', unreadIds)
        .eq('user_id', user.id);
    }
  }

  return new Response(JSON.stringify({ messages }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
