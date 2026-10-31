import { supabaseBrowser } from './supabase-browser.js';

/** fetch com cookie de sessão + Bearer do Supabase (fallback quando o cookie HTTP expirou). */
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? undefined);
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? 'include',
  });
}
