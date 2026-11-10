import { supabase } from './supabase';

/**
 * Reserva o envio de recuperação de carrinho (uma vez por usuário e produto).
 * Falha no insert (exceto duplicata) → fail closed (não emite cart.abandoned).
 */
export async function claimCartRecoverySend(userId: string, productType: string): Promise<boolean> {
  const normalizedUserId = userId.trim();
  const normalizedProduct = productType.trim();
  if (!normalizedUserId || !normalizedProduct) {
    return false;
  }

  const { error } = await supabase.from('cart_recovery_sends').insert({
    user_id: normalizedUserId,
    product_type: normalizedProduct,
  });

  if (!error) {
    return true;
  }

  if (error.code === '23505') {
    return false;
  }

  console.error(
    JSON.stringify({
      scope: 'cart_recovery_sends',
      action: 'claim_failed',
      code: error.code,
    }),
  );
  return false;
}
