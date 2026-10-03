# Landing section chrome (hero-aligned)

Home sections below the hero share spacing with `HeroSection`:

- **Layout:** `landingSectionShellClass` (`max-w-[1440px]`, `px-6 md:px-10 lg:px-12`, `min-w-0`).
- **Headings:** `LandingSectionIntro` — gold label (`#f2ca50`), Cinzel title (min `text-2xl` on phone), Inter body. No forced all-caps on labels.
- **Product / Como funciona / Preço:** editorial blocks only — no gold border cards, icons, or dash lists. FAQ unchanged on this track.

## Motion

`useLandingSectionReveal` fades the section in once on enter (700ms ease, slight translate). `prefers-reduced-motion: reduce` shows content immediately with no transition. No bounce, scale, stagger, or magnet gesture.

## Mobile

- `landingSectionStackGapClass`: `gap-8` → `gap-16` like the hero grid.
- Copy uses `max-w-prose`; pricing CTA `min-h-12`, full width on narrow viewports.
- Sections use `overflow-x-hidden`; decorative blurs are width-capped on small screens.

Components: `LandingSectionIntro.tsx`, `useLandingSectionReveal.ts`, `ProductsSection`, `HowItWorksSection`, `PricingSection`.
