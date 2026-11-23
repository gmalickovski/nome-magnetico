import type { APIRoute } from 'astro';
import { z } from 'zod';
import { listAdminSupportTickets, readAdminSupportTicket } from '@/backend/support/read-tickets';
import { isAdminHost, requestHostname } from '@/backend/security/adminHost';
import { assertStaff, StaffAuthError } from '@/backend/security/assertStaff';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  ticket: z.string().uuid().optional(),
});

function json(body: object, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export const GET: APIRoute = async ({ request, locals, url }) => {
  if (!isAdminHost(requestHostname(request))) {
    return json({ error: 'Host não autorizado' }, 403);
  }
  try {
    await assertStaff(locals);
  } catch (error) {
    if (error instanceof StaffAuthError) return json({ error: error.message }, error.status);
    return json({ error: 'Não foi possível validar a permissão' }, 503);
  }

  const parsed = querySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    ticket: url.searchParams.get('ticket') ?? undefined,
  });
  if (!parsed.success) return json({ error: 'Parâmetros inválidos' }, 400);

  try {
    if (!parsed.data.ticket) return json(await listAdminSupportTickets(parsed.data.page));
    const ticket = await readAdminSupportTicket(parsed.data.ticket);
    return ticket ? json({ ticket }) : json({ error: 'Chamado não encontrado' }, 404);
  } catch {
    console.error('[ops/support] falha ao carregar chamados');
    return json({ error: 'Não foi possível carregar os chamados' }, 500);
  }
};
