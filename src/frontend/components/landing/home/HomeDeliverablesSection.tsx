import { useCallback, useState } from 'react';
import {
  LandingSectionIntro,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from '../LandingSectionIntro.js';
import { PdfFlipScene } from '../mockups/PdfFlipScene.js';
import type { MockupTheme } from '../mockups/types.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import { HOME_COPY } from './home-copy.js';

/**
 * Seção 6 da Home (`DEV-338`): O que você leva (PDF nas 3 versões com troca automática e abas).
 */
export function HomeDeliverablesSection() {
  const reveal = useLandingSectionReveal({ startRevealed: false });
  const copy = HOME_COPY.deliverables;

  const [selectedTheme, setSelectedTheme] = useState<MockupTheme>('social');
  const [displayedTheme, setDisplayedTheme] = useState<MockupTheme>('social');
  // Troca automática sempre ligada; a aba clicada vira o ponto de partida da troca.
  const autoCycle = true;

  const handleSelectTab = (theme: MockupTheme) => {
    setSelectedTheme(theme);
    setDisplayedTheme(theme);
  };

  const handleActiveThemeChange = useCallback((theme: MockupTheme) => {
    setDisplayedTheme(theme);
  }, []);

  const currentTabTheme = autoCycle ? displayedTheme : selectedTheme;
  const bodyReveal = getRevealItemProps(reveal.revealed, 120, reveal.reduceMotion);

  return (
    <section
      id="o-que-voce-leva"
      ref={reveal.ref}
      aria-label={copy.eyebrow}
      className={`relative bg-[#131313] overflow-x-clip scroll-mt-20 ${landingSectionSpacingClass}`}
    >
      <div className={landingSectionShellClass}>
        <LandingSectionIntro
          label={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          align="center"
          className="mb-8 sm:mb-10"
          revealed={reveal.revealed}
          reduceMotion={reveal.reduceMotion}
        />

        <div
          className={`flex flex-wrap items-center justify-center gap-2.5 mb-8 sm:mb-10 ${bodyReveal.className}`}
          style={bodyReveal.style}
        >
          {copy.tabs.map((tab) => {
            const active = currentTabTheme === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelectTab(tab.id)}
                className={`min-h-11 rounded-full px-5 py-2.5 text-xs sm:text-sm font-inter font-semibold transition-all duration-300 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#d7c6ff]/20 via-[#bea5ff]/25 to-[#f2ca50]/20 text-[#f2ca50] ring-1 ring-[#bea5ff]/50 shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
                    : 'bg-[#1c1c1c] text-[#a0a0a0] hover:text-[#e5e2e1] ring-1 ring-white/[0.06]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

        </div>

        <div
          className={`max-w-5xl mx-auto ${bodyReveal.className}`}
          style={bodyReveal.style}
        >
          <PdfFlipScene
            device="both"
            theme={selectedTheme}
            autoCycleThemes={autoCycle}
            onActiveThemeChange={handleActiveThemeChange}
          />
        </div>
      </div>
    </section>
  );
}

export default HomeDeliverablesSection;
