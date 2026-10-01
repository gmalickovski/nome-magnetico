import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getOpsUser, OpsWriteError, updateOpsUser } from '@/backend/ops/userRecord';
import { isAdminHost, requestHostname } from '@/backend/security/adminHost';
import { assertStaff, StaffAuthError } from '@/backend/security/assertStaff';

const idSchema = z.string().uuid();

const patchSchema = z
  .object({
    role: z.enum(['user', 'admin']).optional(),
    is_test: z.boolean().optional(),
    test_ends_at: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .refine(
    (body) => body.role !== undefined || body.is_test !== undefined || body.test_ends_at !== undefined,
    { message: 'Nada para atualizar' },
  );

function json(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function staffOrResponse(request: Request, locals: App.Locals) {
  if (!isAdminHost(requestHostname(request))) {
    return json({ error: 'Host não autorizado' }, 403);
  }

  try {
    return await assertStaff(locals);
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error('[ops/users] falha ao validar equipe');
    return json({ error: 'Não foi possível validar a permissão' }, 503);
  }
}

export const GET: APIRoute = async ({ request, params, locals }) => {
  const gate = await staffOrResponse(request, locals);
  if (gate instanceof Response) return gate;

  const id = idSchema.safeParse(params.id);
  if (!id.success) return json({ error: 'Usuário inválido' }, 400);

  try {
    const user = await getOpsUser(id.data);
    if (!user) return json({ error: 'Usuário não encontrado' }, 404);
    return json({ user, is_self: user.id === gate.profile.id });
  } catch (error) {
    console.error('[ops/users] falha ao ler', error instanceof Error ? error.message : 'erro');
    return json({ error: 'Erro ao carregar usuário' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  const gate = await staffOrResponse(request, locals);
  if (gate instanceof Response) return gate;

  const id = idSchema.safeParse(params.id);
  if (!id.success) return json({ error: 'Usuário inválido' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Corpo inválido' }, 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'Parâmetros inválidos' }, 400);

  try {
    const user = await updateOpsUser({
      userId: id.data,
      actorId: gate.profile.id,
      role: parsed.data.role,
      isTest: parsed.data.is_test,
      testEndsAt: parsed.data.test_ends_at,
      testEndsAtSet: Object.prototype.hasOwnProperty.call(parsed.data, 'test_ends_at'),
    });
    return json({ user, is_self: user.id === gate.profile.id });
  } catch (error) {
    if (error instanceof OpsWriteError) return json({ error: error.message }, error.status);
    console.error('[ops/users] falha ao atualizar', error instanceof Error ? error.message : 'erro');
    return json({ error: 'Erro ao atualizar usuário' }, 500);
  }
};
