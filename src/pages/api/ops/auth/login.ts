import type { APIRoute } from 'astro';
import { z } from 'zod';
import { isAdmin } from '../../../../backend/db/users';
import { isOpsSurface, opsHref, requestHost } from '../../../../backend/ops/host';
import { getOpsAuthClient, setOpsSession } from '../../../../backend/ops/session';

const schema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

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

function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

function withinRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

function loginRedirect(host: string, msg: string) {
  const dest = new URL(opsHref(host, '/login'), 'http://ops.local');
  dest.searchParams.set('msg', msg);
  return dest.pathname + dest.search;
}

export const POST: APIRoute = async ({ request, cookies, url, redirect }) => {
  const host = requestHost(request, url);
  if (!isOpsSurface(host)) {
    return new Response('Not Found', { status: 404 });
  }

  const formPost = (request.headers.get('content-type') ?? '').includes('application/x-www-form-urlencoded')
    || (request.headers.get('content-type') ?? '').includes('multipart/form-data');
  const fail = (message: string, status: number, msg: string) =>
    formPost ? redirect(loginRedirect(host, msg), 303) : json({ error: message }, status);

  if (!withinRateLimit(clientIp(request))) {
    return fail('Muitas tentativas. Aguarde alguns minutos.', 429, 'limite');
  }

  let payload: unknown;
  try {
    if (formPost) {
      const form = await request.formData();
      payload = { email: form.get('email'), password: form.get('password') };
    } else {
      payload = await request.json();
    }
  } catch {
    return fail('Email ou senha incorretos', 400, 'credenciais');
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return fail('Email ou senha incorretos', 401, 'credenciais');
  }

  const email = parsed.data.email.toLowerCase();
  const { data, error } = await getOpsAuthClient().auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.session || !data.user) {
    return fail('Email ou senha incorretos', 401, 'credenciais');
  }

  const apps = data.user.app_metadata?.apps as string[] | undefined;
  if (apps !== undefined && !apps.includes('nome_magnetico')) {
    return fail('Esta conta não tem permissão de administração.', 403, 'sem-permissao');
  }

  const admin = await isAdmin(data.user.id);
  if (!admin) {
    return fail('Esta conta não tem permissão de administração.', 403, 'sem-permissao');
  }

  setOpsSession(cookies, url, request, {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
  });

  if (formPost) return redirect(opsHref(host, '/'), 303);
  return json({ ok: true, redirect: opsHref(host, '/') });
};
