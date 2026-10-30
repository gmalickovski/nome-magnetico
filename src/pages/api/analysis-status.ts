import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '../../backend/db/supabase';
import { reconcileStaleAnalysis } from '../../backend/db/analysis-processing';
import type { Analysis } from '../../backend/db/analyses';

const querySchema = z.object({
  id: z.string().uuid({ message: 'ID de análise inválido' }),
});

export const GET: APIRoute = async ({ request, locals }) => {
  let user = (locals as any)?.user;

  if (!user) {
    const authHeader = request.headers.get('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (bearerToken) {
      const { data, error } = await supabase.auth.getUser(bearerToken);
      if (!error && data?.user) {
        user = data.user;
      }
    }
  }

  if (!user) {
    return new Response(JSON.stringify({ error: 'Autenticação necessária' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ id: url.searchParams.get('id') });

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'ID de análise inválido' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  const { data: analysis, error } = await supabase
    .from('analyses')
    .select('id, status, created_at, error_message, user_id')
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .single();

  if (error || !analysis) {
    return new Response(JSON.stringify({ error: 'Análise não encontrada' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  const reconciled = await reconcileStaleAnalysis(analysis as unknown as Analysis);

  return new Response(JSON.stringify({
    id: reconciled.id,
    status: reconciled.status,
    error: reconciled.error_message ?? null,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
