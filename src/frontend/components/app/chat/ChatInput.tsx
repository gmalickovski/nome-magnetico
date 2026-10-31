import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../ui/Button.js';

export interface ChatInputProps {
  onSend: (text: string) => void;
  onLiveScore?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function ChatInput({
  onSend,
  onLiveScore,
  placeholder = 'Digite sua resposta...',
  disabled = false,
  autoFocus = false,
  className = '',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    adjustHeight();

    if (onLiveScore) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onLiveScore(newVal);
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div
      className={`relative flex items-end gap-2 p-2 rounded-2xl bg-chat-bubble border border-white/10 shadow-lg focus-within:border-gold/60 focus-within:ring-1 focus-within:ring-gold/60 transition-all ${className}`}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full resize-none bg-transparent px-3 py-1.5 text-base text-chat-ink placeholder-chat-muted focus:outline-none max-h-32 leading-relaxed"
        style={{ minHeight: '38px' }}
      />

      <Button
        type="button"
        variant="send"
        size="icon"
        disabled={disabled || !value.trim()}
        onClick={handleSend}
        aria-label="Enviar mensagem"
        className="!rounded-full w-9 h-9 flex-shrink-0 mb-0.5"
      >
        <svg
          className="w-4 h-4 translate-x-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </Button>
    </div>
  );
}

export default ChatInput;
