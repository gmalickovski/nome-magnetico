/**
 * POST /api/internal/sentry-test
 *
 * Dispara um erro de teste no Sentry. Não está ligado na interface.
 *
 * Acesso:
 *   - header `X-Internal-Secret` igual a INTERNAL_API_SECRET, ou
 *   - sessão de um perfil com role admin
 * Sem INTERNAL_API_SECRET e sem admin, responde 503.
 *
 * Sem DSN, ou fora de production (sem SENTRY_ENABLED=true), responde 503
 * e não envia evento.
 */
import type { APIRoute } from 'astro';
import * as Sentry from '@sentry/astro';
import { isAdmin } from '../../../backend/db/users';
import { authorizeInternalRequest } from '../../../backend/env/internal-auth';
import { isSentryEnabled } from '../../../sentry/env';

const SMOKE_MESSAGE = 'Sentry smoke test — Nome Magnético (server)';

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = authorizeInternalRequest(request.headers.get('X-Internal-Secret'));

  let adminOk = false;
  if (!auth.ok && locals.user) {
    adminOk = await isAdmin(locals.user.id);
  }

  if (!auth.ok && !adminOk) {
    return json({ error: auth.error }, auth.status);
  }

  if (!isSentryEnabled()) {
    return json(
      {
        ok: false,
        enabled: false,
        error:
          'Sentry está desligado. Defina SENTRY_DSN (ou PUBLIC_SENTRY_DSN) e APP_ENV=production, ou SENTRY_ENABLED=true.',
      },
      503,
    );
  }

  const eventId = Sentry.captureException(new Error(SMOKE_MESSAGE), {
    tags: { smoke: 'server' },
  });
  await Sentry.flush(2000);

  return json({ ok: true, enabled: true, eventId: eventId ?? null }, 200);
};

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
