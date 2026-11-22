# Landing: estrutura das páginas e animações (DEV-334 / DEV-335)

Especificação visual da home e das páginas de nicho (Nome Social, Nome Artístico, Nome do Bebê).
**Textos ficam em aberto:** onde aparece `[TEXTO]`, usar o texto de exemplo só como marcador; a copy final vem de Marketing/Growth (estudo da DEV-334). Esta etapa é visual: layout, componentes e animações.

Aprovado como mudança de layout da landing pelo Guilherme em 22/11/2026 (a regra "landing só muda texto" não se aplica a este escopo).

## 1. Regras gerais

- **Design system atual** (CLAUDE.md): fundo `#131313`, dourado `#f2ca50`/`#d4af37`, roxo `#d7c6ff`/`#bea5ff`, texto `#e5e2e1`, Cinzel nos títulos, Inter no texto, `rounded-2xl` nos cards, sem borda de seção (NO-LINE), glass só em flutuantes, sombras ambientais.
- **Cores da nota** sempre de `getScoreTierVisual` (`landing/score-tier-visual.ts`). Vermelho só para bloqueio; roxo para arcano (ponta do triângulo).
- **Ritmo:** animações lentas (600–900 ms), entrada por scroll, loop com pausa de 1,5–2 s no fim.
- **Acessibilidade:** respeitar `prefers-reduced-motion` (mostrar o estado final parado); pausar animações fora da tela (IntersectionObserver) e com `visibilitychange`; mockups com `aria-hidden` e um texto alternativo resumido ao lado.
- **Desempenho:** sem vídeo e sem GIF. Só React + CSS (transform/opacity). Nada de `setInterval` chamando API (regra 15). Carregar com `client:visible`.
- **Dados:** sempre de exemplo, nunca de cliente.
- **Reaproveitar** o que já existe: `useLandingSectionReveal`, `useScrollProgress`, `useDesktopMockupFit`, `ProductHarmonyStar` (`ProductResultFrame.tsx`), `LifeTriangleBlockBadge`, `ProductAnimatedScore`, `LandingSectionIntro`.

## 2. Componentes base (pasta `src/frontend/components/landing/mockups/`)

| Componente | O que faz |
| --- | --- |
| `DeviceFrame` | Moldura `variant="phone" \| "desktop" \| "both"`. Celular: 390×844 com cantos e notch suaves. Desktop: janela com barra de 3 pontos e URL `nomemagnetico.com.br`. `both`: desktop atrás e celular à frente, deslocado. Responsivo: abaixo de 768 px mostra só o celular. |
| `useMockupTimeline` | Hook que roda uma lista de passos `{ at: ms, action }` em loop, começa quando entra na tela, pausa fora dela e com aba oculta, e respeita reduced-motion. Base de todas as cenas. |
| `ChatScene` | Simula o chat: bolhas do Jev "digitando" (3 pontinhos → texto), chips de opção, cursor/toque falso que escolhe uma opção, bolha da resposta. Recebe um roteiro (array de mensagens). |
| `PathChooserScene` | Os 3 botões de caminho; o toque falso alterna entre eles a cada ciclo. |
| `StarScene` | Usa `ProductHarmonyStar`: estrela do nascimento, números trocando, estrela do nome novo crescendo por cima, cor mudando pela faixa da nota. |
| `TriangleScene` | Letras viram números, linhas descem até a ponta (uma por vez), bloqueios acendem em vermelho, ponta em roxo; depois a versão do nome novo sem vermelho. |
| `ScoreCounterScene` | Contador da nota (ex.: 58 → 91) com a barra e a cor da faixa mudando. |
| `SuggestionCardsScene` | 3 cards entram um a um (nome, nota com faixa, selo "sem bloqueio"). Variante artístico: dois blocos "Próximos" e "Novos". Variante bebê: tira de dias do parto ficando verde. |
| `PdfFlipScene` | Páginas do PDF passando (capa → resumo → Parte 1 → triângulo). Tema `social` (dourado), `artistico` (palco), `bebe` (pastel). Usar imagens estáticas das páginas do layout base (`docs/architecture/pdf-layout-base/`) renderizadas em WebP, ou recriar em JSX simplificado. |
| `DashboardScene` | Lista de análises com o botão "Baixar PDF" e o card do nome de nascimento. |

Cada cena aceita `device` (`phone`/`desktop`/`both`) e `theme` (`social`/`artistico`/`bebe`).

## 3. Home (`src/pages/index.astro`)

| # | Seção | Visual | Animação |
| --- | --- | --- | --- |
| 1 | Hero | Título `[TEXTO]`, 3 botões de caminho, link da análise gratuita, linha de confiança | `DeviceFrame both` com `ChatScene` (escolha do caminho → 2 perguntas → 3 nomes) terminando em `StarScene` |
| 2 | Para quem é | 3 cards (Social, Artístico, Bebê) com ícone e `[TEXTO]` | Entrada escalonada no scroll; hover levanta o card; cada card com mini prévia (estrela, holofote, coração pastel) |
| 3 | Como funciona | 3 passos | Scroll horizontal guiado (ou passos que acendem): passo 1 `PathChooserScene` no celular; passo 2 `SuggestionCardsScene`; passo 3 `PdfFlipScene` |
| 4 | O que o cálculo analisa | 3 blocos: 5 números, Triângulo da Vida, nota | `StarScene`, `TriangleScene` e `ScoreCounterScene`, cada um disparado ao entrar na tela |
| 5 | Regra de qualidade | Faixa de destaque com 2 números grandes (`0` bloqueios, `80+` nos nomes novos) | Contadores no scroll |
| 6 | O que você leva | PDF nas 3 versões | `PdfFlipScene` com abas Social / Artístico / Bebê (troca automática a cada ciclo) |
| 7 | Análise gratuita | Formulário atual | `ScoreCounterScene` "até onde a nota pode chegar" ao lado do formulário |
| 8 | Usos do nome | Seção atual (`SignatureUseCasesSection`) | Manter os mockups atuais; incluir palco/redes |
| 9 | Preços | Seção atual | Sem animação nova |
| 10 | FAQ | Seção atual | Sem animação nova |
| 11 | Votação | Revisar opções (artístico e bebê já saíram) ou remover | — |

## 4. Páginas de nicho (mesmo esqueleto, tema próprio)

`/nome-social` (existe), `/nome-artistico` (nova), `/nome-bebe` (existe; deixa de redirecionar). Menu do topo com item "Nome" abrindo as três.

| # | Seção | Nome Social | Nome Artístico | Nome do Bebê |
| --- | --- | --- | --- | --- |
| 1 | Hero | `DeviceFrame both` + `ChatScene` do caminho "harmonizar" | `ChatScene` artístico (área, estilo, imagem) | `ChatScene` bebê (nomes dos pais, data prevista, sexo) |
| 2 | O que perguntamos | Cards das perguntas, entrada no scroll | idem | idem |
| 3 | O que o cálculo mostra | `StarScene` + `TriangleScene` antes/depois | `StarScene` + card "afinidade número × área" | `StarScene` do bebê + `TriangleScene` sem bloqueio |
| 4 | Os nomes que você recebe | `SuggestionCardsScene` (3 cards) | `SuggestionCardsScene` variante próximos × novos | `SuggestionCardsScene` variante bebê + tira dos dias do parto |
| 5 | O que você leva | `PdfFlipScene theme="social"` | `PdfFlipScene theme="artistico"` | `PdfFlipScene theme="bebe"` (tons pastel) |
| 6 | Avisos | — | Card informativo de contratos (estático) | Card de registro sem prazos (estático) |
| 7 | Preço | Seção atual | idem | idem |
| 8 | FAQ | Perguntas do nicho | idem | idem |
| 9 | CTA final | Botão que abre o chat no caminho | idem | idem |

A página do bebê usa acentos pastel só dentro dos mockups e cards de prévia; o fundo da página segue o design system.

## 5. Ordem de entrega

1. **Base:** `DeviceFrame`, `useMockupTimeline`, `ChatScene`, `PathChooserScene` + página de vitrine interna `/demo-mockups` (sem link público) mostrando cada cena em `phone`, `desktop` e `both`.
2. **Cenas de resultado:** `StarScene`, `TriangleScene`, `ScoreCounterScene`, `SuggestionCardsScene`, `PdfFlipScene`, `DashboardScene` na vitrine.
3. **Home** na ordem da seção 3.
4. **Páginas de nicho** na ordem da seção 4.

Cada etapa é um PR separado, com prints de celular (375 px) e desktop (1440 px) e a medição de peso/Lighthouse da home antes e depois.
