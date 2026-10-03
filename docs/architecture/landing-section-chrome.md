# Landing section chrome (hero-aligned)

Home sections below the hero share spacing with `HeroSection`:

- **Layout:** `landingSectionShellClass` (`max-w-[1440px]`, `px-6 md:px-10 lg:px-12`, `min-w-0`).
- **Headings:** `LandingSectionIntro` — gold label (`#f2ca50`), Cinzel title (min `text-2xl` on phone), Inter body. No forced all-caps on labels.
- **Como funciona:** one row of four steps. The only titles are Frequência, Bloqueios, Arquétipo, Assinatura. The published sentence sits under each title. A static arrow `#B8960E` sits between steps. No icon card, no dash list. On a phone the steps stack and the arrow points down.
- **Produto:** Marketing's sentences on one side. On the other, the existing result panel (`HeroScoreAnimation`) — the same screen as the hero, including João Alberto da Silva, João Alberto Silva and score 95. Static low-contrast border `#D4AF37` (about 35% opacity). No animation. Phone: the pair stacks.
- **Preço:** one centered block. The only motion is its border, shifting `#D4AF37` → `#E8C84A`. `prefers-reduced-motion` holds the border at `#D4AF37`. Button is full width of the block. FAQ unchanged.

## Motion

`useLandingSectionReveal` changes **opacity only** once on enter (700ms ease). No translate, stagger, or bounce. `prefers-reduced-motion: reduce` skips the fade (no transition class).

The purchase border is the only looping motion. Product border and step arrows do not move.

## Mobile

- `landingSectionStackGapClass`: `gap-8` → `gap-16` like the hero grid.
- Product promise and result panel stack. Steps stack. Price block stays one column; the button stays full width.
- Sections use `overflow-x-hidden`; decorative blurs are width-capped on small screens.

Components: `LandingSectionIntro.tsx`, `useLandingSectionReveal.ts`, `ProductsSection`, `HowItWorksSection`, `PricingSection`, `HeroScoreAnimation`.
