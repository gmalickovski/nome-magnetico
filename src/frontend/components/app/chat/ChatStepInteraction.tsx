import React from 'react';
import { ChatInlineTextReply } from './ChatInlineTextReply.js';
import type { PillOption } from './PillGroup.js';
import { Pill } from '../../ui/Pill.js';

export interface ChatStepInteractionProps {
  showText?: boolean;
  showPills?: boolean;
  options?: PillOption[];
  placeholder?: string;
  disabled?: boolean;
  onSendText: (text: string) => void;
  onSelectPill: (option: PillOption) => void;
  onLiveScore?: (text: string) => void;
}

/** Pílulas inline (rounded-full, largura pelo conteúdo, flex-wrap). */
export function ChatInlineOptionPills({
  options,
  disabled,
  onSelect,
  className = '',
}: {
  options: PillOption[];
  disabled?: boolean;
  onSelect: (option: PillOption) => void;
  className?: string;
}) {
  if (!options.length) return null;

  return (
    <div
      className={`flex flex-wrap gap-2 items-center w-full ${className}`}
      role="group"
      aria-label="Opções rápidas"
    >
      {options.map((opt) => (
        <Pill
          key={opt.id}
          label={opt.label}
          size="lg"
          disabled={disabled}
          onClick={() => onSelect(opt)}
        />
      ))}
    </div>
  );
}

/**
 * Campo inline + pills (UX DEV-235): texto primeiro, chips abaixo.
 */
export function ChatStepInteraction({
  showText = true,
  showPills = false,
  options = [],
  placeholder,
  disabled = false,
  onSendText,
  onSelectPill,
  onLiveScore,
}: ChatStepInteractionProps) {
  const hasPills = showPills && options.length > 0;

  return (
    <div className="mt-3 flex flex-col gap-3 w-full">
      {showText && (
        <ChatInlineTextReply
          onSend={onSendText}
          onLiveScore={onLiveScore}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}

      {hasPills && (
        <ChatInlineOptionPills
          options={options}
          disabled={disabled}
          onSelect={onSelectPill}
          className="pt-0.5"
        />
      )}
    </div>
  );
}

/** Pills arredondadas estilo chip (passos só com escolha). */
export function ChatChoicePills({
  options,
  disabled,
  onSelect,
}: {
  options: PillOption[];
  disabled?: boolean;
  onSelect: (option: PillOption) => void;
}) {
  return (
    <ChatInlineOptionPills
      options={options}
      disabled={disabled}
      onSelect={onSelect}
      className="mt-3"
    />
  );
}

export default ChatStepInteraction;
