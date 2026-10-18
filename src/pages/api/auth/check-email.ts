import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '../../../backend/db/supabase';
import {
  getClientIp,
  hashClientIp,
  enforceApiRateLimits,
} from '../../../backend/security/apiRateLimit';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

// 10 requisições por 10 minutos por IP
const IP_CHECK_EMAIL_LIMIT = 10;
const CHECK_EMAIL_WINDOW_SECONDS = 10 * 60;

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const clientIp = getClientIp(request, clientAddress);
  const ipHash = hashClientIp(clientIp);

  const rules = [
    {
      key: `check-email:ip:${ipHash}`,
      limit: IP_CHECK_EMAIL_LIMIT,
      windowSeconds: CHECK_EMAIL_WINDOW_SECONDS,
    },
  ];

  if ((locals as any)?.user?.id) {
    rules.push({
      key: `check-email:user:${(locals as any).user.id}`,
      limit: IP_CHECK_EMAIL_LIMIT,
      windowSeconds: CHECK_EMAIL_WINDOW_SECONDS,
    });
  }

  const rateLimitResult = await enforceApiRateLimits(supabase, rules, 'check-email');
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Muitas consultas recentes. Aguarde alguns minutos antes de tentar novamente.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body inválido' }, 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }, 400);
  }

  // Resposta genérica para evitar enumeração de contas (DEV-118).
  // Não expõe se a conta existe ou não.
  return json(
    {
      ok: true,
      message: 'Se houver uma conta cadastrada com este e-mail, as instruções de acesso serão aplicadas.',
    },
    200
  );
};

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
