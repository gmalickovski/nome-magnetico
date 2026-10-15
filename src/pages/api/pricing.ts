import type { APIRoute } from 'astro';
import { getCatalogPricing } from '../../backend/pricing/service';
import { pricingCacheControlHeader } from '../../backend/pricing/service';
import { SELLABLE_PRODUCT_TYPES } from '../../shared/product-labels';
import type { ProductType } from '../../backend/payments/stripe';

export const GET: APIRoute = async () => {
  try {
    const { prices, promotion } = await getCatalogPricing();
    const body = {
      updated_at: new Date().toISOString(),
      promotion: promotion
        ? {
            id: promotion.id,
            name: promotion.name,
            ends_at: promotion.endDate,
            product_types: promotion.productType?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
          }
        : null,
      products: Object.fromEntries(
        SELLABLE_PRODUCT_TYPES.map((productType: ProductType) => {
          const p = prices[productType];
          return [
            productType,
            {
              base_cents: p?.baseCents ?? p?.cents ?? 0,
              final_cents: p?.cents ?? 0,
              min_cents: p?.minCents ?? 0,
              formatted: p?.discountedFormatted ?? p?.formatted ?? '',
              base_formatted: p?.baseFormatted ?? p?.formatted ?? '',
              has_discount: p?.hasDiscount ?? false,
              valid_until_label: p?.validUntilLabel ?? null,
              promo_id: p?.promoId ?? null,
            },
          ];
        }),
      ),
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': pricingCacheControlHeader(),
      },
    });
  } catch (err) {
    console.error('[api/pricing]', err);
    return new Response(JSON.stringify({ error: 'Indisponível' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
