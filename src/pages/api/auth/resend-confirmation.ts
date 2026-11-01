import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ locals, request }) => {
  const user = (locals as any).user;
  if (!user?.email) {
    return json({ error: 'Autenticação necessária' }, 401);
  }

  const supabaseUrl = process.env.SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Configuração do servidor inválida' }, 500);
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:4321';
  const emailRedirectTo = new URL('/auth/confirmar-email', appUrl).toString();

  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabaseAnon.auth.resend({
    type: 'signup',
    email: user.email,
    options: { emailRedirectTo },
  });

  if (error) {
    console.error('[resend-confirmation]', error.message);
    return json({ error: 'Não foi possível reenviar agora. Tente novamente em alguns minutos.' }, 400);
  }

  return json({ success: true });
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
