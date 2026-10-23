import { supabase } from '../db/supabase';
import type { ProductType } from '../../shared/product-labels';
import {
  FALLBACK_PRODUCT_PRICES,
  type ProductPriceRow,
  computeEffectivePricePure,
  discountedCentsViolatesFloor,
  effectiveFinalBelowFloor,
} from './effective-price';
import { OpsRegistryError } from '../ops/registry';
import { memoize, invalidateProductPricesCache } from '../cache/memo';

const PRODUCT_PRICES_TTL_MS = 5 * 60 * 1000; // 5 minutos em memória (DEV-212)

const COLUMNS = 'product_type, base_cents, min_cents, label, is_active, updated_at, updated_by';

/** Erros de leitura em que tratamos como catálogo vazio (fallback 98/80/125). */
function isBenignProductPricesReadError(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? '';
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST116') return true;
  const msg = (error.message ?? '').toLowerCase();
  return msg.includes('product_prices') && (msg.includes('does not exist') || msg.includes('could not find'));
}

export async function fetchProductPriceRows(): Promise<ProductPriceRow[]> {
  return memoize('product_prices:rows', PRODUCT_PRICES_TTL_MS, async () => {
    try {
      const { data, error } = await supabase.from('product_prices').select(COLUMNS).eq('is_active', true);
      if (error) {
        if (isBenignProductPricesReadError(error)) return [];
        console.warn('[product_prices] leitura falhou — usando fallback estático:', error.message ?? error.code);
        return [];
      }
      return (data ?? []) as ProductPriceRow[];
    } catch (err) {
      console.warn('[product_prices] leitura falhou — usando fallback estático:', err);
      return [];
    }
  });
}

export async function fetchProductPriceMap(): Promise<Map<ProductType, ProductPriceRow>> {
  const rows = await fetchProductPriceRows();
  const map = new Map<ProductType, ProductPriceRow>();
  for (const row of rows) {
    map.set(row.product_type, row);
  }
  return map;
}

export function fallbackRow(productType: ProductType): ProductPriceRow {
  const fb = FALLBACK_PRODUCT_PRICES[productType];
  return {
    product_type: productType,
    base_cents: fb.baseCents,
    min_cents: fb.minCents,
    label: fb.label,
    is_active: true,
  };
}

export interface UpdateProductPriceInput {
  productType: ProductType;
  baseCents: number;
  minCents: number;
  actorId: string;
}

export async function updateProductPrice(input: UpdateProductPriceInput): Promise<ProductPriceRow> {
  if (input.minCents <= 0 || input.baseCents <= 0) {
    throw new OpsRegistryError(409, 'Preços devem ser maiores que zero.');
  }
  if (input.minCents > input.baseCents) {
    throw new OpsRegistryError(409, 'O piso não pode ser maior que o preço base.');
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('product_prices')
    .update({
      base_cents: input.baseCents,
      min_cents: input.minCents,
      updated_at: now,
      updated_by: input.actorId,
    })
    .eq('product_type', input.productType)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') {
      throw new OpsRegistryError(503, 'Tabela product_prices ainda não aplicada no banco.');
    }
    throw error;
  }
  if (!data) throw new OpsRegistryError(404, 'Produto não encontrado');

  await supabase.from('product_price_history').insert({
    product_type: input.productType,
    base_cents: input.baseCents,
    min_cents: input.minCents,
    changed_by: input.actorId,
  });

  invalidateProductPricesCache();
  return data as ProductPriceRow;
}

export interface PriceHistoryRow {
  id: string;
  product_type: ProductType;
  base_cents: number;
  min_cents: number;
  changed_at: string;
  changed_by: string | null;
}

export async function listProductPriceHistory(productType: ProductType, limit = 20): Promise<PriceHistoryRow[]> {
  const { data, error } = await supabase
    .from('product_price_history')
    .select('id, product_type, base_cents, min_cents, changed_at, changed_by')
    .eq('product_type', productType)
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return (data ?? []) as PriceHistoryRow[];
}

export function assertPromotionRespectsFloors(
  productTypes: ProductType[],
  priceMap: Map<ProductType, ProductPriceRow>,
  discountType: 'percent' | 'fixed',
  discountValue: number,
): void {
  for (const productType of productTypes) {
    const row = priceMap.get(productType) ?? fallbackRow(productType);
    if (
      discountedCentsViolatesFloor(row.base_cents, row.min_cents, discountType, discountValue)
    ) {
      throw new OpsRegistryError(
        409,
        `A promoção deixaria ${row.label} abaixo do piso (mín. ${row.min_cents / 100} BRL). Ajuste o desconto ou o piso.`,
      );
    }
  }
}

export function previewPromotionOnProduct(
  productType: ProductType,
  priceMap: Map<ProductType, ProductPriceRow>,
  discountType: 'percent' | 'fixed',
  discountValue: number,
) {
  const row = priceMap.get(productType) ?? fallbackRow(productType);
  const promoLike = {
    id: 'preview',
    name: 'Pré-visualização',
    bannerText: null,
    productType,
    discountType,
    discountValue: discountType === 'fixed' ? discountValue / 100 : discountValue,
    endDate: new Date(Date.now() + 86400000).toISOString(),
    stripeCouponId: null,
    stripePromoCode: null,
  } as const;

  return computeEffectivePricePure({
    productType,
    productRow: row,
    promotion: promoLike,
  });
}

export { effectiveFinalBelowFloor };
