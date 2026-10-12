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
          className="font-cinzel text-3xl md:text-4xl lg:text-5xl font-bold text-[#e5e2e1] mb-4 leading-tight text-balance"
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

/**
 * Hero floating panel (REFERENCE — do not change Hero to match mockups).
 * Technique: soft glass surface + hairline ring + Tailwind `shadow-2xl`.
 */
export const landingPanelClass =
  'bg-[#181818]/40 backdrop-blur-md rounded-2xl ring-1 ring-white/5 shadow-2xl shadow-black/80 min-w-0';

/**
 * Floating mockup card — same *technique* as the Hero panel (ring + one box-shadow),
 * but softer falloff: larger blur + lower opacity so the cast dissolves into
 * the page ground instead of a hard silhouette edge.
 *
 * **One token for every breakpoint** (phone / tablet stack / desktop side-by-side).
 * Layout may stack or grid; the shadow recipe never changes. When desktop fit
 * applies CSS `zoom`, the cast scales with the card.
 * Hero stays on `shadow-2xl shadow-black/80` (reference — do not change it).
 */
export const landingMockupFloatClass =
  'rounded-2xl min-w-0 w-full max-w-full ring-1 ring-white/5 shadow-[0_22px_56px_-8px_rgba(0,0,0,0.22)]';

/** @deprecated Use landingMockupFloatClass + surface bg. */
export const landingMockupCardClass = `${landingMockupFloatClass} bg-[#1c1c1c]`;

/** Primary tap target on landing (matches hero CTA height). */
export const landingTouchTargetClass =
  'min-h-12 flex items-center justify-center touch-manipulation';
