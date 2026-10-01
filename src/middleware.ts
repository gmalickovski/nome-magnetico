import type { APIContext, MiddlewareNext } from 'astro';
import * as Sentry from '@sentry/astro';
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './backend/db/supabase';
import {
  OPS_REWRITE_HEADER,
  cleanPathToInternal,
  isLocalOpsDev,
  isOpsHost,
  isOpsPath,
  opsHref,
  requestHost,
  stripTrailingSlash,
} from './backend/ops/host';
import { clearOpsSession, readOpsSession, setOpsSession } from './backend/ops/session';
import '../sentry.server.config';

const OPS_PUBLIC_PATHS = new Set([
  '/ops/login',
  '/api/ops/auth/login',
  '/api/ops/auth/logout',
]);

function isAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_astro/') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.png' ||
    /\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|webp)$/.test(pathname)
  );
}

function notFound(): Response {
  return new Response('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function opsJson(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function withOpsHeaders(response: Response): Response {
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

function rewriteOps(context: APIContext, pathname: string): Promise<Response> {
  const url = new URL(context.url);
  url.pathname = pathname;
  const headers = new Headers(context.request.headers);
  headers.set(OPS_REWRITE_HEADER, '1');
  return context.rewrite(new Request(url, { method: 'GET', headers }));
}

async function guardOpsRoute(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const pathname = stripTrailingSlash(context.url.pathname);
  const host = requestHost(context.request, context.url);
  const isPublic = OPS_PUBLIC_PATHS.has(pathname);
  const session = await readOpsSession(context.cookies);

  if (session.status === 'admin') {
    if (session.refreshed && session.refreshToken) {
      setOpsSession(context.cookies, context.url, context.request, {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: session.expiresIn,
      });
    }
    context.locals.user = session.user;
    context.locals.accessToken = session.accessToken;
    context.locals.opsAdmin = true;

    if (pathname === '/ops/login') {
      return context.redirect(opsHref(host, '/'));
    }

    return withOpsHeaders(await next());
  }

  if (session.status === 'forbidden' || session.status === 'invalid') {
    clearOpsSession(context.cookies, context.url, context.request);
  }

  if (isPublic) {
    return withOpsHeaders(await next());
  }

  if (pathname.startsWith('/api/')) {
    return opsJson({ error: 'Não autorizado' }, 401);
  }

  const login = new URL(opsHref(host, '/login'), context.url);
  if (session.status === 'forbidden') login.searchParams.set('msg', 'sem-permissao');
  else if (session.status === 'invalid') login.searchParams.set('msg', 'sessao-expirada');
  return context.redirect(`${login.pathname}${login.search}`);
}

async function handleOpsHost(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const pathname = stripTrailingSlash(context.url.pathname);

  // /ops/* no host admin também responde. Não redireciona para a URL curta:
  // o rewrite reentra no middleware e um redirect aqui viraria loop.
  if (pathname.startsWith('/api/ops') || isOpsPath(pathname)) {
    return guardOpsRoute(context, next);
  }

  if (pathname.startsWith('/api/')) {
    return notFound();
  }

  const internal = cleanPathToInternal(pathname);
  if (internal) {
    return rewriteOps(context, internal);
  }

  return notFound();
}

async function handle(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const { pathname } = context.url;
  const host = requestHost(context.request, context.url);

  // Fast-path para assets estáticos para não bater no Supabase
  if (isAsset(pathname)) {
    return next();
  }

  context.locals.opsAdmin = false;

  // Rewrite interno do host admin: a segunda passagem só autoriza a rota /ops.
  if (context.request.headers.get(OPS_REWRITE_HEADER) === '1') {
    return guardOpsRoute(context, next);
  }

  if (isOpsHost(host)) {
    return handleOpsHost(context, next);
  }

  // /ops e /api/ops ficam fora do domínio público. Localhost em dev é a exceção.
  if (isOpsPath(pathname)) {
    if (isLocalOpsDev(host)) {
      return guardOpsRoute(context, next);
    }
    return notFound();
  }

  // Cookie nomeado com o storageKey isolado do app (evita colisão com outros
  // apps na mesma instância Supabase, ex: Sincro em localhost).
  // O storageKey 'nome-magnetico-auth' é configurado em supabase-browser.ts.
  const accessToken =
    context.cookies.get('nome-magnetico-auth-access-token')?.value ??
    context.cookies.get('sb-access-token')?.value;
  const refreshToken =
    context.cookies.get('nome-magnetico-auth-refresh-token')?.value ??
    context.cookies.get('sb-refresh-token')?.value;

  // Rotas /admin/* redirecionam para o HQ StudioMLK no domínio público.
  // O painel staff novo vive em admin.nomemagnetico.com.br, não em /admin.
  if (pathname.startsWith('/admin')) {
    return Response.redirect('https://hq.studiomlk.com.br', 302);
  }

  if (!accessToken) {
    if (pathname.startsWith('/app')) {
      return context.redirect('/auth/login?redirect=' + encodeURIComponent(pathname));
    }
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      // Token inválido — limpar cookies e redirecionar
      context.cookies.delete('nome-magnetico-auth-access-token', { path: '/' });
      context.cookies.delete('nome-magnetico-auth-refresh-token', { path: '/' });
      context.cookies.delete('sb-access-token', { path: '/' });
      context.cookies.delete('sb-refresh-token', { path: '/' });

      if (pathname.startsWith('/app')) {
        return context.redirect('/auth/login');
      }
      return next();
    }

    // Verificar isolamento de app via app_metadata.apps
    // Bloqueia apenas usuários explicitamente taggeados para outros apps.
    // Usuários sem a chave 'apps' (criados antes do sistema de tags) passam.
    const apps = user.app_metadata?.apps as string[] | undefined;
    if (apps !== undefined && !apps.includes('nome_magnetico')) {
      context.cookies.delete('nome-magnetico-auth-access-token', { path: '/' });
      context.cookies.delete('nome-magnetico-auth-refresh-token', { path: '/' });
      context.cookies.delete('sb-access-token', { path: '/' });
      context.cookies.delete('sb-refresh-token', { path: '/' });
      if (pathname.startsWith('/app')) {
        return context.redirect('/auth/login?msg=sem-acesso');
      }
      return next();
    }

    // Injetar usuário no contexto
    context.locals.user = user;
    context.locals.accessToken = accessToken;
  } catch {
    if (pathname.startsWith('/app')) {
      return context.redirect('/auth/login');
    }
  }

  return next();
}

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    return await handle(context, next);
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
});
