import { useState } from 'react';
import type { PriceInfo, ActivePromotion } from '../../../backend/payments/prices';
import { track } from '../../lib/analytics';
import { CheckoutModal } from './CheckoutModal';

type ProductType = 'nome_social' | 'nome_bebe' | 'nome_empresa';

function promotionAppliesToProduct(promotion: ActivePromotion | null | undefined, productType: ProductType): boolean {
  const products = String(promotion?.productType ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return products.length === 0 || products.includes(productType);
}

interface Props {
  productType: ProductType | null;
  isLoggedIn: boolean;
  isOwned: boolean;
  paymentLinks: Record<ProductType, string>;
  hqPrices?: Record<string, PriceInfo>;
  promotion?: ActivePromotion | null;
  autoOpenCheckout?: boolean;
}

const ALL_PRODUCTS: ProductType[] = ['nome_social', 'nome_bebe', 'nome_empresa'];

const PRODUCT_STATIC: Record<ProductType, {
  name: string;
  subtitle: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
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
    popular: true,
  },
  nome_bebe: {
    name: 'Nome de Bebê',
    subtitle: 'A Decisão Mais Importante do Seu Filho',
    period: 'acesso por 30 dias',
    description: 'Tenha a certeza matemática de dar o melhor começo vibracional e livre de bloqueios ao destino do seu filho.',
    features: [
      'Verifica compatibilidade entre nomes',
      'Identifica bloqueios nos candidatos',
      'Descobre O Nome de Ouro',
      'Identifica o Arquétipo da Criança',
      'Guia dos pais para lidar com o perfil',
      'Relatório PDF para imprimir',
    ],
    cta: 'Analisar Nome do Bebê',
    popular: false,
  },
  nome_empresa: {
    name: 'Nome Empresarial',
    subtitle: 'Branding com Fundamento Vibracional',
    period: 'acesso por 30 dias',
    description: 'Um nome magnético atrai fluxo de negócios. Um nome qualquer afasta prosperidade. Obtenha um posicionamento certeiro.',
    features: [
      'Cruza vibração do nome com a do sócio',
      'Riscos ocultos mapeados',
      'Posicionamento de Mercado natural',
      'Arquétipo da Marca revelado',
      'Calendário ativo anual para vendas',
    ],
    cta: 'Analisar Minha Empresa',
    popular: false,
  },
};

const FALLBACK_PRICES: Record<string, PriceInfo> = {
  nome_social:  { cents:  9800, formatted: 'R$ 98,00',  hasDiscount: false },
  nome_bebe:    { cents:  8000, formatted: 'R$ 80,00',  hasDiscount: false },
  nome_empresa: { cents: 12500, formatted: 'R$ 125,00', hasDiscount: false },
};

function PriceDisplay({ priceInfo, promotion, productId }: { priceInfo: PriceInfo; promotion?: ActivePromotion | null; productId: string }) {
  const appliesToThis = promotionAppliesToProduct(promotion, productId as ProductType);
  const showDiscount = promotion && appliesToThis && priceInfo.hasDiscount && priceInfo.discountedFormatted;

  if (showDiscount) {
    return (
      <div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-cinzel text-2xl font-bold text-gray-500 line-through opacity-60">
            {priceInfo.formatted}
          </span>
          <span className="font-cinzel text-4xl font-bold text-[#D4AF37]">
            {priceInfo.discountedFormatted}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-[#D4AF37] text-black text-xs font-bold px-2 py-0.5 rounded-full">
            {promotion!.discountType === 'percent'
              ? `−${promotion!.discountValue}%`
              : `−R$ ${promotion!.discountValue}`}
          </span>
          <span className="text-[#D4AF37] text-xs font-medium">{promotion!.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className="font-cinzel text-4xl font-bold text-[#D4AF37]">{priceInfo.formatted}</span>
    </div>
  );
}

export function CheckoutFlow({ productType, isLoggedIn, isOwned, paymentLinks, hqPrices, promotion, autoOpenCheckout = false }: Props) {
  const [showAll, setShowAll]   = useState(productType === null);
  const [loading, setLoading]   = useState<ProductType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Produto selecionado para abrir o pré-checkout modal
  const [modalProduct, setModalProduct] = useState<ProductType | null>(
    autoOpenCheckout && isLoggedIn && !isOwned && productType ? productType : null
  );

  const prices = hqPrices ?? FALLBACK_PRICES;

  async function triggerCheckout(type: ProductType, couponCode?: string) {
    setLoading(type);
    setErrorMsg('');
    try {
      const appliesToThis = promotionAppliesToProduct(promotion, type);
      const effectiveCoupon = couponCode || (promotion && appliesToThis ? promotion.stripePromoCode : null) || undefined;

      const priceInfo = prices[type] ?? FALLBACK_PRICES[type];
      track('checkout_redirect_start', {
        produto: type,
        preco: priceInfo.cents / 100,
        promocao: promotion?.name ?? null,
        origem: 'comprar',
      });

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: type,
          couponCode: effectiveCoupon ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar sessão');
      if (data.bypass) {
        window.location.href = data.redirectUrl;
      } else {
        if (!data.url) throw new Error('URL de pagamento não retornada');
        window.location.href = data.url;
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
                <span>Voltar para Meus Produtos</span>
              </a>
              {!showAll && productType && (
                <button
                  onClick={() => setShowAll(true)}
                  className="bg-[#D4AF37] text-[#1A1A1A] font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-500/20 text-sm"
                >
                  Ver todos os produtos
                </button>
              )}
              {showAll && productType && (
                <button
                  onClick={() => setShowAll(false)}
                  className="bg-[#D4AF37] text-[#1A1A1A] font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-500/20 text-sm"
                >
                  Voltar
                </button>
              )}
            </div>
            </>
          ) : (
            <a
              href={`/auth/login?redirect=/comprar${productType ? `?produto=${productType}` : ''}`}
              className="border border-[#D4AF37]/40 text-[#D4AF37] font-medium px-5 py-2 rounded-lg hover:bg-[#D4AF37]/10 transition-all text-sm"
            >
              Entrar
            </a>
          )}
        </div>
      </header>
    );
  }

  function PageHeader({ singular }: { singular: boolean }) {
    return (
      <div className="text-center mb-10">
        <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-3">
          Investimento
        </p>
        <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-3">
          {singular ? 'Plano' : 'Planos'}
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

  function ProductCard({ type, showPayButton, forceHighlight = false }: { type: ProductType; showPayButton: boolean; forceHighlight?: boolean }) {
    const p = PRODUCT_STATIC[type];
    const priceInfo = prices[type] ?? FALLBACK_PRICES[type];
    const isLoadingThis = loading === type;
    const isHighlighted = forceHighlight || p.popular;

    return (
      <div className={`relative rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300 ${
        isHighlighted
          ? 'bg-white/5 border-2 border-[#D4AF37]/50 shadow-xl shadow-yellow-500/10'
          : 'bg-white/3 border border-white/10 hover:border-[#D4AF37]/30 hover:bg-white/5'
      }`}>
        {p.popular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-xs font-bold px-4 py-1.5 rounded-full">
            MAIS POPULAR
          </div>
        )}

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
            className={`block text-center w-full font-bold py-3.5 rounded-xl transition-all duration-300 ${
              isHighlighted
                ? 'bg-[#D4AF37] text-black hover:bg-yellow-300 hover:scale-105 shadow-lg shadow-yellow-500/20'
                : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/70'
            } ${isLoadingThis ? 'pointer-events-none opacity-60 cursor-not-allowed' : ''}`}
          >
            {isLoadingThis ? 'Aguarde...' : p.cta}
          </a>
        ) : (
          <a
            href={paymentLinks[type]}
            onClick={() => track('checkout_redirect_start', {
              produto: type,
              preco: priceInfo.cents / 100,
              promocao: promotion?.name ?? null,
              origem: 'comprar_publico',
            })}
            className={`block text-center font-bold py-3.5 rounded-xl transition-all duration-300 ${
              isHighlighted
                ? 'bg-[#D4AF37] text-black hover:bg-yellow-300 hover:scale-105 shadow-lg shadow-yellow-500/20'
                : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/70'
            }`}
          >
            {p.cta}
          </a>
        )}
      </div>
    );
  }

  // Produto já adquirido
  if (isOwned && productType) {
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
                onClick={() => { window.location.href = '/app'; }}
                className="w-full bg-[#D4AF37] text-black font-bold py-3.5 rounded-xl hover:bg-yellow-300 transition-all duration-300"
              >
                Ir para o App
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Não logado sem produto específico — mostrar todos os produtos.
  if (!isLoggedIn && !productType) {
    return (
      <div className="min-h-screen bg-[#111111]">
        <StickyHeader />
        <div className="pt-10 pb-20 md:pt-28">
          <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12">
            <PageHeader singular={false} />
            <div className="grid md:grid-cols-3 gap-8">
              {ALL_PRODUCTS.map(t => (
                <ProductCard key={t} type={t} showPayButton={false} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Não logado com produto específico — mostrar card escolhido.
  if (!isLoggedIn) {
    const type = productType!;
    return (
      <div className="min-h-screen bg-[#111111]">
        <StickyHeader />
        <div className="pt-10 pb-20 px-4 md:pt-28">
          <div className="max-w-md mx-auto">
            <PageHeader singular={true} />
            <ProductCard type={type} showPayButton={false} forceHighlight={true} />
          </div>
        </div>
      </div>
    );
  }

  // Todos os produtos
  if (showAll) {
    return (
      <>
        <div className="min-h-screen bg-[#111111]">
          <StickyHeader />
          <div className="pt-10 pb-28 md:pb-20 md:pt-28">
            <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12">
              <PageHeader singular={false} />
              {errorMsg && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm text-center">
                  {errorMsg}
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-8">
                {ALL_PRODUCTS.map(t => (
                  <ProductCard key={t} type={t} showPayButton={true} />
                ))}
              </div>
            </div>
          </div>
        </div>
        {modalProduct && (
          <CheckoutModal
            productType={modalProduct}
            priceInfo={prices[modalProduct] ?? FALLBACK_PRICES[modalProduct]}
            promotion={promotion}
            onClose={() => setModalProduct(null)}
            onTriggerCard={triggerCheckout}
          />
        )}
      </>
    );
  }

  // Produto específico (logado, não possui)
  const type = productType!;
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
              <PageHeader singular={true} />
            </div>
            {errorMsg && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm text-center">
                {errorMsg}
                <button onClick={() => setErrorMsg('')} className="block mt-2 mx-auto text-[#D4AF37] text-xs hover:underline">
                  Fechar
                </button>
              </div>
            )}
            <ProductCard type={type} showPayButton={true} forceHighlight={true} />
          </div>
        </div>
      </div>
      {modalProduct && (
        <CheckoutModal
          productType={modalProduct}
          priceInfo={prices[modalProduct] ?? FALLBACK_PRICES[modalProduct]}
          promotion={promotion}
          onClose={() => setModalProduct(null)}
          onTriggerCard={triggerCheckout}
        />
      )}
    </>
  );
}
