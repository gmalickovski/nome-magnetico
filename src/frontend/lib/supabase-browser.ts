import { createClient } from '@supabase/supabase-js';
import { createSupabaseAuthStorage } from '../../utils/browser-storage';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('PUBLIC_SUPABASE_URL e PUBLIC_SUPABASE_ANON_KEY são obrigatórios');
}

/**
 * Cliente Supabase para o browser (client-side).
 * Usa apenas a anon key — RLS protege os dados.
 * Usar apenas em src/frontend/.
 */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: createSupabaseAuthStorage(),
    // storageKey isolado para evitar colisão de sessão com outros apps
    // que rodem na mesma instância Supabase (ex: Sincro em localhost)
    storageKey: 'nome-magnetico-auth',
  },
});

export type SupabaseBrowserClient = typeof supabaseBrowser;
