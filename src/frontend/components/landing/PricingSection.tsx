import React, { useState, useEffect } from 'react';
import { track } from '../../lib/analytics';
import type { PriceInfo, ActivePromotion } from '../../../backend/payments/prices';
import { CheckoutModal } from '../purchase/CheckoutModal';
import type { SellableProductType } from '../../../shared/product-labels';
import {
  landingSectionShellClass,
  landingTouchTargetClass,
} from './LandingSectionIntro';
import { useLandingSectionReveal } from './useLandingSectionReveal';

export interface StripePrices {
  nome_social: string;
}

type ProductType = SellableProductType;

const PRICE_UNAVAILABLE: PriceInfo = { cents: 0, formatted: '—', hasDiscount: false };

const PRICE_FALLBACK: PriceInfo = {
  cents: 9800,
  formatted: 'R$ 98',
  hasDiscount: false,
};

function promotionAppliesToProduct(
  promotion: ActivePromotion | null | undefined,
  productType: ProductType,
): boolean {
  const products = String(promotion?.productType ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return products.length === 0 || products.includes(productType);
}

function displayPrice(
  priceInfo: PriceInfo,
  promotion: ActivePromotion | null | undefined,
  productId: ProductType,
): string {
  const applies = promotionAppliesToProduct(promotion, productId);
  if (promotion && applies && priceInfo.hasDiscount && priceInfo.discountedFormatted) {
    return priceInfo.discountedFormatted;
  }
  return priceInfo.formatted;
}

interface PricingSectionProps {
  /** @deprecated use hqPrices instead */
  stripePrices?: StripePrices;
  hqPrices?: Record<string, PriceInfo>;
  promotion?: ActivePromotion | null;
  isLoggedIn?: boolean;
}

export function PricingSection({
  stripePrices,
  hqPrices,
  promotion,
  isLoggedIn = false,
}: PricingSectionProps) {
  const [checkoutProduct, setCheckoutProduct] = useState<ProductType | null>(null);
  const reveal = useLandingSectionReveal();

  useEffect(() => {
    const el = document.getElementById('precos');
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          track('pricing_view', { produto: 'nome_social' });
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const params = new URLSearchParams(window.location.search);
    const product = params.get('checkout') as ProductType | null;
    if (product === 'nome_social') {
      const priceInfo = resolvedPrices[product] ?? PRICE_UNAVAILABLE;
      track('checkout_start', {
        produto: product,
        preco: priceInfo.cents / 100,
        promocao: promotion?.name ?? null,
        origem: 'pricing_section_auto_open',
      });
      track('begin_checkout', { produto: product, valor: priceInfo.cents / 100 });
      setCheckoutProduct(product);
      params.delete('checkout');
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (params.toString() ? '?' + params.toString() : ''),
      );
    }
  }, []);

  const resolvedPrices: Record<string, PriceInfo> = hqPrices ?? (
    stripePrices
      ? {
          nome_social: { cents: 0, formatted: stripePrices.nome_social, hasDiscount: false },
        }
      : {}
  );

  const planId: ProductType = 'nome_social';
  const priceInfo = resolvedPrices[planId] ?? PRICE_FALLBACK;
  const priceUnavailableOnHq = Boolean(hqPrices) && !resolvedPrices[planId];
  const priceLabel = displayPrice(priceInfo, promotion, planId);

  function handleBuy() {
    if (isLoggedIn) {
      track('checkout_start', {
        produto: planId,
        preco: priceInfo.cents / 100,
        promocao: promotion?.name ?? null,
        origem: 'pricing_section',
      });
      track('begin_checkout', { produto: planId, valor: priceInfo.cents / 100 });
      setCheckoutProduct(planId);
    } else {
      const returnUrl = `${window.location.pathname}?checkout=${planId}`;
      window.location.href = `/auth/cadastro?redirect=${encodeURIComponent(returnUrl)}`;
    }
  }

  async function handleTriggerCard(type: ProductType, couponCode?: string) {
    try {
      const info = resolvedPrices[type] ?? PRICE_UNAVAILABLE;
      track('checkout_redirect_start', {
        produto: type,
        preco: info.cents / 100,
        promocao: promotion?.name ?? null,
        codigo_cupom: couponCode,
        origem: 'pricing_section',
      });
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_type: type, couponCode }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Erro ao criar checkout');
      window.location.href = data.url;
    } catch (err) {
      track('checkout_failed', {
        produto: type,
        erro: err instanceof Error ? err.message : 'Erro ao criar checkout',
        origem: 'pricing_section',
      });
      console.error('[PricingSection] Erro ao criar checkout:', err);
    }
  }

  return (
    <section
      id="precos"
      ref={reveal.ref}
      className={`py-20 md:py-28 bg-[#1a1a1a] overflow-x-hidden ${reveal.className}`}
    >
      <div className={landingSectionShellClass}>
        <div className="max-w-prose lg:max-w-2xl min-w-0">
          <p className="text-[#f2ca50] text-xs md:text-sm font-bold tracking-[0.15em] mb-6">
            Preço
          </p>

          <p className="text-[#e5e2e1] text-base md:text-lg leading-relaxed mb-4">
            Nome Social. {priceLabel}, pagamento único, sem mensalidade.
          </p>

          <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8">
            Você recebe o ranking das assinaturas, o nome recomendado e as variações. Acesso na hora.
            Sete dias de garantia.
          </p>

          <button
            type="button"
            onClick={handleBuy}
            disabled={priceUnavailableOnHq}
            className={`w-full sm:w-auto ${landingTouchTargetClass} font-semibold px-8 py-3.5 rounded-full transition-colors duration-300 text-base motion-reduce:transition-none ${
              priceUnavailableOnHq
                ? 'opacity-40 cursor-not-allowed bg-white/5 text-gray-500'
                : 'bg-[#f2ca50] text-[#1A1A1A] hover:bg-[#D4AF37]'
            }`}
          >
            Harmonizar minha assinatura
          </button>
        </div>
      </div>

      {checkoutProduct && (
        <CheckoutModal
          productType={checkoutProduct}
          priceInfo={resolvedPrices[checkoutProduct] ?? PRICE_FALLBACK}
          promotion={promotion}
          onClose={() => setCheckoutProduct(null)}
          onTriggerCard={handleTriggerCard}
        />
      )}
    </section>
  );
}
