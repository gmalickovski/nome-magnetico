import { getPricesAndPromo } from '../payments/prices';
import { pricingCacheControlHeader } from './service';
export async function loadPagePricing() {
  return getPricesAndPromo();
}

export function applyPricingPageCache(astro: { response: { headers: Headers } }): void {
  astro.response.headers.set('Cache-Control', pricingCacheControlHeader());
}
