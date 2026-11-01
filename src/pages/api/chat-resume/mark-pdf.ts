import type { APIRoute } from 'astro';
import { z } from 'zod';
import { hasActiveSubscription } from '../../../backend/db/subscriptions';
import { supabase } from '../../../backend/db/supabase';

const bodySchema = z.object({
  choiceId: z.string().uuid().optional(),
  stripeSessionId: z.string().trim().min(1).max(200).optional(),
});

function json(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/**
 * Marca atomicamente pdf_generated_at = now() na escolha de checkout do chat.
 * Se já estava preenchido, não atualiza nenhuma linha e retorna marked: false (idempotente).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Não autenticado' }, 401);
  }

  let rawBody: unknown = {};
  try {
    rawBody = await request.json();
  } catch {
    rawBody = {};
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return json({ error: 'Parâmetros inválidos' }, 400);
  }

  try {
    const active = await hasActiveSubscription(user.id, 'nome_social');
    if (!active) {
      return json({ error: 'Acesso não confirmado' }, 403);
    }

    const { choiceId, stripeSessionId } = parsed.data;
    if (!choiceId && !stripeSessionId) {
      return json({ error: 'Identificador da escolha é obrigatório' }, 400);
    }

    let query = supabase
      .from('chat_checkout_choices')
      .update({ pdf_generated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('pdf_generated_at', null);

    if (choiceId) {
      query = query.eq('id', choiceId);
    } else if (stripeSessionId) {
      query = query.eq('stripe_session_id', stripeSessionId);
    }

    const { data, error } = await query.select('id').maybeSingle();

    if (error) {
      console.error('[chat-resume/mark-pdf] Erro ao atualizar pdf_generated_at:', error);
      return json({ error: 'Falha ao marcar geração de PDF' }, 503);
    }

    return json({ marked: Boolean(data?.id) });
  } catch (err) {
    console.error('[chat-resume/mark-pdf] Erro inesperado:', err);
    return json({ error: 'Falha ao marcar geração de PDF' }, 503);
  }
};
