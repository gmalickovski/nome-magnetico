import React, { useState } from 'react';

interface AccordionItem {
  id: string;
  question: string;
  answer: string;
  answerHtml?: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  /** Landing FAQ: floating 3D tonal panel */
  variant?: 'default' | 'landing';
  revealed?: boolean;
  reduceMotion?: boolean;
}

export function Accordion({
  items,
  className = '',
  variant = 'default',
  revealed = true,
  reduceMotion = false,
}: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const itemSurface =
    variant === 'landing'
      ? 'nm-floating-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/15'
      : 'border border-[#D4AF37]/20 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm';

  return (
    <div className={`space-y-3.5 ${className}`}>
      {items.map((item, idx) => {
        const staggerClass =
          variant === 'landing' && !reduceMotion
            ? `transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`
            : '';
        const staggerStyle =
          variant === 'landing' && !reduceMotion && revealed
            ? { transitionDelay: `${100 + idx * 60}ms` }
            : undefined;

        return (
          <div
            key={item.id}
            className={`${itemSurface} ${staggerClass}`}
            style={staggerStyle}
          >
            <button
              type="button"
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
              className={`w-full min-h-12 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left hover:bg-white/[0.03] transition-colors touch-manipulation motion-reduce:transition-none ${
                variant === 'landing' ? 'sm:min-h-[56px]' : ''
              }`}
            >
              <span className={`leading-snug text-pretty min-w-0 ${
                variant === 'landing'
                  ? 'font-inter font-semibold text-base md:text-[17px] text-[#E5E2E1]'
                  : 'font-medium text-[#e5e2e1] text-sm sm:text-base'
              }`}>
                {item.question}
              </span>
              <svg
                className={`w-5 h-5 text-[#D4AF37] flex-shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
                  openId === item.id ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openId === item.id ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="px-4 sm:px-6 pb-5 border-t border-white/5 pt-3.5">
                {item.answerHtml ? (
                  <div
                    className={
                      variant === 'landing'
                        ? 'nm-body'
                        : 'prose prose-invert prose-sm max-w-none text-pretty'
                    }
                    dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                  />
                ) : (
                  <p className={variant === 'landing' ? 'nm-body' : 'text-gray-400 text-sm leading-relaxed text-pretty'}>
                    {item.answer}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
