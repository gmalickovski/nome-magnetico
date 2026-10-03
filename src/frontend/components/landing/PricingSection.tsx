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

function prominentPrice(label: string): string {
  return label.replace(/,00$/, '');
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
      className={`py-16 md:py-20 bg-[#111111] overflow-x-hidden ${reveal.className}`}
    >
      <style>
        {`
          @keyframes nm-price-border-shift {
            0%, 100% { border-color: #D4AF37; }
            50% { border-color: #E8C84A; }
          }
          .nm-price-border {
            border: 2px solid #D4AF37;
            animation: nm-price-border-shift 4.8s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .nm-price-border {
              animation: none;
              border-color: #D4AF37;
            }
          }
        `}
      </style>
      <div className={landingSectionShellClass}>
        <div className="mx-auto w-full max-w-xl min-w-0">
          <div className="nm-price-border rounded-2xl bg-[#111111] px-6 py-8 md:px-10 md:py-10 text-center">
            <p className="text-[#e5e2e1] text-sm leading-relaxed">
              Nome Social.
            </p>

            <p className="mt-3 font-cinzel text-6xl md:text-8xl font-bold leading-none text-[#D4AF37]">
              {prominentPrice(priceLabel)}
            </p>

            <p className="mt-3 text-[#e5e2e1] text-sm leading-relaxed">
              pagamento único, sem mensalidade.
            </p>

            <p className="mt-3 text-gray-400 text-sm leading-relaxed">
              ranking, nome recomendado e variações. Acesso na hora.{' '}
              <span className="whitespace-nowrap">Sete dias de garantia.</span>
            </p>

            <button
              type="button"
              onClick={handleBuy}
              disabled={priceUnavailableOnHq}
              className={`mt-6 w-full ${landingTouchTargetClass} font-semibold px-8 py-3.5 rounded-full transition-colors duration-300 text-base motion-reduce:transition-none ${
                priceUnavailableOnHq
                  ? 'opacity-40 cursor-not-allowed bg-white/5 text-gray-500'
                  : 'bg-[#f2ca50] text-[#1A1A1A] hover:bg-[#D4AF37]'
              }`}
            >
              Harmonizar minha assinatura
            </button>
          </div>
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
