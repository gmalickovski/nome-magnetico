# Hero com a altura da tela

Padrão para seções hero que devem ocupar a tela inteira no primeiro carregamento, sem mostrar o começo da seção seguinte. Introduzido na DEV-112 (`src/frontend/components/landing/HeroSection.tsx`).

```tsx
<section className="relative min-h-svh flex items-center justify-center pt-24 pb-28 md:pt-28 md:pb-20">
  {/* conteúdo */}
</section>
```

- `min-h-svh` (Tailwind 3.4+): altura mínima = altura visível da tela (`100svh`). No celular, `svh` não pula quando a barra do navegador some ou aparece, ao contrário de `100vh`.
- Altura **mínima**, não fixa: em telas baixas o hero cresce com o conteúdo e nada é cortado.
- `flex items-center justify-center`: centraliza o conteúdo na vertical e na horizontal.
- `pt-*`: compensa o menu fixo (`LandingHeader`, ~84px no desktop). O `pb-*` reserva espaço para o indicador de scroll.
- Navegadores sem suporte a `svh` ignoram a regra e o hero fica com a altura do conteúdo.
