import type { APIRoute } from 'astro';
import { supabase, createUserClient } from '../../../backend/db/supabase';
import { syncVerifiedEmailMarker } from '../../../backend/auth/confirmEmail';
import type { User } from '@supabase/supabase-js';

const TAG = '[ensure-profile]';

/**
 * POST /api/auth/ensure-profile
 *
 * Garante que o usuário autenticado tenha um perfil em nome_magnetico.profiles.
 * Necessário para usuários que já existem em auth.users via outro app
 * (ex: Sincro) mas ainda não têm perfil neste app.
 *
 * Aceita autenticação via:
 *  1. Header Authorization: Bearer <access_token>  ← browser (localStorage session)
 *  2. locals.user injetado pelo middleware          ← SSR com cookie
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Tentar extrair token do header Authorization (browser envia isso)
  const authHeader = request.headers.get('Authorization');
  const headerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  console.log(`${TAG} auth via header=${!!headerToken} | auth via locals=${!!locals.user}`);

  let userId: string;
  let userEmail: string;
  let userNome: string | null = null;
  let authUser: User | null = null;

  if (headerToken) {
    // Verificar token com o cliente autenticado
    const userClient = createUserClient(headerToken);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error(`${TAG} token inválido:`, authError?.message);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    authUser = user;
    userId = user.id;
    userEmail = user.email ?? '';
    userNome = user.user_metadata?.nome ?? null;
    console.log(`${TAG} usuário autenticado via header: ${userEmail} (${userId})`);
  } else if (locals.user) {
    authUser = locals.user;
    userId = locals.user.id;
    userEmail = locals.user.email ?? '';
    userNome = locals.user.user_metadata?.nome ?? null;
    console.log(`${TAG} usuário autenticado via locals: ${userEmail} (${userId})`);
  } else {
    console.warn(`${TAG} requisição sem autenticação — 401`);
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verificar se perfil já existe antes do upsert (para log)
    const { data: existing } = await supabase
      
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    console.log(`${TAG} perfil existente: ${!!existing}`);

    // Chamar função ensure_profile via service role (bypassa RLS)
    const { error: rpcError } = await supabase
      
      .rpc('ensure_profile', {
        p_user_id: userId,
        p_email: userEmail,
        p_nome: userNome,
      });

    if (rpcError) {
      console.error(`${TAG} erro no rpc ensure_profile:`, rpcError.message);
      throw rpcError;
    }

    // Buscar perfil criado/existente
    const { data: profile, error: selectError } = await supabase
      
      .from('profiles')
      .select('id, email, nome, role, app_source')
      .eq('id', userId)
      .single();

    if (selectError) {
      console.error(`${TAG} erro ao buscar perfil:`, selectError.message);
      throw selectError;
    }

    console.log(`${TAG} perfil garantido:`, JSON.stringify(profile));

    if (authUser?.email_confirmed_at) {
      const sync = await syncVerifiedEmailMarker(userId);
      if (!sync.ok && sync.status !== 409) {
        console.warn(`${TAG} sync email marker:`, sync.error);
      }
    }

    return new Response(JSON.stringify({ profile, created: !existing }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao garantir perfil';
    console.error(`${TAG} erro inesperado:`, message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
