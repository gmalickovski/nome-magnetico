import { useState, useEffect } from 'react';
import type { PriceInfo, ActivePromotion } from '../../../backend/payments/prices';
import { CheckoutModal } from './CheckoutModal';
import { track } from '../../lib/analytics';

type ProductType = 'nome_social' | 'nome_bebe' | 'nome_empresa';

interface Props {
  product: ProductType;
  isLoggedIn: boolean;
  priceInfo: PriceInfo;
  promotion?: ActivePromotion | null;
  label?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function LandingCheckout({
  product,
  isLoggedIn,
  priceInfo,
  promotion,
  label,
  variant = 'primary',
  className,
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
        origem: 'landing',
      });
      console.error('[LandingCheckout] Erro ao criar checkout:', err);
    }
  }

  const defaultCls =
    variant === 'primary'
      ? 'w-full text-center font-medium px-6 py-3 rounded-xl transition-all duration-300 text-sm bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#f2ca50] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20'
      : 'w-full text-center font-medium px-6 py-3 rounded-xl transition-all duration-300 text-sm border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] hover:scale-[1.02] active:scale-[0.98]';

  return (
    <>
      <button onClick={handleClick} className={className ?? defaultCls}>
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
