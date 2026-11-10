import { supabase } from './supabase';
import { captureFluxoException } from '../../sentry/fluxo';

export type CartRecoveryClaimResult = 'claimed' | 'duplicate' | 'error';

/**
 * Reserva o envio de recuperação de carrinho (uma vez por usuário e produto).
 * Falha no insert (exceto duplicata) → fail closed (não emite cart.abandoned).
 */
export async function claimCartRecoverySend(
  userId: string,
  productType: string,
): Promise<CartRecoveryClaimResult> {
  const normalizedUserId = userId.trim();
  const normalizedProduct = productType.trim();
  if (!normalizedUserId || !normalizedProduct) {
    return 'error';
  }

  const { error } = await supabase.from('cart_recovery_sends').insert({
    user_id: normalizedUserId,
    product_type: normalizedProduct,
  });

  if (!error) {
    return 'claimed';
  }

  if (error.code === '23505') {
    return 'duplicate';
  }

  console.error(
    JSON.stringify({
      scope: 'cart_recovery_sends',
      action: 'claim_failed',
      code: error.code,
    }),
  );
  captureFluxoException('stripe_webhook', new Error('cart_recovery_claim_failed'), {
    code: error.code ?? 'unknown',
  });
  return 'error';
}

export async function releaseCartRecoverySend(userId: string, productType: string): Promise<void> {
  const normalizedUserId = userId.trim();
  const normalizedProduct = productType.trim();
  if (!normalizedUserId || !normalizedProduct) {
    return;
  }

  const { error } = await supabase
    .from('cart_recovery_sends')
    .delete()
    .eq('user_id', normalizedUserId)
    .eq('product_type', normalizedProduct);

  if (error) {
    console.error(
      JSON.stringify({
        scope: 'cart_recovery_sends',
        action: 'release_failed',
        code: error.code,
      }),
    );
  }
}
