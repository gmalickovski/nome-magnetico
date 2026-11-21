import React from 'react';

export interface ChatBackButtonProps {
  onClick: () => void;
  disabled?: boolean;
  /** Texto para leitor de tela e dica. Padrão: voltar uma pergunta. */
  label?: string;
  className?: string;
}

/**
 * Voltar uma pergunta (DEV-324). Círculo só com ícone, primeiro item da linha de opções.
 * Visual "fantasma": fundo mais escuro e ícone dourado, sem borda (regra NO-LINE), para
 * não parecer mais uma resposta. Área de toque de 44 px.
 */
export function ChatBackButton({
  onClick,
  disabled = false,
  label = 'Voltar à pergunta anterior',
  className = '',
}: ChatBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      data-chat-back
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#131313] text-[#D4AF37] transition-colors duration-300 hover:bg-[#D4AF37]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
      </svg>
    </button>
  );
}

export default ChatBackButton;
