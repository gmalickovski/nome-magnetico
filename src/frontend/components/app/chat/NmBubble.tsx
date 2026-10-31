import React from 'react';

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
  return (
    <div
      className={`flex flex-col items-start w-full my-2 animate-fade-in`}
    >
      <div
        className={`rounded-2xl bg-chat-bubble px-4 py-3 text-chat-ink font-inter text-[15px] leading-relaxed border border-white/5 shadow-md ${
          wide ? 'w-full max-w-[92%]' : 'max-w-[85%]'
        } ${className}`}
      >
        {eyebrow && (
          <div className="font-cinzel text-xs font-bold tracking-wider uppercase mb-1.5 bg-gradient-to-r from-gold to-brand-spiritual bg-clip-text text-transparent">
            {eyebrow}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default NmBubble;
