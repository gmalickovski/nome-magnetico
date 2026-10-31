import React from 'react';
import { ChatInput } from './ChatInput.js';

export interface ChatInlineTextReplyProps {
  onSend: (text: string) => void;
  onLiveScore?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Campo de texto dentro do fluxo do chat (sem barra fixa no rodapé). */
export function ChatInlineTextReply({
  onSend,
  onLiveScore,
  placeholder = 'Digite sua resposta...',
  disabled = false,
}: ChatInlineTextReplyProps) {
  return (
    <ChatInput
      onSend={onSend}
      onLiveScore={onLiveScore}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus
      className="mt-3 w-full min-w-0 !p-1.5 !shadow-none !bg-black/20"
    />
  );
}

export default ChatInlineTextReply;
