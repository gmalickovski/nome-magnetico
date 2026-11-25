import { supabase } from '../db/supabase';
import type { ProductType } from '../../shared/product-labels';

export async function reserveCouponUse(params: {
  reservationId: string;
  accessCodeId: string;
  userId: string;
  userEmail?: string | null;
  productType: ProductType;
}): Promise<string | null> {
  const { data, error } = await supabase.rpc('reserve_access_coupon', {
    p_reservation_id: params.reservationId,
    p_code_id: params.accessCodeId,
    p_user_id: params.userId,
    p_user_email: params.userEmail ?? null,
    p_product_type: params.productType,
  });
  if (error) throw error;
  return data as string | null;
}

export async function confirmCouponReservation(reservationId: string, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('access_code_uses')
    .update({ source: 'webhook', stripe_session_id: sessionId, used_at: new Date().toISOString() })
    .eq('id', reservationId)
    .eq('source', 'reserved');
  if (error) throw error;
}

export async function releaseCouponReservation(reservationId: string): Promise<void> {
  const { error } = await supabase
    .from('access_code_uses')
    .delete()
    .eq('id', reservationId)
    .eq('source', 'reserved');
  if (error) throw error;
}
