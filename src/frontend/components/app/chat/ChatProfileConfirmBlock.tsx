import React from 'react';
import { Button } from '../../ui/Button.js';

export interface ChatProfileConfirmBlockProps {
  nome: string;
  dataNascimento: string;
  onConfirm: () => void;
  onEdit: () => void;
  disabled?: boolean;
}

export function ChatProfileConfirmBlock({
  nome,
  dataNascimento,
  onConfirm,
  onEdit,
  disabled = false,
}: ChatProfileConfirmBlockProps) {
  return (
    <div className="w-full space-y-3 mt-1">
      <p className="text-chat-ink text-sm sm:text-[15px] leading-relaxed">
        Localizamos estes dados no seu cadastro. Estão corretos conforme sua certidão de nascimento?
      </p>
      <div className="rounded-xl bg-black/40 border border-white/10 p-3.5 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-1">
          <span className="text-chat-muted text-xs uppercase tracking-wider font-semibold">
            Nome de nascimento
          </span>
          <span className="font-medium text-gold">{nome}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-1">
          <span className="text-chat-muted text-xs uppercase tracking-wider font-semibold">
            Data de nascimento
          </span>
          <span className="font-medium text-chat-ink">{dataNascimento}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5 pt-1">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={disabled}
          onClick={onConfirm}
          className="!rounded-full font-semibold"
        >
          Confirmar e começar
        </Button>
        <Button
          type="button"
          variant="outlined"
          size="sm"
          disabled={disabled}
          onClick={onEdit}
          className="!rounded-full text-chat-muted hover:text-chat-ink hover:border-white/30"
        >
          Alterar dados
        </Button>
      </div>
    </div>
  );
}

export default ChatProfileConfirmBlock;
