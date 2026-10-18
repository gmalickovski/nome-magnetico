# Arquitetura de Layout, Grid 12 Colunas (M3), Elevação 3D e Animações da Landing Page

Referência: **DEV-196** (`DEV-197`, **DEV-198**, **DEV-199**) e [Playbook Frontend Studio MLK](https://linear.app/studio-mlk/document/playbook-frontend-layout-tipografia-mobilefold-4ad2081fba87).

## 1. Shell Canônico e Continuidade de Linhas de Grade (Grid Line Continuity)

Todas as seções da Landing Page (`src/pages/index.astro` e `src/frontend/components/landing/*`), incluindo `LandingHeader` e `LandingFooter`, compartilham o mesmo container canônico exportado em `LandingSectionIntro.tsx`:

```ts
export const landingSectionShellClass =
  'max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 w-full min-w-0';
```

### Regras de Alinhamento Horizontal
- **Proibido aninhar `max-w-*` restritivos** (`max-w-5xl`, `max-w-6xl`, `max-w-xl`) em seções split ou grades de 3/4 cards. A borda esquerda da coluna de texto (ou do primeiro card da grade) e a borda direita do mockup (ou do último card da grade) devem alinhar 1:1 com a logo e o CTA do `LandingHeader`.
- **Exceção intencional**: Apenas seções puramente centradas de coluna única (card único de Preço em `max-w-xl` e Acordeão de FAQ em `max-w-3xl`) usam largura reduzida centralizada dentro do `landingSectionShellClass`.
- **Proibido `CSS zoom` dinâmico em mockups**: Nunca escalar largura/altura de mockups via `el.style.zoom` baseado em `window.innerHeight`, pois isso quebra a continuidade horizontal entre seções adjacentes em notebooks de 13" e 14" (`1280×720`, `1366×768`, `1440×900`).

---

## 2. Grid Assimétrico de 12 Colunas (Material Design 3)

Seções split (Hero, Diagnóstico `#produtos`, Harmonização `#sugestoes`, Onde Usar `#onde-usar`) utilizam o grid canônico de 12 colunas:

```ts
export const landingSplitGridClass =
  'grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-center w-full min-w-0';
```

- **Coluna de narrativa/copy**: `lg:col-span-5` (~41.6% da largura útil), garantindo medida tipográfica ideal de `45ch–62ch` sem esticar linhas.
- **Coluna de mockup/interação**: `lg:col-span-7` (~58.3% da largura útil), preenchendo `w-full` até a guia direita do container.

---

## 3. Ritmo Vertical e Separação Tonal (No-Line Rule)

Espaçamento vertical padronizado entre todas as seções de conteúdo:

```ts
export const landingSectionSpacingClass =
  'py-20 md:py-24 lg:py-28 xl:py-32';
```

A separação entre seções respeita a regra **NO-LINE** (`DESIGN.md`), alternando camadas tonais (`#131313` Void e `#111111` Tonal Low) sem `border-y`:
1. `#hero`: `#131313` (+ radial aura)
2. `#como-funciona`: `#131313`
3. `#produtos` (Diagnóstico): `#111111`
4. `#sugestoes` (Harmonização): `#131313`
5. `#onde-usar` (Assinatura no dia a dia): `#131313`
6. `#teste` (Calculadora Gratuita): `#111111`
7. `#precos` (Investimento): `#131313`
8. `#votacao-proximo-produto`: `#111111`
9. `#faq`: `#131313`
10. `LandingFooter`: `#0a0a0a`

---

## 4. Sistema de Elevação e Sombras 3D Realistas para Cards Flutuantes

Definido em `src/styles/global.css` e re-exportado em `LandingSectionIntro.tsx`, substituindo sombras chapadas de 1 camada por uma composição física de 4 camadas inspirada em Material Design 3 (dark mode surface tonal + ambient/key shadow) e Linear/Raycast (luz especular de topo):

1. **Top Specular Rim Light**: `inset 0 1px 0 0 rgba(255, 255, 255, 0.09)` — simula luz zenital incidindo na quina superior do card.
2. **Subtle Inner Ring**: `inset 0 0 0 1px rgba(255, 255, 255, 0.04)` — contorno físico de baixa opacidade.
3. **Contact Shadow**: `0 2px 4px -1px rgba(0, 0, 0, 0.5)` — ancoragem imediata.
4. **Key + Ambient Umbra**: `0 14px 30px -6px rgba(0, 0, 0, 0.68), 0 32px 64px -12px rgba(0, 0, 0, 0.82)` — profundidade atmosférica suave.

Classes utilitárias:
- `.nm-floating-card` (`landingMockupFloatClass`): painéis e mockups flutuantes principais.
- `.nm-floating-card-interactive` (`landingInteractiveCardClass`): cards clicáveis/hoveráveis (elevação dinâmica `translateY(-4px)` + rim light dourado no hover).
- `.nm-floating-tile` (`landingMockupTileClass`): sub-cards internos dentro de mockups.

---

## 5. Animações de Scroll e Stagger (`useLandingSectionReveal`)

- Curva de desaceleração unificada: `duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]` (M3 Emphasized Decelerate), com deslocamento sutil `translate-y-6` (`24px`).
- Helper `getRevealItemProps(revealed, delayMs, reduceMotion)` aplica *stagger* progressivo (`0ms` eyebrow → `80ms` título → `160ms` subtítulo → `180ms+` cards/mockups).
- As animações internas de barra e arco de pontuação (`ProductAnimatedScore` e `HeroScoreAnimation`) permanecem independentes e preservadas.
