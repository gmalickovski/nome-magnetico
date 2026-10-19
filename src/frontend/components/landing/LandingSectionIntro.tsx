import React from 'react';
import { getRevealItemProps } from './useLandingSectionReveal';

interface LandingSectionIntroProps {
  label?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  align?: 'center' | 'left';
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  /** Optional scroll reveal state to animate overline -> title -> description in stagger */
  revealed?: boolean;
  reduceMotion?: boolean;
}

/**
 * Single Master Container Shell (DEV-196.1 — Material Design 3 + Studio MLK Playbook).
 * Guarantees Grid Line Continuity across Header, Hero, Split Sections, and 3/4-Card Grids.
 * - Compact (<600px): 16px (px-4)
 * - Medium (600–839px): 24px (sm:px-6)
 * - Expanded (840–1199px): 40px (md:px-10)
 * - Large/Extra-large (1200px+): 48px (lg:px-12), max-w-[1440px] / 2xl:max-w-[1600px]
 */
export const landingSectionShellClass =
  'max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 w-full min-w-0';

/**
 * Standardized Vertical Rhythm for standard (non-sticky) landing sections.
 * Follows 8dp grid multiples across mobile, laptop 13"/14", and desktop.
 */
export const landingSectionSpacingClass = 'py-12 sm:py-16 md:py-20 lg:py-24';

/**
 * Standardized 12-Column Split Grid (M3 Layout Grid):
 * - Copy column: `lg:col-span-5` (~42% width -> optimal 45-65ch reading measure)
 * - Visual/Mockup column: `lg:col-span-7` (~58% width -> generous room for cards)
 */
export const landingSplitGridClass =
  'grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-center w-full min-w-0';

/** Hero / Section row rhythm: tighter on phone, opens on tablet/desktop. */
export const landingSectionStackGapClass = 'gap-8 md:gap-10 lg:gap-12 xl:gap-16';

/** Section heading rhythm aligned with HeroSection — no bordered card chrome. */
export function LandingSectionIntro({
  label,
  title,
  description,
  align = 'center',
  className = '',
  titleClassName = '',
  descriptionClassName = '',
  revealed = true,
  reduceMotion = false,
}: LandingSectionIntroProps) {
  const alignClass =
    align === 'center' ? 'text-center mx-auto' : 'text-center lg:text-left';

  const labelReveal = getRevealItemProps(revealed, 0, reduceMotion);
  const titleReveal = getRevealItemProps(revealed, 90, reduceMotion);
  const descReveal = getRevealItemProps(revealed, 180, reduceMotion);

  return (
    <div className={`${alignClass} min-w-0 ${className}`}>
      {label && (
        <p
          className={`text-[#f2ca50] text-xs md:text-sm font-bold uppercase tracking-[0.15em] mb-2.5 sm:mb-3 md:mb-3.5 ${labelReveal.className}`}
          style={labelReveal.style}
        >
          {label}
        </p>
      )}
      {title && (
        <h2
          className={`font-cinzel ${
            titleClassName ||
            'text-2xl sm:text-[1.65rem] md:text-3xl lg:text-[2.25rem] xl:text-[2.5rem] font-bold leading-[1.15]'
          } text-[#e5e2e1] mb-3.5 text-balance ${titleReveal.className}`}
          style={titleReveal.style}
        >
          {title}
        </h2>
      )}
      {description && (
        <p
          className={`text-gray-400 text-sm sm:text-base mt-4 sm:mt-5 leading-relaxed ${
            descriptionClassName || 'max-w-[58ch]'
          } text-pretty break-words ${
            align === 'center' ? 'mx-auto' : 'lg:mx-0 mx-auto'
          } ${descReveal.className}`}
          style={descReveal.style}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Hero & Primary Floating Panel (DEV-196.2).
 * Uses multi-layer realistic 3D shadow + top specular highlight + subtle glass blur.
 */
export const landingPanelClass =
  'nm-floating-card min-w-0';

/**
 * Floating mockup card — unified multi-layer 3D elevation across every landing section
 * (Hero, HowItWorks, Products, SignatureUseCases, Voting, FAQ).
 */
export const landingMockupFloatClass =
  'nm-floating-card min-w-0 w-full max-w-full';

/** Interactive floating card with hover lift and golden specular rim highlight. */
export const landingInteractiveCardClass =
  'nm-floating-card-interactive min-w-0 w-full max-w-full';

/** Compact floating tile for dense multi-card grids (e.g. 3-up suggestion cards). */
export const landingMockupTileClass =
  'nm-floating-tile min-w-0 w-full max-w-full';

/** @deprecated Use landingMockupFloatClass. */
export const landingMockupCardClass = landingMockupFloatClass;

/** Primary tap target on landing (matches hero CTA height >= 48px M3/Apple HIG). */
export const landingTouchTargetClass =
  'min-h-12 flex items-center justify-center touch-manipulation';

