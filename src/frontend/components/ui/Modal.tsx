import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  closeDisabled?: boolean;
  closeLabel?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className = '',
  closeDisabled = false,
  closeLabel = 'Fechar',
}: ModalProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (!closeDisabled) onClose();
      }
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, closeDisabled]);

  // Travar scroll do body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-nm-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          if (!closeDisabled) onClose();
        }}
      />

      {/* Card */}
      <div
        className={`
          relative z-10 w-full max-w-lg
          bg-[#111111] rounded-2xl
          border border-[#D4AF37]/20
          shadow-2xl shadow-black/50
          animate-slide-up
          ${className}
        `}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 border-b border-white/10">
            <h3 className="font-cinzel text-xl font-bold text-[#D4AF37]">{title}</h3>
            <button
              type="button"
              disabled={closeDisabled}
              onClick={() => {
                if (!closeDisabled) onClose();
              }}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={closeLabel}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
