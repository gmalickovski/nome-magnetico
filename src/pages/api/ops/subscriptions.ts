import type { APIRoute } from 'astro';
import { z } from 'zod';
import { listOpsSubscriptions } from '@/backend/ops/listSubscriptions';
import { isAdminHost, requestHostname } from '@/backend/security/adminHost';
import { assertStaff, StaffAuthError } from '@/backend/security/assertStaff';

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  user_id: z.string().uuid().optional(),
  product_type: z.enum(['nome_social', 'nome_bebe', 'nome_empresa']).optional(),
  status: z.enum(['active', 'expired', 'refunded']).optional(),
  provider: z.enum(['stripe', 'asaas']).optional(),
  kind: z.enum(['trial', 'paid']).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  per_page: z.coerce.number().int().min(1).max(50).default(20),
});

function json(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const GET: APIRoute = async ({ request, url, locals }) => {
  if (!isAdminHost(requestHostname(request))) {
    return json({ error: 'Host não autorizado' }, 403);
  }

  try {
    await assertStaff(locals);
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error('[ops/subscriptions] falha ao validar equipe');
    return json({ error: 'Não foi possível validar a permissão' }, 503);
  }

  const raw: Record<string, string> = {};
  for (const key of ['q', 'user_id', 'product_type', 'status', 'provider', 'kind', 'page', 'per_page'] as const) {
    const value = url.searchParams.get(key);
    if (value) raw[key] = value;
  }
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return json({ error: 'Parâmetros inválidos' }, 400);

  const { q, user_id, product_type, status, provider, kind, page, per_page } = parsed.data;

  try {
    const result = await listOpsSubscriptions({
      q: q || undefined,
      userId: user_id,
      productType: product_type,
      status,
      provider,
      kind,
      page,
      perPage: per_page,
    });
    return json(result);
  } catch (error) {
    console.error('[ops/subscriptions] falha ao listar', error instanceof Error ? error.message : 'erro');
    return json({ error: 'Erro ao listar assinaturas' }, 500);
  }
};
