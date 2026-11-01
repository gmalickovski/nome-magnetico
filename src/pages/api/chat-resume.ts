import type { APIRoute } from 'astro';
import { hasActiveSubscription } from '../../backend/db/subscriptions';
import { supabase } from '../../backend/db/supabase';

export interface ChatResumeChoice {
  id: string;
  analysis_id: string | null;
  chosen_signature: string | null;
  source: 'card_pdf' | 'paywall_free' | null;
  pdf_generated: boolean;
}

export interface ChatResumeResponse {
  paid: boolean;
  choice?: ChatResumeChoice;
}

function json(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/**
 * Retomada pós-pagamento do chat Nome Social.
 * Só devolve paid: true e choice quando o servidor confirma assinatura ativa de nome_social.
 */
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Não autenticado' }, 401);
  }

  try {
    const active = await hasActiveSubscription(user.id, 'nome_social');
    if (!active) {
      return json({ paid: false });
    }

    const { data: row, error } = await supabase
      .from('chat_checkout_choices')
      .select('id, analysis_id, chosen_signature, source, pdf_generated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[chat-resume] Erro ao buscar chat_checkout_choices:', error);
      return json({ paid: true });
    }

    if (!row) {
      return json({ paid: true });
    }

    const source =
      row.source === 'card_pdf' || row.source === 'paywall_free' ? row.source : null;

    return json({
      paid: true,
      choice: {
        id: row.id as string,
        analysis_id: (row.analysis_id as string | null) ?? null,
        chosen_signature: (row.chosen_signature as string | null) ?? null,
        source,
        pdf_generated: Boolean(row.pdf_generated_at),
      },
    });
  } catch (err) {
    console.error('[chat-resume] Erro inesperado:', err);
    return json({ error: 'Falha ao verificar retomada' }, 503);
  }
};
