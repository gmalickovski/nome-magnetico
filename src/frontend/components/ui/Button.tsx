import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'inverted' | 'outlined' | 'ghost' | 'danger' | 'send';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

const VARIANTS = {
  primary:
    'bg-[#D4AF37] text-[#1A1A1A] font-medium hover:bg-[#f2ca50]',
  secondary:
    'bg-[#2A2A2A] text-gray-200 hover:bg-[#333333]',
  inverted:
    'bg-gray-100 text-[#1A1A1A] font-medium hover:bg-white',
  outlined:
    'border border-white/20 text-gray-200 hover:bg-white/5',
  ghost:
    'text-gray-400 hover:text-gray-200 hover:bg-white/5',
  danger:
    'bg-red-500/20 text-red-400 hover:bg-red-500/30',
  send:
    'rounded-full bg-gold text-dark-deeper hover:bg-gold-light disabled:bg-white/10 disabled:text-chat-muted',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm rounded-md',
  md: 'px-6 py-2.5 text-base rounded-lg',
  lg: 'px-8 py-3.5 text-lg rounded-xl',
  icon: 'p-2 rounded-xl flex items-center justify-center',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-300
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Carregando...
        </>
      ) : (
        children
      )}
    </button>
  );
}
