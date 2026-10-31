# Padrões de Responsividade Multi-Tela (Multi-Device UI/UX)

Este documento estabelece as diretrizes arquiteturais e padrões de implementação para garantir que todas as interfaces do **Nome Magnético** funcionem com excelência visual, ergonomia e zero defeitos visuais em qualquer formato de tela do mercado — desde dobráveis ultra-compactos até monitores ultrawide.

---

## 1. Matriz de Dispositivos e Viewports

| Categoria | Viewport CSS Típico | Dispositivos de Referência | Desafios Principais |
|---|---|---|---|
| **Foldables Fechados / Compactos** | `280px` – `360px` | Galaxy Z Fold (Cover screen `280px–344px`), iPhone 12/13 Mini (`360px`), iPhone SE (`320px`) | Risco de overflow horizontal, botões quebrando em 2 linhas, paddings laterais engolindo área útil |
| **Smartphones Padrão** | `375px` – `430px` | iPhone 14/15/16/Pro Max, Samsung Galaxy S23/S24 | Clearance da dock flutuante (`AppMobileNavDock`) e safe area |
| **Foldables Abertos / Quase Quadrados** | `712px` – `884px` (altura similar à largura) | Galaxy Z Fold aberto, Pixel Fold | Grids de 3 colunas em `md:` espremem cards para `<210px`. Modais altos podem cortar CTAs inferiores |
| **Tablets / iPads** | `768px` – `1024px` (portrait) / `1024px` – `1366px` (landscape) | iPad Mini (`744x1133`), iPad Air (`820x1180`), iPad Pro (`1024x1366`) | Touch targets de 44px, transição ergonômica entre modo em pé e deitado |
| **Notebooks 13" – 14"** | `1280x720`, `1366x768`, `1440x900`, `1512x982` | MacBook Air/Pro 13"/14", Laptops Windows com escala 125%/150% | Altura vertical limitada (`720px–800px` úteis). Evitar que o CTA fique enterrado abaixo da primeira dobra |
| **Desktop e Ultrawide** | `1920x1080`, `2560x1440`, `3440x1440` a `3840x1600` | Monitores Full HD, QHD 27", Ultrawide 34"–39", 4K | Evitar que cards, tabelas e textos estiquem infinitamente pela tela inteira |

---

## 2. Princípios de Implementação

### 2.1 Container Shell e Limites Ultrawide
Em nenhuma hipótese um container de conteúdo deve se espalhar infinitamente sem limites em monitores widescreen/ultrawide.
* **Padrão Landing & Público**: `max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-3.5 sm:px-6 md:px-10 lg:px-12` (definido em `landingSectionShellClass`).
* **Padrão App (`AppLayout.astro`)**:
  ```astro
  <main class={noPadding ? "md:ml-20 h-full overflow-x-hidden" : "md:ml-20 px-3.5 sm:px-6 md:px-10 lg:px-14 py-6 sm:py-8 md:py-10 pb-24 md:pb-10 overflow-x-hidden"}>
    <div class={noPadding ? "h-full" : "max-w-[1440px] 2xl:max-w-[1600px] mx-auto w-full"}>
      <slot />
    </div>
  </main>
  ```
* **Padrão Admin / Operação (`AdminLayout.astro`)**:
  ```astro
  <div class="min-w-0">
    <div class="max-w-[1440px] 2xl:max-w-[1600px] mx-auto w-full">
      <header class="px-3.5 sm:px-5 py-6 sm:py-8 md:px-10">...</header>
      <div class="px-3.5 sm:px-5 pb-16 md:px-10"><slot /></div>
    </div>
  </div>
  ```

### 2.2 Preservação de Área Útil em Telas Compactas (280px–360px)
* **Padding Adaptativo**: Usar `px-3.5 sm:px-6` (14px nas bordas) em vez de `px-6` (24px nas bordas). Em uma tela de `280px`, `px-6` consome 48px (17% da tela), enquanto `px-3.5` consome apenas 28px, preservando 252px de área útil.
* **Dock mobile (`AppMobileNavDock.tsx`)**:
  * Barra flutuante (glass) com ícones circulares, tooltips e mesma linguagem visual da dock de ações do chat.
  * Variáveis CSS em `global.css` (`--nm-mobile-dock-clearance`, `--nm-mobile-dock-stacked-clearance`) definem padding inferior do conteúdo.

### 2.3 Tipografia Fluida com `clamp()`
Para evitar truncamento ou quebras bizarras de palavras em telas pequenas sem prejudicar o impacto em telas grandes:
```css
.text-fluid-hero {
  font-size: clamp(1.85rem, 5vw + 0.5rem, 3.5rem);
  line-height: 1.15;
}
.text-fluid-h1 {
  font-size: clamp(1.5rem, 4vw + 0.25rem, 2.75rem);
  line-height: 1.2;
}
.text-fluid-h2 {
  font-size: clamp(1.25rem, 3vw + 0.25rem, 2rem);
  line-height: 1.25;
}
```

### 2.4 SVG e Visualizações Numerológicas (`TriangleVisualization.tsx`)
* **Pirâmides SVG**: Devem sempre usar `overflow-x-auto touch-scroll-container` e `preserveAspectRatio="xMidYMid meet"`.
* **Abas do Triângulo**: Em telas estreitas, abas de navegação utilizam `min-w-[105px] sm:min-w-[130px]` e `px-2.5 sm:px-3` para que se ajustem em 2 colunas perfeitamente alinhadas sem quebra de texto.

### 2.5 Floating Action Buttons e Safe Area
* O botão flutuante mobile de download de PDF (`PDFFeedbackButton.tsx`):
  * Usa `--nm-mobile-dock-stacked-clearance` quando há dock de ações + nav empilhadas.
  * Largura responsiva `left-3 right-3 sm:left-4 sm:right-4 max-w-md mx-auto` com `text-xs sm:text-sm font-bold`, impedindo que o texto "BAIXAR ANÁLISE COMPLETA" quebre em duas linhas em telas de `280px–340px`.

---

## 3. Checklist de Validação Responsiva

Antes de qualquer release, verificar os seguintes pontos em DevTools:
1. [ ] **280px (Galaxy Fold Cover)**: Zero overflow horizontal na horizontal (`window.innerWidth === document.documentElement.scrollWidth`).
2. [ ] **375px (iPhone Mini/SE)**: Touch targets confortáveis, formulário de análise e cards de resultado perfeitamente legíveis.
3. [ ] **768px–884px (Foldable aberto / iPad portrait)**: Grids de cards distribuídos simetricamente (não 3 colunas espremidas).
4. [ ] **1366x768 (Notebook 13"–14")**: Elementos da primeira dobra visíveis sem rolagem desnecessária.
5. [ ] **2560px–3440px (Ultrawide)**: Todo o conteúdo permanece centralizado e esteticamente contido no shell de 1440px/1600px.
