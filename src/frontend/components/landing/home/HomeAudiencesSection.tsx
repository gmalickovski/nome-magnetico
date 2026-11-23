import {
  LandingSectionIntro,
  landingInteractiveCardClass,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from '../LandingSectionIntro.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import { HOME_COPY } from './home-copy.js';

function MiniPreview({ id }: { id: 'social' | 'artistico' | 'bebe' }) {
  if (id === 'social') {
    return (
      <div
        aria-hidden="true"
        className="h-14 w-14 rounded-2xl bg-[#141310] ring-1 ring-[#D4AF37]/25 flex items-center justify-center shrink-0 shadow-inner"
      >
        <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
          <polygon
            points="24,5 29.5,17 42,18.5 32.5,27 35,39.5 24,33 13,39.5 15.5,27 6,18.5 18.5,17"
            stroke="#f2ca50"
            strokeWidth="1.6"
            fill="rgba(212, 175, 55, 0.14)"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="23" r="3.2" fill="#f2ca50" />
        </svg>
      </div>
    );
  }

  if (id === 'artistico') {
    return (
      <div
        aria-hidden="true"
        className="h-14 w-14 rounded-2xl bg-[#181421] ring-1 ring-[#bea5ff]/30 flex items-center justify-center shrink-0 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-75"
          style={{
            background:
              'radial-gradient(circle at 50% 18%, rgba(190, 165, 255, 0.45), rgba(242, 202, 80, 0.14) 52%, transparent 78%)',
          }}
        />
        <svg viewBox="0 0 48 48" className="relative z-10 w-8 h-8" fill="none">
          <path d="M24 8L10 38h28L24 8z" fill="url(#spotBeam)" />
          <circle cx="24" cy="11" r="4" fill="#d7c6ff" />
          <ellipse cx="24" cy="38" rx="12" ry="3" fill="#f2ca50" fillOpacity="0.45" />
          <defs>
            <linearGradient id="spotBeam" x1="24" y1="8" x2="24" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#bea5ff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#f2ca50" stopOpacity="0.12" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="h-14 w-14 rounded-2xl bg-[#1b171d] ring-1 ring-[#F5C6CE]/35 flex items-center justify-center shrink-0 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 30% 25%, rgba(245, 198, 206, 0.25), rgba(188, 227, 215, 0.18) 60%, transparent 82%)',
        }}
      />
      <svg viewBox="0 0 48 48" className="relative z-10 w-8 h-8" fill="none">
        <path
          d="M24 38.5S11 30.2 11 20.5a7.2 7.2 0 0 1 13-4.2 7.2 7.2 0 0 1 13 4.2c0 9.7-13 18-13 18z"
          fill="#F5C6CE"
          fillOpacity="0.32"
          stroke="#F5C6CE"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="23" r="2.6" fill="#BCE3D7" />
      </svg>
    </div>
  );
}

/**
 * Seção 2 da Home (`DEV-338`): Para quem é (Nome Social, Nome Artístico, Nome do Bebê).
 */
export function HomeAudiencesSection() {
  const reveal = useLandingSectionReveal({ startRevealed: false });
  const copy = HOME_COPY.audiences;

  return (
    <section
      id="para-quem-e"
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
          className="mb-10 sm:mb-14"
          revealed={reveal.revealed}
          reduceMotion={reveal.reduceMotion}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {copy.cards.map((card, idx) => {
            const itemReveal = getRevealItemProps(
              reveal.revealed,
              120 + idx * 100,
              reveal.reduceMotion,
            );
            const isBebe = card.id === 'bebe';
            const isArtistic = card.id === 'artistico';
            const badgeColor = isBebe
              ? 'text-[#F5C6CE] bg-[#F5C6CE]/10'
              : isArtistic
                ? 'text-[#d7c6ff] bg-[#bea5ff]/12'
                : 'text-[#f2ca50] bg-[#D4AF37]/12';

            return (
              <article
                key={card.id}
                className={`${landingInteractiveCardClass} rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6 transition-all duration-700 hover:-translate-y-1.5 ${itemReveal.className}`}
                style={itemReveal.style}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-inter font-semibold uppercase tracking-[0.14em] ${badgeColor}`}
                    >
                      {card.badge}
                    </span>
                    <MiniPreview id={card.id} />
                  </div>

                  <div>
                    <h3 className="nm-h3 mb-2 text-[#e5e2e1]">{card.title}</h3>
                    <p className="nm-body">{card.description}</p>
                  </div>

                  <ul className="space-y-2 pt-1">
                    {card.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs sm:text-sm font-inter text-[#e5e2e1]/85">
                        <span
                          className={
                            isBebe
                              ? 'text-[#BCE3D7] text-xs shrink-0'
                              : isArtistic
                                ? 'text-[#bea5ff] text-xs shrink-0'
                                : 'text-[#D4AF37] text-xs shrink-0'
                          }
                          aria-hidden="true"
                        >
                          ✦
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={card.href}
                  data-cta-id={card.ctaId}
                  data-cta-position="home_para_quem_e"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#242424] hover:bg-[#D4AF37] text-[#e5e2e1] hover:text-[#131313] font-inter font-semibold text-sm px-5 py-3 transition-colors duration-500 ring-1 ring-white/[0.08]"
                >
                  {card.ctaLabel}
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HomeAudiencesSection;
