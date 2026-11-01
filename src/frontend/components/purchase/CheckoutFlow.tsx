import { useEffect, useState } from 'react';
import type { PriceInfo, ActivePromotion } from '../../../backend/payments/prices';
import { captureBeginCheckout, captureViewOffer, track, trackBeginCheckout } from '../../lib/analytics';
import { checkoutFailureMessage, postCreateCheckoutWithPriceConfirm } from '../../lib/checkout-api';
import { Price, priceInfoToPriceProps } from '../ui/Price';
import { CheckoutModal } from './CheckoutModal';
import type { SellableProductType } from '../../../shared/product-labels';

type ProductType = SellableProductType;

function promotionAppliesToProduct(promotion: ActivePromotion | null | undefined, productType: ProductType): boolean {
  const products = String(promotion?.productType ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return products.length === 0 || products.includes(productType);
}

interface Props {
  productType: ProductType;
  isLoggedIn: boolean;
  isOwned: boolean;
  paymentLinks: Record<ProductType, string>;
  hqPrices?: Record<string, PriceInfo>;
  promotion?: ActivePromotion | null;
  autoOpenCheckout?: boolean;
  autoconhecimentoAviso?: string;
}

const PRODUCT_STATIC: Record<ProductType, {
  name: string;
  subtitle: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
}> = {
  nome_social: {
    name: 'Nome Social',
    subtitle: 'Harmonização de assinatura',
    period: 'acesso por 30 dias',
    description: 'Sua assinatura tem mais poder do que você imagina. Harmonize sua assinatura comparando seu nome de nascimento com variações de nome social, score, ranking, bloqueios, arcanos e recomendação do nome mais fluido para assinar.',
    features: [
      'Harmonização de assinatura pelo Nome Social',
      'Ranking das assinaturas candidatas com score 0–100',
      'Nome social recomendado e variações harmonizadas',
      '5 números principais: Expressão, Destino, Motivação, Missão e Impressão',
      '4 triângulos cabalísticos: Vida, Pessoal, Social e Destino',
      'Arcanos regentes, sequências de passagem e trânsito atual',
      'Bloqueios, débitos, lições kármicas e tendências ocultas',
      'Compatibilidade Expressão × Destino',
      'Relatório PDF premium para baixar e consultar',
    ],
    cta: 'Harmonizar Minha Assinatura',
  },
};

const EMPTY_PRICE: PriceInfo = { cents: 0, formatted: '—', hasDiscount: false };

function PriceDisplay({ priceInfo, promotion, productId }: { priceInfo: PriceInfo; promotion?: ActivePromotion | null; productId: string }) {
  const appliesToThis = promotionAppliesToProduct(promotion, productId as ProductType);
  const props = priceInfoToPriceProps(productId as ProductType, {
    formatted: priceInfo.formatted,
    discountedFormatted: priceInfo.discountedFormatted,
    hasDiscount: Boolean(appliesToThis && priceInfo.hasDiscount),
    validUntilLabel: priceInfo.validUntilLabel,
    baseFormatted: priceInfo.baseFormatted,
  });
  return <Price {...props} size="card" showValidity />;
}

export function CheckoutFlow({ productType, isLoggedIn, isOwned, paymentLinks, hqPrices, promotion, autoOpenCheckout = false, autoconhecimentoAviso }: Props) {
  const [loading, setLoading]   = useState<ProductType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Produto selecionado para abrir o pré-checkout modal
  const [modalProduct, setModalProduct] = useState<ProductType | null>(
    autoOpenCheckout && isLoggedIn && !isOwned ? productType : null
  );

  const prices = hqPrices ?? {};

  useEffect(() => {
    if (!isOwned) captureViewOffer();
  }, [isOwned]);

  async function triggerCheckout(type: ProductType, couponCode?: string) {
    setLoading(type);
    setErrorMsg('');
    try {
      const appliesToThis = promotionAppliesToProduct(promotion, type);
      const effectiveCoupon = couponCode || (promotion && appliesToThis ? promotion.stripePromoCode : null) || undefined;

      const priceInfo = prices[type] ?? EMPTY_PRICE;
      if (!priceInfo.cents) throw new Error('Preço indisponível no momento. Atualize a página.');
      track('checkout_redirect_start', {
        produto: type,
        preco: priceInfo.cents / 100,
        promocao: promotion?.name ?? null,
        origem: 'comprar',
      });

      captureBeginCheckout('card', priceInfo.cents / 100);
      trackBeginCheckout({
        value: Number((priceInfo.cents / 100).toFixed(2)),
        currency: 'BRL',
        payment_method: 'stripe',
      });
      const searchParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const chosenSignatureParam = searchParams?.get('chosen_signature')?.trim() || undefined;
      const analysisIdParam = searchParams?.get('analysis_id')?.trim() || undefined;
      const rawSource = searchParams?.get('source')?.trim() || searchParams?.get('utm_campaign')?.trim();
      const sourceParam =
        rawSource === 'card_pdf' || rawSource === 'paywall_free' ? rawSource : undefined;
      const utmSourceParam = searchParams?.get('utm_source')?.trim() || undefined;
      const utmCampaignParam = searchParams?.get('utm_campaign')?.trim() || undefined;

      const result = await postCreateCheckoutWithPriceConfirm(
        {
          product_type: type,
          couponCode: effectiveCoupon ?? undefined,
          expected_final_cents: priceInfo.cents,
          ...(chosenSignatureParam ? { chosen_signature: chosenSignatureParam.slice(0, 80) } : {}),
          ...(analysisIdParam ? { analysis_id: analysisIdParam } : {}),
          ...(sourceParam ? { source: sourceParam } : {}),
          ...(utmSourceParam ? { utm_source: utmSourceParam } : {}),
          ...(utmCampaignParam ? { utm_campaign: utmCampaignParam } : {}),
        },
        (cents) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`,
      );
      if (!result.ok) {
        if ('priceChanged' in result && result.priceChanged) {
          setErrorMsg('O valor mudou — confirme novamente na página atualizada.');
          setLoading(null);
          return;
        }
        if ('alreadyActive' in result && result.alreadyActive) {
          window.location.href = result.redirectUrl ?? '/app/analise/nome-social';
          return;
        }
        throw new Error(checkoutFailureMessage(result));
      }
      if ('bypass' in result && result.bypass) {
        window.location.href = result.redirectUrl;
      } else if ('url' in result) {
        window.location.href = result.url;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Erro ao criar sessão de pagamento';
      track('checkout_failed', { produto: type, erro: errMsg });
      setErrorMsg(errMsg);
      setLoading(null);
      setModalProduct(null);
    }
  }

  function StickyHeader() {
    return (
      <header className="sticky top-0 z-40 border-b border-[#D4AF37]/20 bg-[#111111]/95 py-4 backdrop-blur-sm md:fixed md:inset-x-0 md:top-0">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12 flex items-center justify-between relative">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
              else window.location.href = '/app';
            }}
            className="md:hidden text-[#D4AF37] hover:text-[#f2ca50] transition-colors"
            aria-label="Voltar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <a href={isLoggedIn ? '/app' : '/'} className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 hover:opacity-80 transition-opacity">
            <img src="/logo-nm-header.svg" alt="Nome Magnético" className="h-9 sm:h-10 md:h-11 w-auto" />
          </a>
          {isLoggedIn ? (
            <>
            <div className="md:hidden w-6" aria-hidden="true" />
            <div className="hidden md:flex items-center gap-4">
              <a
                href="/app"
                className="group flex items-center gap-2 text-sm transition-colors text-gray-400 hover:text-[#D4AF37] relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-px after:bg-[#D4AF37] after:transition-all after:duration-300 after:w-0 hover:after:w-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span>Voltar ao Dashboard</span>
              </a>
            </div>
            </>
          ) : (
            <a
              href={`/auth/login?redirect=/comprar?produto=${productType}`}
              className="border border-[#D4AF37]/40 text-[#D4AF37] font-medium px-5 py-2 rounded-lg hover:bg-[#D4AF37]/10 transition-all text-sm"
            >
              Entrar
            </a>
          )}
        </div>
      </header>
    );
  }

  function PageHeader() {
    return (
      <div className="text-center mb-10">
        <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-3">
          Investimento
        </p>
        <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-3">
          Plano
        </h2>
        <p className="text-gray-400">
          Pagamento único. Sem assinatura. Acesso completo por 30 dias.
        </p>
        {promotion && (
          <div className="inline-flex items-center gap-2 mt-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-4 py-1.5">
            <span className="text-[#D4AF37] text-sm font-semibold">🎉 {promotion.name} — desconto ativo!</span>
          </div>
        )}
      </div>
    );
  }

  function ProductCard({ type, showPayButton }: { type: ProductType; showPayButton: boolean }) {
    const p = PRODUCT_STATIC[type];
    const priceInfo = prices[type] ?? EMPTY_PRICE;
    const isLoadingThis = loading === type;

    return (
      <div className="relative rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300 bg-white/5 border-2 border-[#D4AF37]/50 shadow-xl shadow-yellow-500/10">
        <div className="mb-6">
          <h3 className="font-cinzel text-xl font-bold text-white mb-1">{p.name}</h3>
          <p className="text-gray-500 text-sm">{p.subtitle}</p>
        </div>

        <div className="mb-6">
          <PriceDisplay priceInfo={priceInfo} promotion={promotion} productId={type} />
          <p className="text-gray-500 text-sm mt-1">{p.period}</p>
        </div>

        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{p.description}</p>

        <ul className="space-y-3 mb-8 flex-1">
          {p.features.map(feature => (
            <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
              <svg className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {autoconhecimentoAviso ? (
          <p className="text-gray-500 text-[11px] leading-relaxed mb-4">{autoconhecimentoAviso}</p>
        ) : null}

        {showPayButton ? (
          <a
            href={`/comprar?produto=${type}&checkout=1`}
            aria-disabled={isLoadingThis}
            onClick={(event) => {
              event.preventDefault();
              if (!isLoadingThis) {
                track('checkout_start', {
                  produto: type,
                  preco: priceInfo.cents / 100,
                  promocao: promotion?.name ?? null,
                  origem: 'comprar',
                });
                track('begin_checkout', { produto: type, valor: priceInfo.cents / 100 });
                setModalProduct(type);
              }
            }}
            data-cta-id="checkout_nome_social"
            data-cta-position="comprar"
            className={`block text-center w-full font-bold py-3.5 rounded-xl transition-all duration-300 bg-[#D4AF37] text-black hover:bg-yellow-300 hover:scale-105 shadow-lg shadow-yellow-500/20 ${isLoadingThis ? 'pointer-events-none opacity-60 cursor-not-allowed' : ''}`}
          >
            {isLoadingThis ? 'Aguarde...' : p.cta}
          </a>
        ) : (
          <a
            href={paymentLinks[type]}
            data-cta-id="checkout_nome_social"
            data-cta-position="comprar_publico"
            onClick={() => track('checkout_redirect_start', {
              produto: type,
              preco: priceInfo.cents / 100,
              promocao: promotion?.name ?? null,
              origem: 'comprar_publico',
            })}
            className="block text-center font-bold py-3.5 rounded-xl transition-all duration-300 bg-[#D4AF37] text-black hover:bg-yellow-300 hover:scale-105 shadow-lg shadow-yellow-500/20"
          >
            {p.cta}
          </a>
        )}
      </div>
    );
  }

  // Produto já adquirido
  if (isOwned) {
    const p = PRODUCT_STATIC[productType];
    return (
      <div className="min-h-screen bg-[#111111]">
        <StickyHeader />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full">
            <div className="bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-2xl p-8 text-center shadow-2xl">
              <h2 className="font-cinzel text-2xl font-bold text-white mb-3">Produto Ativo</h2>
              <p className="text-gray-300 mb-2">
                Você já possui o produto{' '}
                <strong className="text-[#D4AF37]">{p.name}</strong>{' '}
                ativo em sua conta.
              </p>
              <p className="text-gray-400 text-sm mb-8">Acesse o app para começar sua análise.</p>
              <button
                onClick={() => { window.location.href = '/app/analise/nome-social'; }}
                className="w-full bg-[#D4AF37] text-black font-bold py-3.5 rounded-xl hover:bg-yellow-300 transition-all duration-300"
              >
                Ir para minha análise
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Não logado com produto específico — mostrar card escolhido.
  if (!isLoggedIn) {
    const type = productType;
    return (
      <div className="min-h-screen bg-[#111111]">
        <StickyHeader />
        <div className="pt-10 pb-20 px-4 md:pt-28">
          <div className="max-w-md mx-auto">
            <PageHeader />
            <ProductCard type={type} showPayButton={false} />
          </div>
        </div>
      </div>
    );
  }

  // Produto específico (logado, não possui)
  const type = productType;
  return (
    <>
      <div className="min-h-screen bg-[#111111]">
        <div className="sticky top-0 z-40 flex items-center justify-between bg-[#101010]/95 px-5 py-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
              else window.location.href = '/app';
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-[#D4AF37] transition-colors hover:text-[#f2ca50]"
            aria-label="Voltar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Checkout</span>
          <a
            href="/app"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-gray-400 transition-colors hover:text-gray-200"
            aria-label="Fechar checkout"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </a>
        </div>
        <div className="hidden md:block">
          <StickyHeader />
        </div>
        <div className="px-4 py-6 md:pt-28 md:pb-20">
          <div className="max-w-md mx-auto">
            <div className="hidden md:block">
              <PageHeader />
            </div>
            {errorMsg && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm text-center">
                {errorMsg}
                <button onClick={() => setErrorMsg('')} className="block mt-2 mx-auto text-[#D4AF37] text-xs hover:underline">
                  Fechar
                </button>
              </div>
            )}
            <ProductCard type={type} showPayButton={true} />
          </div>
        </div>
      </div>
      {modalProduct && (
        <CheckoutModal
          productType={modalProduct}
          priceInfo={prices[modalProduct] ?? EMPTY_PRICE}
          promotion={promotion}
          autoconhecimentoAviso={autoconhecimentoAviso}
          onClose={() => setModalProduct(null)}
          onTriggerCard={triggerCheckout}
        />
      )}
    </>
  );
}
