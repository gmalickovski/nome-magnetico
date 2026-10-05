# Landing section chrome (hero-aligned)

Home sections below the hero share spacing with `HeroSection`:

- **Layout:** `landingSectionShellClass` (`max-w-[1440px]`, `px-6 md:px-10 lg:px-12`, `min-w-0`).
- **Headings:** `LandingSectionIntro` — gold label (`#f2ca50`), Cinzel title (min `text-2xl` on phone), Inter body. No forced all-caps on labels.
- **Como funciona:** four cards in one row. Each card has one locked line figure in `#D4AF37`, then the short title and the one published sentence: Frequência / Bloqueios / Ranking / Assinatura. Dark ground `#131313`, kit border `#D4AF37` at 35% opacity, `rounded-2xl`. A static arrow `#B8960E` sits between cards. Ranking lives only on card 3. No person, no fifth figure, no light card, no giant step name. On a phone the cards stack and the arrow points down.
- **Produto:** left copy is **sticky** on desktop (`lg:sticky lg:top-28 lg:self-start`) — top aligns under the header with the card top; bottom releases with the card bottom (no `translate` centering, which invaded the section above). Text blocks fade/rise in staggered 800ms. Right mock: certificate rows stack on phone (`flex-col` → `md:flex-row`), score bars stay inside `overflow-hidden` containers. Sequence: certificate → score count-up → hold → suggestions. Product border `#D4AF37`. Phone: columns stack, no sticky.
- **Preço:** one centered block on `#111111`, the same ground as the neighboring sections. Inside, only this order: small “Nome Social.”; the amount alone in large Cinzel `#D4AF37`; small “pagamento único, sem mensalidade.”; the five-item list (ranking com score; nome mais indicado; antes e depois nos 4 triângulos; bloqueios, débitos, lições e tendências; PDF com guia de 30 dias e folha de treino da assinatura); “Acesso na hora.” and “Sete dias de garantia.” on their own lines; the button, full width of the block. The only motion is the border, shifting `#D4AF37` → `#E8C84A`. `prefers-reduced-motion` holds the border at `#D4AF37`. Vertical padding is tighter than the other sections so the block sits with the page. FAQ unchanged.
- **Header:** the desktop row stays hidden until the logo and the links fit. Below that width the existing hamburger is used, so the wordmark stays whole and the items do not collide.

## Motion

`useLandingSectionReveal` fades and rises once on enter: 600ms ease-out, 12px (`translate-y-3`). `prefers-reduced-motion: reduce` shows the section still (no transition class).

**Produto (`ProductResultFrame`):** sequence on viewport enter — harmony card fade-in → score count-up → hold ~5s → suggestions. Loop ~16s. Left copy sticky with `top-28` (header clearance), confined to the product grid row.

The purchase border remains the only continuous border loop. Step arrows do not move.

## Mobile

- `landingSectionStackGapClass`: `gap-8` → `gap-16` like the hero grid.
- Product copy and result frame stack. Cards stack. Price block stays one column; the button stays full width.
- Sections use `overflow-x-hidden`; decorative blurs are width-capped on small screens.

Components: `LandingSectionIntro.tsx`, `useLandingSectionReveal.ts`, `ProductsSection`, `HowItWorksSection`, `HowItWorksFigures`, `ProductResultFrame`, `ProductAnimatedScore`, `PricingSection`, `HeroScoreAnimation` (hero only).
