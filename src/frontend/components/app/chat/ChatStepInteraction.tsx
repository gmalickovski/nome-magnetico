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

/**
 * Campo inline + grade de pills (UX DEV-235): texto primeiro, chips abaixo.
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
        <div
          className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]"
          role="group"
          aria-label="Opções rápidas"
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPill(opt)}
              className="group relative text-left rounded-2xl border border-white/10 bg-[#131313]/80 px-3 py-2.5 transition-colors hover:border-gold/40 hover:bg-white/[0.04] disabled:opacity-50"
            >
              <span
                className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden
              />
              <span className="block text-sm font-medium text-chat-ink leading-snug">{opt.label}</span>
            </button>
          ))}
        </div>
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
  if (!options.length) return null;

  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
      {options.map((opt) => (
        <Pill
          key={opt.id}
          label={opt.label}
          size="lg"
          disabled={disabled}
          onClick={() => onSelect(opt)}
          className="w-full justify-center text-center !rounded-2xl !h-auto min-h-[44px] py-2.5 whitespace-normal"
        />
      ))}
    </div>
  );
}

export default ChatStepInteraction;
