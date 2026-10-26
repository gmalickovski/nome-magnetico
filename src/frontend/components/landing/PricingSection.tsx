import React, { useState, useEffect } from 'react';
import { captureBeginCheckout, track, trackBeginCheckout } from '../../lib/analytics';
import type { PriceInfo, ActivePromotion } from '../../../backend/payments/prices';
import { Price, priceInfoToPriceProps } from '../ui/Price';
import { CheckoutModal } from '../purchase/CheckoutModal';
import { checkoutFailureMessage, postCreateCheckoutWithPriceConfirm } from '../../lib/checkout-api';
import type { SellableProductType } from '../../../shared/product-labels';
import {
  landingSectionShellClass,
  landingSectionSpacingClass,
  landingTouchTargetClass,
} from './LandingSectionIntro';
import { getRevealItemProps, useLandingSectionReveal } from './useLandingSectionReveal';

export interface StripePrices {
  nome_social: string;
}

type ProductType = SellableProductType;

const PRICE_UNAVAILABLE: PriceInfo = { cents: 0, formatted: 'Indisponível', hasDiscount: false };

const NOME_SOCIAL_DELIVERABLES = [
  '3 opções com nota, nível e o que mudou',
  'triângulos Pessoal, Social e do Destino',
  'lições kármicas e arquétipo',
  'compare os nomes que você quiser',
  'PDF com guia de 30 dias',
] as const;

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
  const priceInfo = resolvedPrices[planId] ?? PRICE_UNAVAILABLE;
  const priceUnavailableOnHq = !resolvedPrices[planId]?.cents;
  const priceProps = priceInfoToPriceProps(planId, {
    formatted: displayPrice(priceInfo, promotion, planId),
    discountedFormatted: priceInfo.discountedFormatted,
    hasDiscount: Boolean(promotion && promotionAppliesToProduct(promotion, planId) && priceInfo.hasDiscount),
    validUntilLabel: priceInfo.validUntilLabel,
    baseFormatted: priceInfo.baseFormatted,
  });

  function handleBuy() {
    track('checkout_start', {
      produto: planId,
      preco: priceInfo.cents / 100,
      promocao: promotion?.name ?? null,
      origem: 'pricing_section',
      authenticated: isLoggedIn,
    });
    if (isLoggedIn) {
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
      captureBeginCheckout('card', (resolvedPrices[type] ?? PRICE_UNAVAILABLE).cents / 100);
      trackBeginCheckout({
        value: Number((info.cents / 100).toFixed(2)),
        currency: 'BRL',
        payment_method: 'stripe',
      });
      const result = await postCreateCheckoutWithPriceConfirm(
        {
          product_type: type,
          couponCode,
          expected_final_cents: info.cents,
        },
        (cents) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`,
      );
      if (!result.ok) {
        if ('priceChanged' in result && result.priceChanged) return;
        throw new Error(checkoutFailureMessage(result));
      }
      if ('bypass' in result && result.bypass) {
        window.location.href = result.redirectUrl;
        return;
      }
      if ('url' in result) window.location.href = result.url;
    } catch (err) {
      track('checkout_failed', {
        produto: type,
        erro: err instanceof Error ? err.message : 'Erro ao criar checkout',
        origem: 'pricing_section',
      });
      console.error('[PricingSection] Erro ao criar checkout:', err);
    }
  }

  const cardReveal = getRevealItemProps(reveal.revealed, 100, reveal.reduceMotion);

  return (
    <section
      id="precos"
      ref={reveal.ref}
      className={`${landingSectionSpacingClass} bg-[#111111] overflow-x-hidden ${reveal.className}`}
    >
      <style>
        {`
          @keyframes nm-price-border-flow {
            0% {
              background-position: 0% 0%, 0% 50%;
            }
            50% {
              background-position: 0% 0%, 100% 50%;
            }
            100% {
              background-position: 0% 0%, 0% 50%;
            }
          }
          .nm-price-border {
            position: relative;
            border: 2px solid transparent;
            background-image:
              radial-gradient(ellipse at top, #1d1a0d 0%, #131313 65%),
              linear-gradient(
                115deg,
                rgba(140, 109, 22, 0.35) 0%,
                rgba(212, 175, 55, 0.85) 20%,
                rgba(245, 215, 110, 1) 38%,
                rgba(150, 118, 24, 0.4) 55%,
                rgba(212, 175, 55, 0.9) 75%,
                rgba(242, 202, 80, 1) 90%,
                rgba(140, 109, 22, 0.35) 100%
              );
            background-origin: padding-box, border-box;
            background-clip: padding-box, border-box;
            background-size: 100% 100%, 300% 300%;
            box-shadow: 0 30px 80px rgba(212, 175, 55, 0.15);
            animation: nm-price-border-flow 6s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .nm-price-border {
              animation: none;
              border-color: rgba(212, 175, 55, 0.65);
            }
          }
        `}
      </style>
      <div className={landingSectionShellClass}>
        <div
          className={`mx-auto w-full max-w-xl lg:max-w-[980px] xl:max-w-[1060px] min-w-0 ${cardReveal.className}`}
          style={cardReveal.style}
        >
          <div className="nm-price-border rounded-3xl overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-11 xl:px-14 xl:py-12">
            {/* Glow topo dourado idêntico ao card da página de preços */}
            <div
              className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }}
              aria-hidden="true"
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-5 lg:gap-y-0 lg:gap-x-10 xl:gap-x-14 items-center text-center lg:text-left">
              {/* 1. Título: no topo no mobile (<1024px) | na direita no desktop widescreen (lg+) */}
              <div className="order-1 lg:order-none lg:col-span-7 lg:col-start-6 lg:row-start-1">
                <h3 className="nm-h3 lg:text-2xl xl:text-[1.65rem]">
                  Análise Completa Nome Social
                </h3>
              </div>

              {/* 2. Valor na esquerda no desktop widescreen (lg+) | abaixo do título no mobile (<1024px) */}
              <div className="order-2 lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:row-span-3 flex flex-col items-center justify-center text-center lg:py-4 lg:px-4 h-full">
                <Price {...priceProps} size="hero" className="text-center items-center" />

                <div className="hidden lg:block mt-5 space-y-1.5">
                  <p className="text-[#e5e2e1] font-semibold text-sm leading-relaxed">
                    pagamento único, sem mensalidade.
                  </p>
                  <p className="text-gray-400 text-xs xl:text-sm leading-relaxed">
                    Acesso na hora.{' '}
                    <span className="whitespace-nowrap">Sete dias de garantia.</span>
                  </p>
                </div>
              </div>

              {/* 3. Entregáveis: no meio no mobile (<1024px) | na direita abaixo do título no desktop (lg+) */}
              <div className="order-3 lg:order-none lg:col-span-7 lg:col-start-6 lg:row-start-2 lg:mt-4">
                <ul className="space-y-2 list-none p-0 m-0">
                  {NOME_SOCIAL_DELIVERABLES.map((item) => (
                    <li
                      key={item}
                      className="nm-body flex items-center justify-center lg:justify-start gap-2.5"
                    >
                      <span className="hidden lg:inline text-[#D4AF37] text-xs shrink-0 leading-none">
                        ✦
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. Termos de pagamento no mobile (<1024px): empilhados antes do botão */}
              <div className="order-4 lg:hidden space-y-1.5">
                <p className="text-[#e5e2e1] font-semibold text-sm leading-relaxed">
                  pagamento único, sem mensalidade.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Acesso na hora.{' '}
                  <span className="whitespace-nowrap">Sete dias de garantia.</span>
                </p>
              </div>

              {/* 5. Botão de Ação: embaixo no mobile (<1024px) e embaixo na coluna direita no desktop (lg+) */}
              <div className="order-5 lg:order-none lg:col-span-7 lg:col-start-6 lg:row-start-3 lg:mt-7">
                <button
                  type="button"
                  onClick={handleBuy}
                  data-cta-id="pricing_nome_social"
                  data-cta-position="precos"
                  disabled={priceUnavailableOnHq}
                  className={`w-full ${landingTouchTargetClass} font-semibold px-8 py-3.5 rounded-full transition-all duration-300 text-base motion-reduce:transition-none ${
                    priceUnavailableOnHq
                      ? 'opacity-40 cursor-not-allowed bg-white/5 text-gray-500'
                      : 'bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#f2ca50] shadow-lg shadow-[#D4AF37]/25'
                  }`}
                >
                  Ver Minhas 3 Opções
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {checkoutProduct && (
        <CheckoutModal
          productType={checkoutProduct}
          priceInfo={resolvedPrices[checkoutProduct] ?? PRICE_UNAVAILABLE}
          promotion={promotion}
          onClose={() => setCheckoutProduct(null)}
          onTriggerCard={handleTriggerCard}
        />
      )}
    </section>
  );
}
