import { useState } from 'react';
import type { ActivePromotion, PriceInfo } from '../../../backend/payments/prices';
import { CheckoutModal } from '../purchase/CheckoutModal';
import { captureBeginCheckout, track, trackBeginCheckout } from '../../lib/analytics';
import {
  isCheckoutEmailNotConfirmed,
  postCreateCheckoutWithPriceConfirm,
} from '../../lib/checkout-api';
import { EmailConfirmationPrompt } from './EmailConfirmationPrompt';
import type { SellableProductType } from '../../../shared/product-labels';

type ProductType = SellableProductType;

interface Props {
  product: ProductType;
  priceInfo: PriceInfo;
  promotion?: ActivePromotion | null;
  label?: string;
  variant?: 'primary' | 'outline';
  className?: string;
  ctaId?: string;
  ctaPosition?: string;
}

export function DashboardCheckoutButton({
  product,
  priceInfo,
  promotion,
  label = 'Adquirir',
  variant = 'primary',
  className,
  ctaId = 'dashboard_checkout',
  ctaPosition = 'dashboard',
}: Props) {
  const [open, setOpen] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  async function handleTriggerCard(type: ProductType, couponCode?: string) {
    track('checkout_redirect_start', {
      produto: type,
      preco: priceInfo.cents / 100,
      promocao: promotion?.name ?? null,
      codigo_cupom: couponCode,
      origem: 'dashboard',
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
    if (result.ok) {
      if ('bypass' in result && result.bypass) {
        window.location.href = result.redirectUrl;
      } else if ('url' in result) {
        window.location.href = result.url;
      }
      return;
    }

    if ('alreadyActive' in result && result.alreadyActive) {
      window.location.href = result.redirectUrl ?? '/app/analise/nome-social';
      return;
    }

    if (isCheckoutEmailNotConfirmed(result)) {
      setEmailNotConfirmed(true);
      return;
    }

    track('checkout_failed', {
      produto: type,
      erro: 'email_not_confirmed',
      origem: 'dashboard',
    });
  }

  const defaultClass = variant === 'primary'
    ? 'inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-[#131313] transition hover:bg-[#f2ca50]'
    : 'inline-flex items-center justify-center rounded-full border border-[#D4AF37]/50 px-5 py-2.5 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/10';

  return (
    <>
      <button
        type="button"
        data-cta-id={ctaId}
        data-cta-position={ctaPosition}
        onClick={() => {
          track('begin_checkout', { produto: product, valor: priceInfo.cents / 100 });
          track('checkout_start', {
            produto: product,
            preco: priceInfo.cents / 100,
            promocao: promotion?.name ?? null,
            origem: 'dashboard',
          });
          setOpen(true);
        }}
        className={className ?? defaultClass}
      >
        {label}
      </button>

      {emailNotConfirmed && (
        <div className="fixed inset-0 z-[100002] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/30 bg-slate-900 p-6 shadow-2xl">
            <EmailConfirmationPrompt />
            <button
              type="button"
              onClick={() => setEmailNotConfirmed(false)}
              className="mt-4 w-full rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm font-semibold text-[#D4AF37]"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {open && (
        <CheckoutModal
          productType={product}
          priceInfo={priceInfo}
          promotion={promotion}
          onClose={() => setOpen(false)}
          onTriggerCard={handleTriggerCard}
        />
      )}
    </>
  );
}
