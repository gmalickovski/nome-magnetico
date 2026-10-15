import { formatBRLDisplayFromCents } from '../../../shared/format-brl-cents';
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
  const displayFinal = stripPriceDisplayZeros(finalFormatted);

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
          {stripPriceDisplayZeros(baseFormatted)}
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

function stripPriceDisplayZeros(formatted: string): string {
  return formatted.replace(/,00$/, '');
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
    baseCents?: number;
    discountedCents?: number;
    cents?: number;
  },
): PriceProps {
  const finalCents = info.discountedCents ?? info.cents;
  const finalFormatted =
    info.discountedFormatted ??
    (finalCents != null ? formatBRLDisplayFromCents(finalCents) : info.formatted);
  const baseFormatted =
    info.baseFormatted ??
    (info.baseCents != null ? formatBRLDisplayFromCents(info.baseCents) : info.formatted);
  return {
    product,
    baseFormatted,
    finalFormatted,
    hasDiscount: info.hasDiscount,
    validUntilLabel: info.validUntilLabel ?? null,
  };
}
