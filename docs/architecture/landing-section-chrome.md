# Landing section chrome (hero-aligned)

Home sections below the hero share spacing with `HeroSection`:

- **Layout:** `landingSectionShellClass` (`max-w-[1440px]`, `px-6 md:px-10 lg:px-12`, `min-w-0`).
- **Headings:** `LandingSectionIntro` — gold label (`#f2ca50`), Cinzel title (min `text-2xl` on phone), Inter body. No forced all-caps on labels.
- **Como funciona:** four cards in one row. Each card has one locked line figure in `#D4AF37`, then the short title and the one published sentence: Frequência / Bloqueios / Ranking / Assinatura. Dark ground `#131313`, kit border `#D4AF37` at 35% opacity, `rounded-2xl`. A static arrow `#B8960E` sits between cards. Ranking lives only on card 3. No person, no fifth figure, no light card, no giant step name. On a phone the cards stack and the arrow points down.
- **Produto (duas seções):** `#produtos` (Harmonização) e `#sugestoes` (Sugestões Inteligentes). Layout em 2 colunas a partir de **840px** (Expanded); abaixo disso empilha (texto → mockup) — mobile não precisa caber numa única viewport. **Sem tray/container escuro**. Cards usam `landingMockupFloatClass` com sombra **em camadas** e ângulo de luz compartilhado (Y ≈ 2× X): contact + ambient, silhueta ≈ tamanho do card deslocada — não glow centrado. No desktop, `useDesktopMockupFit` aplica `zoom` para o mockup caber na viewport. Copy sem `opacity-0` no reveal.
- **Preço:** one centered block on `#111111`, the same ground as the neighboring sections. Inside, only this order: small “Nome Social.”; the amount alone in large Cinzel `#D4AF37`; small “pagamento único, sem mensalidade.”; the five-item list (ranking com score; nome mais indicado; antes e depois nos 4 triângulos; bloqueios, débitos, lições e tendências; PDF com guia de 30 dias e folha de treino da assinatura); “Acesso na hora.” and “Sete dias de garantia.” on their own lines; the button, full width of the block. The only motion is the border, shifting `#D4AF37` → `#E8C84A`. `prefers-reduced-motion` holds the border at `#D4AF37`. Vertical padding is tighter than the other sections so the block sits with the page. FAQ unchanged.
- **Header:** the desktop row stays hidden until the logo and the links fit. Below that width the existing hamburger is used, so the wordmark stays whole and the items do not collide.

## Motion

`useLandingSectionReveal` fades and rises once on enter: 400ms ease-out, 8px (`translate-y-2`), fires at `threshold: 0` with a small bottom `rootMargin` so tall product sections do not stay blank while scrolling in. `prefers-reduced-motion: reduce` shows the section still (no transition class).

**Produto:** `ProductHarmonyFrame` anima scores no enter (IntersectionObserver). `ProductSuggestionsFrame` staggered reveal dos cards. Sem loop crossfade entre as duas seções (são blocos separados).

The purchase border remains the only continuous border loop. Step arrows do not move.

## Mobile

- `landingSectionStackGapClass`: `gap-8` → `gap-16` like the hero grid.
- Product copy and mockup frames stack below 840px (phone, tablet portrait, fold closed). Suggestion grids: 1 col → 2 @ container 420px → 3 @ 640px. Price block stays one column; the button stays full width.
- Sections use `overflow-x-hidden`; decorative blurs are width-capped on small screens.

Components: `LandingSectionIntro.tsx`, `useLandingSectionReveal.ts`, `ProductsSection`, `HowItWorksSection`, `HowItWorksFigures`, `ProductResultFrame`, `ProductAnimatedScore`, `PricingSection`, `HeroScoreAnimation` (hero only).
