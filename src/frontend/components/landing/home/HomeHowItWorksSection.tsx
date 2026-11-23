import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  LandingSectionIntro,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from '../LandingSectionIntro.js';
import { PathChooserScene } from '../mockups/PathChooserScene.js';
import { PdfFlipScene } from '../mockups/PdfFlipScene.js';
import { SuggestionCardsScene } from '../mockups/SuggestionCardsScene.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import { HOME_COPY } from './home-copy.js';

interface HowItWorksStepRowProps {
  stepNumber: string;
  title: string;
  description: string;
  anchorId: string;
  reverse?: boolean;
  onBecomeVisible: (index: number) => void;
  index: number;
  children: ReactNode;
}

function HowItWorksStepRow({
  stepNumber,
  title,
  description,
  anchorId,
  reverse = false,
  onBecomeVisible,
  index,
  children,
}: HowItWorksStepRowProps) {
  const reveal = useLandingSectionReveal({ startRevealed: false });
  const textReveal = getRevealItemProps(reveal.revealed, 0, reveal.reduceMotion);
  const mockupReveal = getRevealItemProps(reveal.revealed, 120, reveal.reduceMotion);

  useEffect(() => {
    if (reveal.revealed) {
      onBecomeVisible(index);
    }
  }, [reveal.revealed, index, onBecomeVisible]);

  return (
    <div
      id={anchorId}
      ref={reveal.ref}
      data-home-step={stepNumber}
      data-step-lit={reveal.revealed ? 'true' : 'false'}
      className={`scroll-mt-28 flex flex-col ${
        reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
      } items-center gap-8 lg:gap-12 w-full min-w-0`}
    >
      <div
        className={`w-full lg:w-[36%] min-w-0 text-center lg:text-left ${textReveal.className}`}
        style={textReveal.style}
      >
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-cinzel font-bold tracking-[0.16em] uppercase mb-3 transition-colors duration-700 ${
            reveal.revealed
              ? 'bg-[#D4AF37]/15 text-[#f2ca50] ring-1 ring-[#D4AF37]/40'
              : 'bg-[#1c1c1c] text-[#a0a0a0] ring-1 ring-white/[0.08]'
          }`}
        >
          <span>Passo {stepNumber}</span>
        </div>
        <h3 className="nm-h3 text-[#e5e2e1] mb-3">{title}</h3>
        <p className="nm-body-lg max-w-[48ch] mx-auto lg:mx-0">{description}</p>
      </div>

      <div
        className={`w-full lg:w-[64%] min-w-0 ${mockupReveal.className}`}
        style={mockupReveal.style}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Seção 3 da Home (`DEV-338`): Como funciona em 3 passos que acendem no scroll.
 */
export function HomeHowItWorksSection() {
  const headerReveal = useLandingSectionReveal({ startRevealed: false });
  const copy = HOME_COPY.howItWorks;
  const [litSteps, setLitSteps] = useState<boolean[]>([false, false, false]);
  const [activeIndex, setActiveIndex] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  const handleVisible = (idx: number) => {
    setActiveIndex(idx);
    setLitSteps((prev) => {
      if (prev[idx]) return prev;
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  };

  return (
    <section
      id="como-funciona"
      ref={headerReveal.ref}
      aria-label={copy.eyebrow}
      className={`relative bg-[#111111] overflow-x-clip scroll-mt-20 ${landingSectionSpacingClass}`}
    >
      <div className={landingSectionShellClass}>
        <LandingSectionIntro
          label={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          align="center"
          className="mb-8 sm:mb-10"
          revealed={headerReveal.revealed}
          reduceMotion={headerReveal.reduceMotion}
        />

        {/* Pílulas de etapa que acendem conforme a rolagem */}
        <div
          ref={railRef}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12 sm:mb-16"
        >
          {copy.steps.map((step, idx) => {
            const isLit = litSteps[idx] || idx === activeIndex;
            return (
              <a
                key={step.number}
                href={`#como-passo-${step.number}`}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-inter font-medium transition-all duration-500 ${
                  isLit
                    ? 'bg-gradient-to-r from-[#d7c6ff]/15 via-[#bea5ff]/18 to-[#f2ca50]/18 text-[#f2ca50] ring-1 ring-[#D4AF37]/40'
                    : 'bg-[#1c1c1c] text-[#a0a0a0] hover:text-[#e5e2e1] ring-1 ring-white/[0.06]'
                }`}
              >
                <span className="font-cinzel font-bold">{step.number}</span>
                <span className="hidden sm:inline">{step.title}</span>
              </a>
            );
          })}
        </div>

        <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20 lg:space-y-24">
          <HowItWorksStepRow
            stepNumber={copy.steps[0].number}
            title={copy.steps[0].title}
            description={copy.steps[0].description}
            anchorId="como-passo-01"
            index={0}
            onBecomeVisible={handleVisible}
          >
            <PathChooserScene device="phone" theme="social" />
          </HowItWorksStepRow>

          <HowItWorksStepRow
            stepNumber={copy.steps[1].number}
            title={copy.steps[1].title}
            description={copy.steps[1].description}
            anchorId="como-passo-02"
            reverse
            index={1}
            onBecomeVisible={handleVisible}
          >
            <SuggestionCardsScene device="both" theme="social" />
          </HowItWorksStepRow>

          <HowItWorksStepRow
            stepNumber={copy.steps[2].number}
            title={copy.steps[2].title}
            description={copy.steps[2].description}
            anchorId="como-passo-03"
            index={2}
            onBecomeVisible={handleVisible}
          >
            <PdfFlipScene device="both" theme="social" />
          </HowItWorksStepRow>
        </div>
      </div>
    </section>
  );
}

export default HomeHowItWorksSection;
