import React from 'react';

export interface PillProps {
  label?: string;
  size?: 'lg' | 'sm';
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  title?: string;
}

export function Pill({
  label,
  size = 'sm',
  selected = false,
  onClick,
  disabled = false,
  className = '',
  children,
  title,
}: PillProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-full font-inter transition-all duration-150 focus-visible:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] disabled:cursor-not-allowed';

  const sizeClasses =
    size === 'lg'
      ? 'min-h-[44px] lg:min-h-0 lg:h-10 px-4 text-[15px] font-medium'
      : 'min-h-[44px] lg:min-h-0 lg:h-8 px-3 text-sm';

  const unselectedClasses =
    'bg-[#1C1C1C] border border-[#D4AF37]/40 text-[#e5e2e1] hover:border-[#D4AF37] disabled:opacity-50';

  const selectedClasses =
    '!bg-[#D4AF37] !text-[#111111] !border-[#D4AF37] font-semibold hover:!bg-[#D4AF37] hover:!border-[#D4AF37]';

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`${baseClasses} ${sizeClasses} ${
        selected ? selectedClasses : unselectedClasses
      } ${className}`}
    >
      {children ?? label}
    </button>
  );
}

export default Pill;
