import type { APIContext, MiddlewareNext } from 'astro';
import * as Sentry from '@sentry/astro';
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './backend/db/supabase';
import '../sentry.server.config';

async function handle(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const { pathname } = context.url;

  // Fast-path para assets estáticos para não bater no Supabase
  const isAsset =
    pathname.startsWith('/_astro/') ||
    pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2)$/);

  if (isAsset) {
    return next();
  }

  // Verificar sessão para rotas protegidas
  // Cookie nomeado com o storageKey isolado do app (evita colisão com outros
  // apps na mesma instância Supabase, ex: Sincro em localhost).
  // O storageKey 'nome-magnetico-auth' é configurado em supabase-browser.ts.
  const accessToken =
    context.cookies.get('nome-magnetico-auth-access-token')?.value ??
    context.cookies.get('sb-access-token')?.value;
  const refreshToken =
    context.cookies.get('nome-magnetico-auth-refresh-token')?.value ??
    context.cookies.get('sb-refresh-token')?.value;

  // Rotas /admin/* redirecionam para o HQ StudioMLK
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
