import React from 'react';
import { useAdaptiveBubbleRadius } from './useAdaptiveBubbleRadius.js';

export interface NmBubbleProps {
  eyebrow?: string;
  wide?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function NmBubble({
  eyebrow,
  wide = false,
  className = '',
  children,
}: NmBubbleProps) {
  const { measureRef, radiusClass } = useAdaptiveBubbleRadius(
    `${wide}-${Boolean(eyebrow)}-${String(children)}`,
  );
  const shapeClass = wide || eyebrow ? 'rounded-2xl' : radiusClass;

  return (
    <div className="flex flex-col items-start w-full my-2 animate-fade-in">
      <div
        className={`${shapeClass} bg-chat-bubble px-4 py-3 text-chat-ink font-inter text-[15px] leading-relaxed border border-white/5 shadow-md ${
          wide ? 'w-full max-w-[92%]' : 'max-w-[85%]'
        } ${className}`}
      >
        {eyebrow && (
          <div className="font-cinzel text-xs font-bold tracking-wider uppercase mb-1.5 bg-gradient-to-r from-gold to-brand-spiritual bg-clip-text text-transparent">
            {eyebrow}
          </div>
        )}
        <div ref={measureRef}>{children}</div>
      </div>
    </div>
  );
}

export interface NmTypingBubbleProps {
  label?: string;
  className?: string;
}

/** Bolha de digitação do Jev com 3 pontinhos e rótulo opcional. */
export function NmTypingBubble({ label, className = '' }: NmTypingBubbleProps) {
  return (
    <NmBubble className={className}>
      {/* Igual ao carregamento do chat real: ponto dourado pulsando + texto */}
      <div className="flex items-center gap-2 text-xs text-chat-muted py-1">
        <span className="w-2 h-2 rounded-full bg-gold animate-ping" aria-hidden="true" />
        <span>{label ?? 'Sintonizando vibrações numéricas...'}</span>
      </div>
    </NmBubble>
  );
}

export interface UserBubbleProps {
  content: string;
  onEdit?: () => void;
  className?: string;
}

export function UserBubble({ content, onEdit, className = '' }: UserBubbleProps) {
  const { measureRef, radiusClass } = useAdaptiveBubbleRadius(content);
  const shapeClass = onEdit ? 'rounded-2xl' : radiusClass;

  return (
    <div className="flex flex-col items-end w-full my-2 animate-fade-in group">
      <div
        className={`relative flex items-center gap-2 max-w-[75%] ${shapeClass} bg-gold px-4 py-2.5 text-dark-deeper font-medium font-inter text-[15px] leading-snug shadow-md ${className}`}
      >
        <span ref={measureRef} className="inline-block">
          {content}
        </span>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            title="Editar esta resposta"
            aria-label="Editar esta resposta"
            className="opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-black/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dark-deeper"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
