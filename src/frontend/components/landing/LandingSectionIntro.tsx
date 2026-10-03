import React from 'react';

interface LandingSectionIntroProps {
  label?: string;
  title?: string;
  description?: React.ReactNode;
  align?: 'center' | 'left';
  className?: string;
}

/** Matches HeroSection outer shell — full width, no horizontal bleed on small screens. */
export const landingSectionShellClass =
  'max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12 w-full min-w-0';

/** Hero row rhythm: tighter on phone, opens on tablet/desktop. */
export const landingSectionStackGapClass = 'gap-8 md:gap-12 lg:gap-16';

/** Section heading rhythm aligned with HeroSection — no bordered card chrome. */
export function LandingSectionIntro({
  label,
  title,
  description,
  align = 'center',
  className = '',
}: LandingSectionIntroProps) {
  const alignClass =
    align === 'center' ? 'text-center mx-auto' : 'text-center lg:text-left';

  return (
    <div className={`${alignClass} min-w-0 ${className}`}>
      {label && (
        <p className="text-[#f2ca50] text-xs md:text-sm font-bold tracking-[0.15em] mb-4 md:mb-6">
          {label}
        </p>
      )}
      {title && (
        <h2
          className="font-cinzel text-2xl leading-tight sm:text-3xl md:text-4xl font-bold text-[#e5e2e1] mb-4 text-balance"
        >
          {title}
        </h2>
      )}
      {description && (
        <p
          className={`text-gray-400 text-sm md:text-base leading-relaxed max-w-prose break-words ${
            align === 'center' ? 'mx-auto' : 'lg:mx-0 mx-auto'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** Hero-style floating panel — depth via tone + ring, not gold outline boxes. */
export const landingPanelClass =
  'bg-[#181818]/40 backdrop-blur-md rounded-2xl ring-1 ring-white/5 shadow-2xl shadow-black/80 min-w-0';

/** Primary tap target on landing (matches hero CTA height). */
export const landingTouchTargetClass =
  'min-h-12 flex items-center justify-center touch-manipulation';
