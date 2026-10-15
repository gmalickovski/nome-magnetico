import { supabase } from '../db/supabase';
import { selectActivePromotion, toActivePromotion, type PromotionRow, type ActivePromotion } from '../payments/promo-math';

const PROMOTION_COLUMNS =
  'id, name, product_types, discount_type, discount_value, starts_at, ends_at, is_active, banner_text, stripe_coupon_id, stripe_promo_code, created_at';

export async function fetchActivePromotionRow(now = new Date()): Promise<PromotionRow | null> {
  const ts = now.toISOString();
  const { data, error } = await supabase
    .from('promotions')
    .select(PROMOTION_COLUMNS)
    .eq('is_active', true)
    .lte('starts_at', ts)
    .gte('ends_at', ts)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as PromotionRow | null) ?? null;
}

export async function fetchActivePromotion(now = new Date()): Promise<ActivePromotion | null> {
  const row = await fetchActivePromotionRow(now);
  return row ? toActivePromotion(row) : null;
}

export async function fetchAllPromotionRowsForSelect(): Promise<PromotionRow[]> {
  const { data, error } = await supabase.from('promotions').select(PROMOTION_COLUMNS).eq('is_active', true);
  if (error) throw error;
  return (data ?? []) as PromotionRow[];
}

export function pickActivePromotion(rows: PromotionRow[], now = new Date()): ActivePromotion | null {
  const row = selectActivePromotion(rows, now);
  return row ? toActivePromotion(row) : null;
}
