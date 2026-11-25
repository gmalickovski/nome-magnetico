import type { AstroGlobal } from 'astro';
import type { FaqItemProps } from '../../frontend/components/landing/FAQSection';
import type { NichePageCopy } from '../../frontend/components/landing/niche/niche-types';
import type { ActivePromotion, PriceInfo } from '../payments/prices';
import { applyPricingPageCache, loadPagePricing } from '../pricing/astro-pricing';

const EMPTY_PRICE: PriceInfo = { cents: 0, formatted: '—', hasDiscount: false };

export interface NichePageSsrData {
  isLoggedIn: boolean;
  hqPrices: Record<string, PriceInfo>;
  promotion: ActivePromotion | null;
  faqItems: FaqItemProps[];
  schemaOfferPrice: string | undefined;
  schemaProduct: Record<string, unknown>;
  schemaFaq: Record<string, unknown>;
}

/**
 * Carrega preços SSR, schemas estruturados (`Product` + `FAQPage`) e FAQ do nicho
 * sem duplicar boilerplate entre `/nome-social`, `/nome-artistico` e `/nome-bebe`.
 */
export async function loadNichePageSsrData(
  astro: AstroGlobal,
  copy: NichePageCopy,
): Promise<NichePageSsrData> {
  applyPricingPageCache(astro);

  let hqPrices: Record<string, PriceInfo> = {};
  let promotion: ActivePromotion | null = null;
  try {
    const result = await loadPagePricing();
    hqPrices = result.prices;
    promotion = result.promotion;
  } catch (err) {
    console.warn(`[${copy.id}] Falha ao carregar preços SSR:`, err);
  }

  const socialPrice = hqPrices.nome_social ?? EMPTY_PRICE;
  const schemaOfferPrice =
    socialPrice.cents > 0 ? (socialPrice.cents / 100).toFixed(2) : undefined;
  const siteOrigin = (astro.site ?? new URL('https://www.nomemagnetico.com.br')).origin;

  const schemaProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: copy.seo.productName,
    description: copy.seo.productDescription,
    url: `${siteOrigin}${copy.route}`,
    brand: { '@type': 'Brand', name: 'Nome Magnético' },
    offers: {
      '@type': 'Offer',
      price: (socialPrice.cents / 100).toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: `${siteOrigin}/comprar?produto=nome_social`,
    },
  };

  const schemaFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const faqItems: FaqItemProps[] = copy.faq.map((item, idx) => ({
    id: `${copy.id}-faq-${idx + 1}`,
    question: item.question,
    answer: item.answer,
  }));

  return {
    isLoggedIn: Boolean(astro.locals.user),
    hqPrices,
    promotion,
    faqItems,
    schemaOfferPrice,
    schemaProduct,
    schemaFaq,
  };
}
