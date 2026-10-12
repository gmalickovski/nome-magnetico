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

/** Hero-style floating panel — depth via tone + ring, not gold outline boxes. */
export const landingPanelClass =
  'bg-[#181818]/40 backdrop-blur-md rounded-2xl ring-1 ring-white/5 shadow-2xl shadow-black/80 min-w-0';

/**
 * Realistic floating card (NO-LINE) — layered shadows with a shared light angle.
 *
 * Technique (Josh Comeau / Material elevation):
 * - Same light source: Y offset ≈ 2× X (shadow cast down-right)
 * - Layer 1 contact (tight, darker) + layer 2/3 ambient (softer, farther)
 * - Slight negative spread keeps the cast silhouette ≈ card size, just offset
 * - Not a centered glow — that reads flat, not elevated
 */
export const landingMockupFloatClass =
  'landing-mockup-float rounded-2xl bg-[#1c1c1c] min-w-0 w-full max-w-full';

/** @deprecated Use landingMockupFloatClass — kept for any residual imports. */
export const landingMockupCardClass = landingMockupFloatClass;

/** Inject once near product mockups — multi-layer box-shadow needs raw CSS. */
export const landingMockupFloatStyle = `
  .landing-mockup-float {
    box-shadow:
      2px 4px 6px -1px rgba(0, 0, 0, 0.55),
      6px 12px 20px -4px rgba(0, 0, 0, 0.5),
      12px 28px 48px -8px rgba(0, 0, 0, 0.45);
  }
`;

/** Primary tap target on landing (matches hero CTA height). */
export const landingTouchTargetClass =
  'min-h-12 flex items-center justify-center touch-manipulation';
