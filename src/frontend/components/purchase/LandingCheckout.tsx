import { useState, useEffect } from 'react';
import type { PriceInfo, ActivePromotion } from '../../../backend/payments/prices';
import { CheckoutModal } from './CheckoutModal';
import { captureBeginCheckout, track, trackBeginCheckout } from '../../lib/analytics';
import { checkoutFailureMessage, postCreateCheckoutWithPriceConfirm } from '../../lib/checkout-api';
import type { SellableProductType } from '../../../shared/product-labels';

type ProductType = SellableProductType;

interface Props {
  product: ProductType;
  isLoggedIn: boolean;
  isOwned?: boolean;
  ownedProductLabel?: string;
  analysisPath?: string;
  priceInfo: PriceInfo;
  promotion?: ActivePromotion | null;
  label?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
  ctaId?: string;
  ctaPosition?: string;
}

export function LandingCheckout({
  product,
  isLoggedIn,
  isOwned = false,
  ownedProductLabel = 'Nome Social',
  analysisPath = '/app/analise/nome-social',
  priceInfo,
  promotion,
  label,
  variant = 'primary',
  className,
  ctaId,
  ctaPosition,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  // Auto-abre o modal se o usuário voltou do cadastro com ?checkout=PRODUCT na URL
  useEffect(() => {
    if (!isLoggedIn) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === product) {
      track('checkout_start', {
        produto: product,
        preco: priceInfo.cents / 100,
        promocao: promotion?.name ?? null,
        origem: 'landing_auto_open',
      });
      track('begin_checkout', { produto: product, valor: priceInfo.cents / 100 });
      setModalOpen(true);
      params.delete('checkout');
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (params.toString() ? '?' + params.toString() : ''),
      );
    }
  }, []);

  function handleClick() {
    if (isOwned) {
      window.location.href = analysisPath;
      return;
    }
    if (isLoggedIn) {
      track('checkout_start', {
        produto: product,
        preco: priceInfo.cents / 100,
        promocao: promotion?.name ?? null,
        origem: 'landing',
      });
      track('begin_checkout', { produto: product, valor: priceInfo.cents / 100 });
      setModalOpen(true);
    } else {
      // Redireciona para cadastro com URL de retorno codificada
      const returnUrl = `${window.location.pathname}?checkout=${product}`;
      window.location.href = `/auth/cadastro?redirect=${encodeURIComponent(returnUrl)}`;
    }
  }

  // Chamado pelo CheckoutModal quando o usuário escolhe Cartão de Crédito
  async function handleTriggerCard(type: ProductType, couponCode?: string) {
    try {
      track('checkout_redirect_start', {
        produto: type,
        preco: priceInfo.cents / 100,
        promocao: promotion?.name ?? null,
        codigo_cupom: couponCode,
        origem: 'landing',
      });
      captureBeginCheckout('card', priceInfo.cents / 100);
      trackBeginCheckout({
        value: Number((priceInfo.cents / 100).toFixed(2)),
        currency: 'BRL',
        payment_method: 'stripe',
      });
      const result = await postCreateCheckoutWithPriceConfirm(
        {
          product_type: type,
          couponCode,
          expected_final_cents: priceInfo.cents,
        },
        (cents) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`,
      );
      if (!result.ok) {
        if ('priceChanged' in result && result.priceChanged) return;
        if ('alreadyActive' in result && result.alreadyActive) {
          window.location.href = result.redirectUrl ?? analysisPath;
          return;
        }
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
        origem: 'landing',
      });
      console.error('[LandingCheckout] Erro ao criar checkout:', err);
    }
  }

  const defaultCls =
    variant === 'primary'
      ? 'w-full text-center font-medium px-6 py-3 rounded-xl transition-all duration-300 text-sm bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#f2ca50] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20'
      : 'w-full text-center font-medium px-6 py-3 rounded-xl transition-all duration-300 text-sm border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] hover:scale-[1.02] active:scale-[0.98]';

  if (isLoggedIn && isOwned) {
    return (
      <div className="w-full space-y-3 text-center sm:text-left">
        <p className="text-sm text-[#D4AF37]/90">
          Você já possui <strong>{ownedProductLabel}</strong> ativo.
        </p>
        <a
          href={analysisPath}
          className={className ?? defaultCls}
          data-cta-id={ctaId ?? `checkout_${product}_owned`}
          data-cta-position={ctaPosition ?? 'checkout'}
        >
          Ir para minha análise
        </a>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className ?? defaultCls}
        data-cta-id={ctaId ?? `checkout_${product}`}
        data-cta-position={ctaPosition ?? 'checkout'}
      >
        {label ?? 'Comprar Agora'}
      </button>

      {modalOpen && (
        <CheckoutModal
          productType={product}
          priceInfo={priceInfo}
          promotion={promotion}
          onClose={() => setModalOpen(false)}
          onTriggerCard={handleTriggerCard}
        />
      )}
    </>
  );
}
