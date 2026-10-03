import React, { useState, useEffect } from 'react';
import { track } from '../../lib/analytics';
import type { PriceInfo, ActivePromotion } from '../../../backend/payments/prices';
import { CheckoutModal } from '../purchase/CheckoutModal';
import type { SellableProductType } from '../../../shared/product-labels';

export interface StripePrices {
  nome_social: string;
}

type ProductType = SellableProductType;

interface Plan {
  id: ProductType;
  name: string;
  subtitle: string;
  emoji: string;
  period: string;
  highlights: string[];
  cta: string;
  href: string;
}

// Preço exibido quando o HQ não retornou dados (botão desabilitado)
const PRICE_UNAVAILABLE: PriceInfo = { cents: 0, formatted: '—', hasDiscount: false };

// Função pura — não importa do backend para evitar bundle com Stripe SDK
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

const PLANS: Plan[] = [
  {
    id: 'nome_social',
    name: 'Nome Social',
    subtitle: 'Harmonização de Assinatura',
    emoji: '✦',
    period: 'pagamento único',
    highlights: [
      'Harmonize sua assinatura com base no seu nome',
      'Ranking de assinaturas com score 0–100',
      'Nome social recomendado + variações harmonizadas',
    ],
    cta: 'Harmonizar Minha Assinatura',
    href: '/nome-social',
  },
];

interface PricingSectionProps {
  /** @deprecated use hqPrices instead */
  stripePrices?: StripePrices;
  hqPrices?: Record<string, PriceInfo>;
  promotion?: ActivePromotion | null;
  isLoggedIn?: boolean;
}

function PriceDisplay({
  priceInfo,
  promotion,
  productId,
}: {
  priceInfo: PriceInfo;
  promotion?: ActivePromotion | null;
  productId: ProductType;
}) {
  const appliesToThis = promotionAppliesToProduct(promotion, productId);
  const showDiscount =
    promotion && appliesToThis && priceInfo.hasDiscount && priceInfo.discountedFormatted;

  if (showDiscount) {
    return (
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-cinzel text-base font-bold text-gray-500 line-through opacity-60">
            {priceInfo.formatted}
          </span>
          <span className="font-cinzel text-3xl font-bold text-[#D4AF37]">
            {priceInfo.discountedFormatted}
          </span>
        </div>
        <span className="inline-block bg-[#D4AF37] text-black text-xs font-bold px-2 py-0.5 rounded-full mt-1">
          {promotion!.discountType === 'percent'
            ? `−${promotion!.discountValue}%`
            : `−R$ ${promotion!.discountValue}`}
        </span>
      </div>
    );
  }

  return (
    <span className="font-cinzel text-3xl font-bold text-[#D4AF37]">{priceInfo.formatted}</span>
  );
}

export function PricingSection({
  stripePrices,
  hqPrices,
  promotion,
  isLoggedIn = false,
}: PricingSectionProps) {
  const [checkoutProduct, setCheckoutProduct] = useState<ProductType | null>(null);

  // Analytics: registra quando a seção de preços entra no viewport
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

  // Auto-abre o modal quando o usuário volta do cadastro com ?checkout=PRODUCT
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
          nome_social:  { cents: 0, formatted: stripePrices.nome_social,  hasDiscount: false },
        }
      : {}
  );

  function handleBuy(planId: ProductType) {
    if (isLoggedIn) {
      const priceInfo = resolvedPrices[planId] ?? PRICE_UNAVAILABLE;
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

  // Chamado pelo CheckoutModal → redireciona para Stripe (cartão)
  async function handleTriggerCard(type: ProductType, couponCode?: string) {
    try {
      const priceInfo = resolvedPrices[type] ?? PRICE_UNAVAILABLE;
      track('checkout_redirect_start', {
        produto: type,
        preco: priceInfo.cents / 100,
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
    <section id="precos" className="py-20 md:py-28 bg-[#1a1a1a]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#D4AF37] text-xs font-medium tracking-widest uppercase mb-3">Produto</p>
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-[#e5e2e1] mb-4">
            Nome Social
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
            Pagamento único. Sem recorrência. A assinatura do seu nome social, a partir do seu nome
            de nascimento.
          </p>
          {promotion && (
            <div className="inline-flex items-center gap-2 mt-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-4 py-1.5">
              <span className="text-[#D4AF37] text-sm font-semibold">
                🎉 {promotion.name} — desconto ativo!
              </span>
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="mx-auto max-w-md">
          {PLANS.map((plan) => {
            const priceInfo = resolvedPrices[plan.id] ?? PRICE_UNAVAILABLE;
            const priceAvailable = !!resolvedPrices[plan.id];

            return (
              <div
                key={plan.id}
                className="relative rounded-2xl p-7 flex flex-col transition-all duration-300 bg-white/5 border-2 border-[#D4AF37]/50 shadow-[0_20px_50px_rgba(212,175,55,0.10)]"
              >
                {/* Nome + preço */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg leading-none">{plan.emoji}</span>
                    <h3 className="font-cinzel text-lg font-bold text-white">{plan.name}</h3>
                  </div>
                  <p className="text-gray-500 text-xs mb-4">{plan.subtitle}</p>
                  <PriceDisplay priceInfo={priceInfo} promotion={promotion} productId={plan.id} />
                  <p className="text-gray-600 text-xs mt-1">{plan.period}</p>
                </div>

                {/* 3 destaques */}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-gray-400">
                      <svg
                        className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {h}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleBuy(plan.id)}
                  disabled={!priceAvailable}
                  className={`w-full text-center font-medium px-6 py-3 rounded-xl transition-all duration-300 text-sm mb-3 ${
                    !priceAvailable
                      ? 'opacity-40 cursor-not-allowed bg-white/5 text-gray-500 border border-white/10'
                      : 'bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#f2ca50] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Garantia */}
                <p className="text-center text-[11px] text-gray-500 mt-2 mb-1 leading-snug">
                  ⚡ Acesso imediato · 🛡 7 dias de garantia
                </p>

                {/* Link para detalhes */}
                <a
                  href={plan.href}
                  className="block text-center text-gray-600 hover:text-[#D4AF37] text-xs transition-colors"
                >
                  Ver todos os detalhes
                </a>
              </div>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="text-center mt-10 space-y-2">
          <p className="text-gray-600 text-xs">
            🔒 Pagamento seguro via Stripe · Garantia de 7 dias · Suporte incluso
          </p>
          <a
            href="/precos"
            className="inline-block text-[#D4AF37]/70 hover:text-[#D4AF37] text-xs transition-colors underline underline-offset-2"
          >
            Ver detalhes do Nome Social
          </a>
        </div>
      </div>

      {/* CheckoutModal — usa Portal internamente (z-[99999], fora do stacking context) */}
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
