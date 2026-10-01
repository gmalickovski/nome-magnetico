import type { APIContext, MiddlewareNext } from 'astro';
import * as Sentry from '@sentry/astro';
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './backend/db/supabase';
import {
  adminOpsUrl,
  classifyAdminPath,
  isAdminHost,
  publicSiteOrigin,
  requestHostname,
  safeOpsRedirect,
} from './backend/security/adminHost';
import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  LEGACY_ACCESS_COOKIE,
  LEGACY_REFRESH_COOKIE,
} from './shared/auth-cookies';
import '../sentry.server.config';

const COOKIE_CLEAR = { path: '/' };

function json(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function clearAuthCookies(context: APIContext) {
  context.cookies.delete(AUTH_ACCESS_COOKIE, COOKIE_CLEAR);
  context.cookies.delete(AUTH_REFRESH_COOKIE, COOKIE_CLEAR);
  context.cookies.delete(LEGACY_ACCESS_COOKIE, COOKIE_CLEAR);
  context.cookies.delete(LEGACY_REFRESH_COOKIE, COOKIE_CLEAR);
}

type SessionRead = 'none' | 'invalid' | 'foreign' | 'unavailable' | 'ok';

async function readSession(context: APIContext): Promise<SessionRead> {
  const accessToken =
    context.cookies.get(AUTH_ACCESS_COOKIE)?.value ??
    context.cookies.get(LEGACY_ACCESS_COOKIE)?.value;

  if (!accessToken) return 'none';

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      clearAuthCookies(context);
      return 'invalid';
    }

    const apps = user.app_metadata?.apps as string[] | undefined;
    if (apps !== undefined && !apps.includes('nome_magnetico')) {
      clearAuthCookies(context);
      return 'foreign';
    }

    context.locals.user = user;
    context.locals.accessToken = accessToken;
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

async function staffRole(context: APIContext): Promise<'admin' | 'denied' | 'error'> {
  const user = context.locals.user;
  if (!user) return 'denied';

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return 'error';
  if (data?.role === 'admin') {
    context.locals.isStaff = true;
    return 'admin';
  }
  return 'denied';
}

function redirectToPublic(context: APIContext): Response {
  const target = new URL(context.url.pathname + context.url.search, publicSiteOrigin());
  return Response.redirect(target.toString(), 302);
}

function loginRedirect(context: APIContext, publicPath: string): Response {
  const url = new URL('/login', context.url);
  const next = safeOpsRedirect(publicPath);
  if (next !== '/') url.searchParams.set('redirect', next);
  return context.redirect(`${url.pathname}${url.search}`);
}

async function renderOps(
  context: APIContext,
  next: MiddlewareNext,
  internalPath: string,
  publicPath: string,
): Promise<Response> {
  context.locals.adminPath = publicPath;
  if (context.url.pathname === internalPath) return next();
  return context.rewrite(`${internalPath}${context.url.search}`);
}

async function handleAdminHost(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const route = classifyAdminPath(context.url.pathname);

  if (route.kind === 'redirect') {
    return context.redirect(route.to);
  }

  if (route.kind === 'customer') {
    return redirectToPublic(context);
  }

  if (route.kind === 'foreign-api') {
    return json({ error: 'Não encontrado' }, 404);
  }

  const session = await readSession(context);

  if (route.kind === 'ops-api') {
    if (session === 'unavailable') return json({ error: 'Não foi possível validar a sessão' }, 503);
    if (session !== 'ok') return json({ error: 'Não autorizado' }, 401);
    const role = await staffRole(context);
    if (role === 'error') return json({ error: 'Não foi possível validar a permissão' }, 503);
    if (role !== 'admin') return json({ error: 'Acesso restrito à equipe' }, 403);
    return next();
  }

  if (route.kind === 'public') {
    if (session === 'ok') {
      const role = await staffRole(context);
      if (role === 'admin' && route.publicPath === '/login') {
        return context.redirect(safeOpsRedirect(context.url.searchParams.get('redirect')));
      }
      if (role === 'admin' && route.publicPath === '/sem-permissao') {
        return context.redirect('/');
      }
    }
    return renderOps(context, next, route.internalPath, route.publicPath);
  }

  if (session === 'unavailable') {
    return new Response('Não foi possível validar a sessão.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  if (session === 'foreign') {
    return context.redirect('/login?msg=sem-acesso');
  }

  if (session !== 'ok') {
    return loginRedirect(context, route.publicPath);
  }

  const role = await staffRole(context);
  if (role === 'error') {
    return new Response('Não foi possível validar a permissão.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  if (role !== 'admin') {
    return context.redirect('/sem-permissao');
  }

  return renderOps(context, next, route.internalPath, route.publicPath);
}

async function handlePublicHost(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const { pathname } = context.url;

  if (pathname === '/ops' || pathname.startsWith('/ops/')) {
    return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  if (pathname === '/api/ops' || pathname.startsWith('/api/ops/')) {
    return json({ error: 'Host não autorizado' }, 403);
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const opsUrl = adminOpsUrl();
    if (opsUrl) return Response.redirect(`${opsUrl}/`, 302);
    return Response.redirect('https://hq.studiomlk.com.br', 302);
  }

  const accessToken =
    context.cookies.get(AUTH_ACCESS_COOKIE)?.value ??
    context.cookies.get(LEGACY_ACCESS_COOKIE)?.value;

  if (!accessToken) {
    if (pathname.startsWith('/app')) {
      return context.redirect('/auth/login?redirect=' + encodeURIComponent(pathname));
    }
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      clearAuthCookies(context);
      if (pathname.startsWith('/app')) {
        return context.redirect('/auth/login');
      }
      return next();
    }

    const apps = user.app_metadata?.apps as string[] | undefined;
    if (apps !== undefined && !apps.includes('nome_magnetico')) {
      clearAuthCookies(context);
      if (pathname.startsWith('/app')) {
        return context.redirect('/auth/login?msg=sem-acesso');
      }
      return next();
    }

    context.locals.user = user;
    context.locals.accessToken = accessToken;
  } catch {
    if (pathname.startsWith('/app')) {
      return context.redirect('/auth/login');
    }
  }

  return next();
}

async function handle(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const { pathname } = context.url;

  const isAsset =
    pathname.startsWith('/_astro/') ||
    pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2)$/);

  if (isAsset) {
    return next();
  }

  if (isAdminHost(requestHostname(context.request))) {
    return handleAdminHost(context, next);
  }

  return handlePublicHost(context, next);
}

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    return await handle(context, next);
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
});
