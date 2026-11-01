import React, { useState } from 'react';
import { DateInput } from '../../ui/DateInput.js';
import { Button } from '../../ui/Button.js';

export interface ChatInlineDateReplyProps {
  onSubmit: (datePtBr: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

export function ChatInlineDateReply({
  onSubmit,
  disabled = false,
  initialValue = '',
}: ChatInlineDateReplyProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value.trim())) {
      setError('Informe a data completa no formato DD/MM/AAAA.');
      return;
    }
    onSubmit(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <DateInput
        value={value}
        onChangeValue={setValue}
        disabled={disabled}
        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-chat-ink focus:outline-none focus:border-gold transition"
      />
      {error && (
        <div className="text-brand-error text-xs p-2 rounded-lg bg-brand-error/10 border border-brand-error/20">
          {error}
        </div>
      )}
      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={disabled}
        className="!rounded-full font-semibold"
      >
        Continuar
      </Button>
    </form>
  );
}

export default ChatInlineDateReply;
