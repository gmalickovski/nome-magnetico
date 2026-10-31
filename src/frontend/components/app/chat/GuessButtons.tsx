import React from 'react';
import { Pill } from '../../ui/Pill.js';

export interface GuessButtonsProps {
  onExact: () => void;
  onPartial: () => void;
  onOther: () => void;
  disabled?: boolean;
  className?: string;
}

export function GuessButtons({
  onExact,
  onPartial,
  onOther,
  disabled = false,
  className = '',
}: GuessButtonsProps) {
  return (
    <div className={`flex flex-wrap gap-2.5 items-center mt-2 ${className}`}>
      <Pill
        label="Na mosca"
        size="lg"
        disabled={disabled}
        onClick={onExact}
        className="!border-gold/40 hover:!border-gold hover:!bg-gold/15"
      />
      <Pill
        label="Em parte"
        size="lg"
        disabled={disabled}
        onClick={onPartial}
        className="!border-white/20 hover:!border-gold/40"
      />
      <Pill
        label="Não, é outra coisa"
        size="lg"
        disabled={disabled}
        onClick={onOther}
        className="!border-white/10 text-chat-muted hover:!border-white/30 hover:text-chat-ink"
      />
    </div>
  );
}

export default GuessButtons;
