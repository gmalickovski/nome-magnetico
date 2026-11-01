import { AUTH_ACCESS_COOKIE } from '../../shared/auth-cookies';
import { writeAuthCookies } from './auth-cookies.js';
import { supabaseBrowser } from './supabase-browser.js';

/** Lê o access token do cookie HTTP (mesmo nome que o middleware Astro). */
export function readAccessTokenFromDocumentCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${AUTH_ACCESS_COOKIE}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

/**
 * Token para chamadas `/api/*` autenticadas.
 * Ordem: sessão Supabase (com refresh se vazia) → cookie HTTP → null.
 * Sincroniza cookies HTTP quando há sessão no browser (auto-refresh não atualizava cookie).
 */
export async function resolveAuthAccessToken(): Promise<string | null> {
  let { data: sessionData } = await supabaseBrowser.auth.getSession();
  let session = sessionData.session;

  if (!session?.access_token) {
    const refreshed = await supabaseBrowser.auth.refreshSession();
    session = refreshed.data.session ?? null;
  }

  const token = session?.access_token ?? readAccessTokenFromDocumentCookie();
  if (!token) return null;

  if (session?.access_token && session.refresh_token) {
    writeAuthCookies(session.access_token, session.refresh_token);
  }

  return token;
}

/** fetch com cookie de sessão + Bearer (fallback quando cookie HTTP expirou). */
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? undefined);
  const token = await resolveAuthAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? 'include',
  });
}
