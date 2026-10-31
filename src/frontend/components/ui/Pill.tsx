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
    'inline-flex items-center justify-center rounded-full font-inter transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses =
    size === 'lg'
      ? 'min-h-[44px] lg:min-h-0 lg:h-10 px-4 text-[15px] font-medium bg-chat-bubble border border-white/15 text-chat-ink hover:border-gold/60 hover:bg-gold/10'
      : 'min-h-[44px] lg:min-h-0 lg:h-8 px-3 text-sm bg-chat-bubble border border-white/10 text-chat-ink hover:border-gold/60 hover:bg-gold/10';

  const selectedClasses = selected
    ? '!bg-gold !text-dark-deeper !border-gold hover:!bg-gold-light hover:!border-gold-light font-semibold'
    : '';

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`${baseClasses} ${sizeClasses} ${selectedClasses} ${className}`}
    >
      {children ?? label}
    </button>
  );
}

export default Pill;
