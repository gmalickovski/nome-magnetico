import type { AstroCookies } from 'astro';
import type { User } from '@supabase/supabase-js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../db/supabase';
import { isAdmin } from '../db/users';
import { opsCookieSecure } from './host';

export const OPS_ACCESS_COOKIE = 'nm-ops-access-token';
export const OPS_REFRESH_COOKIE = 'nm-ops-refresh-token';

const ACCESS_MAX_AGE_FALLBACK = 60 * 60;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export type OpsSession =
  | { status: 'anonymous' }
  | { status: 'invalid' }
  | { status: 'forbidden' }
  | {
      status: 'admin';
      user: User;
      accessToken: string;
      refreshed: boolean;
      refreshToken: string | null;
      expiresIn: number;
    };

let authClient: SupabaseClient | null = null;

/** Cliente anon só para senha e refresh. A service role continua em db/supabase.ts. */
export function getOpsAuthClient(): SupabaseClient {
  if (authClient) return authClient;
  const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL e PUBLIC_SUPABASE_ANON_KEY são obrigatórios para o login staff');
  }
  authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return authClient;
}

function cookieBase(url: URL, request: Request) {
  return {
    httpOnly: true,
    secure: opsCookieSecure(url, request),
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function setOpsSession(
  cookies: AstroCookies,
  url: URL,
  request: Request,
  tokens: { accessToken: string; refreshToken: string; expiresIn?: number },
) {
  const base = cookieBase(url, request);
  cookies.set(OPS_ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: tokens.expiresIn && tokens.expiresIn > 0 ? tokens.expiresIn : ACCESS_MAX_AGE_FALLBACK,
  });
  cookies.set(OPS_REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearOpsSession(cookies: AstroCookies, url: URL, request: Request) {
  const base = cookieBase(url, request);
  cookies.delete(OPS_ACCESS_COOKIE, base);
  cookies.delete(OPS_REFRESH_COOKIE, base);
}

function belongsToNomeMagnetico(user: User): boolean {
  const apps = user.app_metadata?.apps as string[] | undefined;
  if (apps === undefined) return true;
  return apps.includes('nome_magnetico');
}

async function acceptAdmin(user: User, accessToken: string, refreshed: boolean, refreshToken: string | null, expiresIn: number): Promise<OpsSession> {
  if (!belongsToNomeMagnetico(user)) return { status: 'forbidden' };
  const admin = await isAdmin(user.id);
  if (!admin) return { status: 'forbidden' };
  return {
    status: 'admin',
    user,
    accessToken,
    refreshed,
    refreshToken,
    expiresIn,
  };
}

/**
 * Lê os cookies do painel staff e confirma profiles.role = admin.
 * Não aceita o cookie da área do cliente.
 */
export async function readOpsSession(cookies: AstroCookies): Promise<OpsSession> {
  const accessToken = cookies.get(OPS_ACCESS_COOKIE)?.value;
  const refreshToken = cookies.get(OPS_REFRESH_COOKIE)?.value;
  if (!accessToken && !refreshToken) return { status: 'anonymous' };

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) {
      return acceptAdmin(data.user, accessToken, false, null, ACCESS_MAX_AGE_FALLBACK);
    }
  }

  if (!refreshToken) return { status: 'invalid' };

  const { data, error } = await getOpsAuthClient().auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session || !data.user) return { status: 'invalid' };

  return acceptAdmin(
    data.user,
    data.session.access_token,
    true,
    data.session.refresh_token,
    data.session.expires_in ?? ACCESS_MAX_AGE_FALLBACK,
  );
}
