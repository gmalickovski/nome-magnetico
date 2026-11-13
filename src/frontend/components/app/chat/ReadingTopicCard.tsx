import React from 'react';

export interface ReadingTopicCardProps {
  eyebrow: string;
  title?: string;
  count?: number;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Container padrão dos assuntos no Painel de Análise, espelhando `.nm-floating-card`
 * da landing page (`#1c1c1c`, borda sutil e sombra flutuante em camadas).
 */
export function ReadingTopicCard({
  eyebrow,
  title,
  count,
  subtitle,
  children,
  className = '',
}: ReadingTopicCardProps) {
  return (
    <section
      className={`nm-floating-card nm-reading-card p-4 sm:p-5 w-full min-w-0 flex flex-col gap-3.5 text-left ${className}`}
    >
      <header className="flex flex-col gap-1 min-w-0 text-left">
        <p className="nm-score-eyebrow">{eyebrow}</p>
        {title && (
          <h3 className="font-cinzel font-bold text-[#e5e2e1] leading-snug break-words text-left">
            {title}
            {typeof count === 'number' && (
              <span className="text-[#f2ca50]"> = {count}</span>
            )}
          </h3>
        )}
        {subtitle && (
          <p className="nm-caption text-[#e5e2e1]/60 leading-snug text-left">
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

export default ReadingTopicCard;
