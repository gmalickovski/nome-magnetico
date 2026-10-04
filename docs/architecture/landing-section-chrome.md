# Landing section chrome (hero-aligned)

Home sections below the hero share spacing with `HeroSection`:

- **Layout:** `landingSectionShellClass` (`max-w-[1440px]`, `px-6 md:px-10 lg:px-12`, `min-w-0`).
- **Headings:** `LandingSectionIntro` — gold label (`#f2ca50`), Cinzel title (min `text-2xl` on phone), Inter body. No forced all-caps on labels.
- **Como funciona:** one full-width row. The only large type is the step name — Frequência, Bloqueios, Arquétipo, Assinatura — at the hero heading size. The published sentence under each name stays small. A static arrow `#B8960E` sits between steps. No icon card, no dash list, no feature grid, no device. On a phone the steps stack and the arrow points down.
- **Produto:** large title “Sua assinatura de nome social.” at the hero heading size. Under it, the smaller line “Do nome de nascimento à assinatura que você usa no dia a dia.” The published calculation sentence is smaller still and sits beside the existing result panel (`HeroScoreAnimation`), the same screen as the hero. The panel stays flat and readable; no device frame. Static low-contrast border `#D4AF37` (about 35% opacity). No animation. Phone: the pair stacks.
- **Preço:** one centered block on `#111111`, the same ground as the neighboring sections. Inside, only this order: small “Nome Social.”; the amount alone in large Cinzel `#D4AF37`; small “pagamento único, sem mensalidade.”; small “ranking, nome recomendado e variações. Acesso na hora. Sete dias de garantia.”; the button, full width of the block. The only motion is the border, shifting `#D4AF37` → `#E8C84A`. `prefers-reduced-motion` holds the border at `#D4AF37`. Vertical padding is tighter than the other sections so the block sits with the page. FAQ unchanged.
- **Header:** the desktop row stays hidden until the logo and the links fit. Below that width the existing hamburger is used, so the wordmark stays whole and the items do not collide.

## Motion

`useLandingSectionReveal` fades and rises once on enter: 600ms ease-out, 12px (`translate-y-3`). No bounce, parallax, stagger, or loop. `prefers-reduced-motion: reduce` shows the section still (no transition class).

The purchase border is the only looping motion. Product border and step arrows do not move.

## Mobile

- `landingSectionStackGapClass`: `gap-8` → `gap-16` like the hero grid.
- Product promise and result panel stack. Steps stack. Price block stays one column; the button stays full width.
- Sections use `overflow-x-hidden`; decorative blurs are width-capped on small screens.

Components: `LandingSectionIntro.tsx`, `useLandingSectionReveal.ts`, `ProductsSection`, `HowItWorksSection`, `PricingSection`, `HeroScoreAnimation`.
