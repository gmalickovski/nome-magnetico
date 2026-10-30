import { supabase } from '../db/supabase';
import {
  selectActivePromotion,
  toActivePromotion,
  type PromotionRow,
  type ActivePromotion,
} from '../payments/promo-math';
import { memoize } from '../cache/memo';

const PROMOTIONS_TTL_MS = 5 * 60 * 1000; // 5 minutos em memória
const PROMOTIONS_ERROR_TTL_MS = 30 * 1000; // 30 segundos em caso de falha/timeout (HOTFIX)

const PROMOTION_COLUMNS =
  'id, name, product_types, discount_type, discount_value, starts_at, ends_at, is_active, banner_text, stripe_coupon_id, stripe_promo_code, created_at';

export async function fetchActivePromotionRow(now = new Date()): Promise<PromotionRow | null> {
  const ts = now.toISOString();
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select(PROMOTION_COLUMNS)
      .eq('is_active', true)
      .lte('starts_at', ts)
      .gte('ends_at', ts)
      .order('created_at', { ascending: false })
      .limit(1)
      .abortSignal(AbortSignal.timeout(2000))
      .maybeSingle();

    if (error) {
      console.warn('[promotions] leitura de promoção ativa falhou — fallback null:', error.message ?? error.code);
      return null;
    }
    return (data as PromotionRow | null) ?? null;
  } catch (err) {
    console.warn('[promotions] timeout/erro na leitura de promoção ativa — fallback null:', err);
    return null;
  }
}

export async function fetchActivePromotion(now = new Date()): Promise<ActivePromotion | null> {
  const row = await fetchActivePromotionRow(now);
  return row ? toActivePromotion(row) : null;
}

export async function fetchAllPromotionRowsForSelect(): Promise<PromotionRow[]> {
  return memoize(
    'promotions:all_active',
    (rows) => (!rows || rows.length === 0 ? PROMOTIONS_ERROR_TTL_MS : PROMOTIONS_TTL_MS),
    async () => {
      try {
        const { data, error } = await supabase
          .from('promotions')
          .select(PROMOTION_COLUMNS)
          .eq('is_active', true)
          .abortSignal(AbortSignal.timeout(2000));
        if (error) {
          console.warn('[promotions] leitura de promoções falhou — usando fallback (sem promoção):', error.message ?? error.code);
          return [];
        }
        return (data ?? []) as PromotionRow[];
      } catch (err) {
        console.warn('[promotions] timeout/erro na leitura de promoções — usando fallback (sem promoção):', err);
        return [];
      }
    },
  );
}

export function pickActivePromotion(rows: PromotionRow[], now = new Date()): ActivePromotion | null {
  const row = selectActivePromotion(rows, now);
  return row ? toActivePromotion(row) : null;
}
