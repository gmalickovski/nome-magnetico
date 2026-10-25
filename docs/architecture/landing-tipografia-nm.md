# Sistema Tipográfico Unificado da Landing Page (DEV-231)

Este documento registra a especificação oficial de classes CSS canônicas (`.nm-*`) e as diretrizes de copywriting para a Landing Page do **Nome Magnético**, consolidando as decisões de Marca, Growth e Copywriting aprovadas em 25/10/2026.

---

## 1. Tokens de Cor e Tipografia

- **Famílias:**
  - Headings / Destaques: `Cinzel` (`400;700`).
  - Interface / Corpo / Overlines: `Inter` (`300;400;500;600;700`).
- **Cores Estáticas:**
  - Eyebrows / Overlines: `#D4AF37` (dourado primário estático).
  - Títulos (`h1` a `h4`): `#E5E2E1` (elimina mistura de branco puro e tons variantes).
  - Corpo (`.nm-body-lg` e `.nm-body`): `#A0A0A0` (cinza neutro para alto contraste e legibilidade).
  - Microcopy / Legendas (`.nm-caption`): `#6B7280` (`text-gray-500`).

---

## 2. Classes Canônicas (`src/styles/global.css`)

| Classe | Tag / Contexto | Mobile | sm (640px) | md (768px) | lg (1024px) | xl (1280px+) |
|---|---|---|---|---|---|---|
| `.nm-eyebrow` | Overlines acima de `h2`/`h3` | `12px` | `12px` | `13px` | `14px` | `14px` |
| `.nm-h1` | `<h1>` do Hero | `28px` (`1.75rem`) | `34px` (`2.125rem`) | `38px` (`2.375rem`) | `40px` (`2.5rem`) | `44px` (`2.75rem`) |
| `.nm-h2` | `<h2>` padrão de todas as seções | `24px` (`1.5rem`) | `28px` (`1.75rem`) | `32px` (`2rem`) | `36px` (`2.25rem`) | `40px` (`2.5rem`) |
| `.nm-h3` | `<h3>` em blocos largos (usos, preço, votação) | `18px` (`1.125rem`) | `20px` (`1.25rem`) | `22px` (`1.375rem`) | `24px` (`1.5rem`) | `24px` |
| `.nm-h4` | `<h4>` e cards estreitos (como funciona, footer) | `16px` (`1rem`) | `17px` (`1.0625rem`) | `18px` (`1.125rem`) | `18px` | `18px` |
| `.nm-body-lg` | Subtítulo do hero e intros de seção | `15px` | `16px` | `16px` | `17px` | `17px` |
| `.nm-body` | Parágrafos de cards, passos, entregáveis e FAQ | `14px` | `14px` | `15px` | `15px` | `15px` |
| `.nm-caption` | Microcopy, legendas, CNPJ e rodapé | `12px` | `12px` | `13px` | `13px` | `13px` |

---

## 3. Diretrizes de Copywriting (v3)

1. **Zero travessões entre frases:** proibido o uso de `—` ou `-` para separar frases em títulos, subtítulos, textos de cards, botões ou rodapé.
2. **Zero `×` em títulos:** substituir expressões como `nota hoje × potencial` por linguagem direta e natural.
3. **Zero jargões técnicos nos textos visíveis:** eliminar termos como `(N5)`, `score`, `ranking` e `Self-service`.
4. **Títulos cristalinos e imediatos:** sem ponto final e sem pontos no meio da frase do título.
5. **Preços dinâmicos:** preços nunca são chumbados no código, sempre vindos do HQ via componente `<Price>`.

---

## 4. Seção 4 (Onde Usar): Padrão Zigue-Zague

Substituiu o antigo carrossel de abas com scroll pinning por uma apresentação contínua:
- Cabeçalho geral `<h2>.nm-h2` centralizado no topo.
- 4 blocos empilhados verticalmente (`space-y-16 lg:space-y-28`).
- No desktop (`lg:`): zigue-zague com grid de 12 colunas (6 colunas texto / 6 colunas mockup), alternando:
  - Bloco 01: Texto à esquerda · Mockup à direita.
  - Bloco 02: Mockup à esquerda (`lg:order-1`) · Texto à direita (`lg:order-2`).
  - Bloco 03: Texto à esquerda · Mockup à direita.
  - Bloco 04: Mockup à esquerda (`lg:order-1`) · Texto à direita (`lg:order-2`).
- No mobile: ordem natural em todos os blocos (texto primeiro, mockup abaixo).
