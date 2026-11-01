import { supabase } from '../db/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export type SyncEmailMarkerResult =
  | { ok: true; verifiedAt: string }
  | { ok: false; status: 404 | 409 | 500; error: string };

/**
 * Sincroniza o marcador de e-mail verificado (user_metadata e profiles)
 * confiando EXCLUSIVAMENTE em data.user.email_confirmed_at retornado pelo Supabase Auth.
 * Se o e-mail ainda não foi confirmado no Auth, recusa com 409 e nada altera.
 */
export async function syncVerifiedEmailMarker(
  userId: string,
  client: SupabaseClient = supabase
): Promise<SyncEmailMarkerResult> {
  if (!userId) {
    return { ok: false, status: 500, error: 'ID do usuário não fornecido.' };
  }

  const { data, error: fetchError } = await client.auth.admin.getUserById(userId);
  if (fetchError || !data?.user) {
    console.error('[sync-verified-email-marker] Falha ao buscar usuario:', fetchError?.message);
    return { ok: false, status: 500, error: 'Não foi possível validar o usuário.' };
  }

  const confirmedAt = data.user.email_confirmed_at;
  if (!confirmedAt) {
    return {
      ok: false,
      status: 409,
      error: 'E-mail ainda não confirmado no sistema de autenticação.',
    };
  }

  const verifiedAt = confirmedAt;

  const { error: authError } = await client.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...(data.user.user_metadata ?? {}),
      email_verified_at: verifiedAt,
    },
  });

  if (authError) {
    console.error('[sync-verified-email-marker] Falha ao atualizar metadata:', authError.message);
    return { ok: false, status: 500, error: 'Não foi possível registrar a confirmação.' };
  }

  const { error: profileError } = await client
    .from('profiles')
    .update({ email_verified_at: verifiedAt })
    .eq('id', userId)
    .is('email_verified_at', null);

  if (profileError) {
    console.warn('[sync-verified-email-marker] Profile marker skipped:', profileError.message);
  }

  return { ok: true, verifiedAt };
}

export function isAccountCreatedViaCheckout(user: {
  user_metadata?: Record<string, unknown> | null;
}): boolean {
  return user.user_metadata?.account_created_via_checkout === true;
}

/**
 * Após pagamento: sincroniza marcadores se o Auth já confirmou.
 * Só usa email_confirm admin quando a conta foi criada no fluxo de compra (cadastro → checkout).
 */
export async function confirmEmailAfterPayment(
  userId: string,
  client: SupabaseClient = supabase,
) {
  if (!userId) return;

  const { data, error: fetchError } = await client.auth.admin.getUserById(userId);
  if (fetchError) {
    console.error('[confirm-email-after-payment] Falha ao buscar usuario:', fetchError.message);
    return;
  }

  const authUser = data.user;
  if (!authUser) return;

  if (authUser.email_confirmed_at) {
    await syncVerifiedEmailMarker(userId, client);
    return;
  }

  if (!isAccountCreatedViaCheckout(authUser)) {
    return;
  }

  const { error: confirmError } = await client.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });

  if (confirmError) {
    console.error('[confirm-email-after-payment] Falha ao confirmar email (checkout):', confirmError.message);
    return;
  }

  await syncVerifiedEmailMarker(userId, client);
}
