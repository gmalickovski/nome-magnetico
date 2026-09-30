/**
 * POST /api/internal/sentry-test
 *
 * Dispara um erro de teste no Sentry. Não está ligado na interface.
 *
 * Acesso:
 *   - header `X-Internal-Secret` igual a INTERNAL_API_SECRET, ou
 *   - sessão de um perfil com role admin
 *
 * Sem DSN, ou fora de production (sem SENTRY_ENABLED=true), responde 503
 * e não envia evento.
 */
import type { APIRoute } from 'astro';
import * as Sentry from '@sentry/astro';
import { isAdmin } from '../../../backend/db/users';
import { isSentryEnabled } from '../../../sentry/env';

const SMOKE_MESSAGE = 'Sentry smoke test — Nome Magnético (server)';

export const POST: APIRoute = async ({ request, locals }) => {
  const secret = process.env.INTERNAL_API_SECRET;
  const headerOk = Boolean(secret && request.headers.get('X-Internal-Secret') === secret);

  let adminOk = false;
  if (!headerOk && locals.user) {
    adminOk = await isAdmin(locals.user.id);
  }

  if (!headerOk && !adminOk) {
    return json({ error: 'Unauthorized' }, 401);
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
