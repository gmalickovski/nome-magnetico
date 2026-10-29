import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getAnalysis } from '../../backend/db/analyses';
import { reconcileStaleAnalysis } from '../../backend/db/analysis-processing';

const querySchema = z.object({
  id: z.string().uuid(),
});

export const GET: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Autenticacao necessaria' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ id: url.searchParams.get('id') });

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'ID de analise invalido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let analysis = await getAnalysis(parsed.data.id);
  if (!analysis || analysis.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Analise nao encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  analysis = await reconcileStaleAnalysis(analysis);

  return new Response(JSON.stringify({
    id: analysis.id,
    status: analysis.status,
    error: analysis.error_message ?? null,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
