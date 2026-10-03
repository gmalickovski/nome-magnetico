import { hostnameOf, isAdminHost, requestHostname } from './adminHost';
import { assertStaff, StaffAuthError, type StaffContext } from './assertStaff';

export function opsJson(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return hostnameOf(new URL(origin).host) === requestHostname(request);
  } catch {
    return false;
  }
}

/**
 * Porta de entrada das APIs de ops: host admin, staff (`profiles.role = admin`)
 * e, em mutações, mesma origem + JSON.
 */
export async function opsGate(
  request: Request,
  locals: App.Locals,
  scope: string,
): Promise<StaffContext | Response> {
  if (!isAdminHost(requestHostname(request))) {
    return opsJson({ error: 'Host não autorizado' }, 403);
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (!sameOrigin(request)) return opsJson({ error: 'Origem não autorizada' }, 403);
    if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
      return opsJson({ error: 'Corpo inválido' }, 415);
    }
  }

  try {
    return await assertStaff(locals);
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return opsJson({ error: error.message }, error.status);
    }
    console.error(`[ops/${scope}] falha ao validar equipe`);
    return opsJson({ error: 'Não foi possível validar a permissão' }, 503);
  }
}
