import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readServerEnv } from '@/backend/env/runtime';

function resolveServiceCredentials(): { url: string; key: string } {
  const url = readServerEnv('SUPABASE_URL') ?? readServerEnv('PUBLIC_SUPABASE_URL');
  const key = readServerEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  }
  return { url, key };
}

function createServiceClient(): SupabaseClient {
  const { url, key } = resolveServiceCredentials();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let serviceClient: SupabaseClient | undefined;

/**
 * Cliente Supabase server-side com service role key.
 * Lê as credenciais em runtime (não no build). NUNCA importar no browser.
 * Usar apenas em src/backend/ ou pages/api/.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createServiceClient();
  }
  return serviceClient;
}

/**
 * Compatível com `import { supabase }`. O client só é criado na primeira
 * propriedade acessada, depois que `start.mjs` já carregou o `.env`.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    const client = getSupabaseAdmin();
    const value = Reflect.get(client, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Cria um cliente Supabase com o JWT do usuário para operações autenticadas
 * respeitando as políticas de RLS.
 */
export function createUserClient(accessToken: string) {
  const { url, key } = resolveServiceCredentials();
  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
