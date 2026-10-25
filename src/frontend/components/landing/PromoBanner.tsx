import React, { useState } from 'react';
import type { ActivePromotion } from '../../../backend/payments/prices';

interface PromoBannerProps {
  promotion: ActivePromotion;
}

function formatEndDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PromoBanner({ promotion }: PromoBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const text = promotion.bannerText ||
    `${promotion.name}: ${promotion.discountType === 'percent' ? `${promotion.discountValue}% de desconto` : `R$ ${promotion.discountValue} de desconto`} até ${formatEndDate(promotion.endDate)}`;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #B8960C 0%, #D4AF37 50%, #B8960C 100%)',
        color: '#1A1A1A',
        padding: '10px 16px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 60,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '0.01em',
      }}
    >
      <span style={{ marginRight: 8 }}>🎉</span>
      {text}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Fechar banner"
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          opacity: 0.7,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1A1A1A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}
