import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../backend/db/supabase';
import { z } from 'zod';
import { isDisposableEmail } from '../../../backend/security/disposableEmail';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  produto: z.string().optional(),
  redirect: z.string().optional(),
  birth_name: z.string().min(2).max(150).optional(),
  birth_date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
});

const APP_ID = 'nome_magnetico';

/**
 * POST /api/auth/register
 *
 * Cria a conta e dispara o e-mail de confirmação padrão do Supabase.
 * Retorna session como null para que o formulário exiba a tela de verificação de e-mail.
 */
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body inválido' }, 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? 'Dados inválidos';
    return json({ error: msg }, 400);
  }

  const { nome, email, password, birth_name, birth_date } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  if (isDisposableEmail(normalizedEmail)) {
    return json({
      error: 'Use um email permanente para criar sua conta e receber seu acesso.',
    }, 400);
  }

  // Pré-check: email já existe? (service role bypassa RLS — pega confirmados, pendentes e admins)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingProfile) {
    return json({ error: 'already_registered' }, 400);
  }

  // Cliente anon — necessário para signUp() que aciona o email de confirmação.
  const supabaseUrl = process.env.SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[register] env vars ausentes:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
    return json({ error: 'Configuração do servidor inválida' }, 500);
  }

  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Chamada ao signUp padrão (dispara email de confirmação e mantém conta pendente)
  const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { nome },
      emailRedirectTo: `${process.env.APP_URL}/auth/confirmar-email`,
    },
  });

  if (signUpError) {
    console.error('[register] erro ao cadastrar usuario:', signUpError.message);
    const msg = signUpError.message?.includes('already been registered') ||
      signUpError.message?.includes('already registered') ||
      signUpError.message?.includes('User already registered')
      ? 'already_registered'
      : signUpError.message;
    return json({ error: msg }, 400);
  }

  const createdUser = signUpData?.user;
  if (!createdUser) {
    return json({ error: 'Não foi possível criar a conta. Tente novamente.' }, 500);
  }

  // Detecta se o usuário já existe na tabela auth.users do Supabase
  // (Em caso de e-mail existente, o Supabase retorna um usuário mockado com id aleatório e sem identidades)
  if (createdUser.identities && createdUser.identities.length === 0) {
    return json({ error: 'already_registered' }, 400);
  }

  console.log('[register] usuário cadastrado (pendente confirmação):', {
    id: createdUser.id,
    email: createdUser.email,
  });

  // 1. Taggear app_metadata para o Nome Magnético via service role
  const { error: adminUpdateError } = await supabase.auth.admin.updateUserById(createdUser.id, {
    app_metadata: { apps: [APP_ID] },
  });
  if (adminUpdateError) {
    console.error('[register] falha ao atualizar app_metadata:', adminUpdateError.message);
  }

  // 2. Garantir que o perfil foi criado corretamente via ensure_profile
  const { error: profileError } = await supabase.rpc('ensure_profile', {
    p_user_id: createdUser.id,
    p_email: normalizedEmail,
    p_nome: nome,
  });
  if (profileError) {
    console.error('[register] falha ao garantir profile:', profileError.message);
  }

  // 3. Salvar dados de nascimento no perfil se fornecidos
  if (birth_name && birth_date) {
    const parts = birth_date.split('/');
    const birthDateDb = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : birth_date;
    const { error: birthProfileError } = await supabase
      .from('profiles')
      .update({
        birth_name: birth_name.trim(),
        birth_date: birthDateDb,
        updated_at: new Date().toISOString(),
      })
      .eq('id', createdUser.id);

    if (birthProfileError) {
      console.error('[register] falha ao salvar dados de nascimento:', birthProfileError.message);
    }
  }

  // Retornar session como null. O SignupForm no frontend lidará com isso
  // exibindo a tela solicitando a verificação de e-mail.
  return json({
    success: true,
    session: null,
  }, 200);
};

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
