import type { APIRoute } from 'astro';
import { z } from 'zod';
import { isAdmin } from '../../../backend/db/users';
import { isOpsSurface, requestHost } from '../../../backend/ops/host';
import { listOpsUsers } from '../../../backend/ops/users';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  q: z.string().max(80).optional().default(''),
});

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export const GET: APIRoute = async ({ locals, request, url }) => {
  const host = requestHost(request, url);
  if (!isOpsSurface(host)) {
    return new Response('Not Found', { status: 404 });
  }

  if (!locals.opsAdmin || !locals.user) {
    return json({ error: 'Não autorizado' }, 401);
  }

  const admin = await isAdmin(locals.user.id);
  if (!admin) {
    return json({ error: 'Acesso restrito para administradores' }, 403);
  }

  const parsed = querySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    q: url.searchParams.get('q') ?? undefined,
  });
  if (!parsed.success) {
    return json({ error: 'Consulta inválida' }, 400);
  }

  try {
    const result = await listOpsUsers(parsed.data);
    return json(result);
  } catch (error) {
    console.error('[api/ops/users] falha ao listar usuários:', error);
    return json({ error: 'Não foi possível carregar os usuários' }, 500);
  }
};
