import type { PricingDisplay } from '../../../shared/pricing-display';
import type { ProductType } from '../../../shared/product-labels';

export type PriceProps = Pick<
  PricingDisplay,
  | 'baseFormatted'
  | 'finalFormatted'
  | 'hasDiscount'
  | 'validUntilLabel'
> & {
  product: ProductType;
  /** Cinzel grande (hero/cards) */
  size?: 'hero' | 'card' | 'inline';
  className?: string;
  showValidity?: boolean;
};

const sizeClasses: Record<NonNullable<PriceProps['size']>, string> = {
  hero: 'font-cinzel text-6xl md:text-8xl font-bold leading-none text-[#D4AF37]',
  card: 'font-cinzel text-5xl font-bold text-[#D4AF37]',
  inline: 'font-cinzel text-2xl font-bold text-[#D4AF37]',
};

/**
 * Preço único do produto: base riscada + final com desconto e validade da promo.
 */
export function Price({
  product: _product,
  baseFormatted,
  finalFormatted,
  hasDiscount,
  validUntilLabel,
  size = 'inline',
  className = '',
  showValidity = true,
}: PriceProps) {
  const displayFinal = finalFormatted.replace(/,00$/, '');

  if (!hasDiscount) {
    return (
      <span className={`${sizeClasses[size]} ${className}`.trim()} data-price-final>
        {displayFinal}
      </span>
    );
  }

  const strikeSize =
    size === 'hero' ? 'text-3xl md:text-4xl' : size === 'card' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`.trim()} data-product-price={_product}>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span
          className={`font-cinzel font-bold text-gray-500 line-through opacity-60 ${strikeSize}`}
          data-price-base
        >
          {baseFormatted.replace(/,00$/, '')}
        </span>
        <span className={sizeClasses[size]} data-price-final>
          {displayFinal}
        </span>
      </div>
      {showValidity && validUntilLabel ? (
        <span className="text-[#D4AF37]/80 text-xs font-medium tracking-wide" data-price-validity>
          {validUntilLabel}
        </span>
      ) : null}
    </div>
  );
}

/** Converte PriceInfo do servidor para props do componente. */
export function priceInfoToPriceProps(
  product: ProductType,
  info: {
    formatted: string;
    discountedFormatted?: string;
    hasDiscount: boolean;
    validUntilLabel?: string | null;
    baseFormatted?: string;
  },
): PriceProps {
  const finalFormatted = info.discountedFormatted ?? info.formatted;
  const baseFormatted = info.baseFormatted ?? info.formatted;
  return {
    product,
    baseFormatted,
    finalFormatted,
    hasDiscount: info.hasDiscount,
    validUntilLabel: info.validUntilLabel ?? null,
  };
}
