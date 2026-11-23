import { supabase } from './supabase';

const TABLE = 'stripe_chargeback_deliveries';

export async function claimChargebackDelivery(disputeId: string, leaseToken: string) {
  const { data, error } = await supabase.rpc('claim_stripe_chargeback_delivery', {
    p_dispute_id: disputeId,
    p_lease_token: leaseToken,
  });
  if (error || (data !== 'claimed' && data !== 'sent' && data !== 'busy')) {
    throw new Error('payment.chargeback_claim_failed', { cause: error });
  }
  return data;
}

export async function markChargebackDelivered(disputeId: string, leaseToken: string) {
  const { data, error } = await supabase.from(TABLE)
    .update({ sent_at: new Date().toISOString() })
    .eq('dispute_id', disputeId)
    .eq('lease_token', leaseToken)
    .is('sent_at', null)
    .select('dispute_id')
    .maybeSingle();
  if (error || !data) throw new Error('payment.chargeback_mark_failed', { cause: error });
}

export async function releaseChargebackDelivery(disputeId: string, leaseToken: string) {
  const { error } = await supabase.from(TABLE)
    .delete()
    .eq('dispute_id', disputeId)
    .eq('lease_token', leaseToken)
    .is('sent_at', null);
  if (error) throw new Error('payment.chargeback_release_failed', { cause: error });
}
