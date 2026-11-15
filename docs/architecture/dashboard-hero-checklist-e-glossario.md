# Arquitetura do Dashboard (`/app`), Carrossel Cronológico, Checklist Vibracional e Glossário Dinâmico

Este documento registra a lógica funcional, a estrutura de dados e a persistência implementadas na refatoração do Dashboard do cliente (`/app`), no Painel de Análise Unificado (`/app/resultado/[id]`) e no sistema dinâmico de Glossário (`DEV-283` / `DEV-287` / `DEV-288` / `DEV-290`).

---

## 1. Carrossel Cronológico e Card Hero (`/app`)

**Arquivos principais:**
- SSR e montagem dos slides: `src/pages/app/index.astro`
- Interface reativa: `src/frontend/components/app/dashboard/AppDashboard.tsx`

### Ordem dos cards (esquerda → direita)
1. **Índice `0` (`1 / N`)**: sempre reservado ao **Nome de Nascimento Inicial** (`isFree: true`).
   - Quando existe linha `analise_gratuita` / `is_free = true`, o slide é montado diretamente a partir dela.
   - Quando o usuário só possui linhas `nome_social` concluídas com nome harmonizado diferente do nome de nascimento, o SSR sintetiza o slide inicial usando `nomeHojeDashboard` + `dataPtRadar`, com `id = "${featuredAnalysisId}__birth"`, `pdfAnalysisId = featuredAnalysisId` e `resultadoHrefOverride = "/app/resultado/${featuredAnalysisId}?modo=nascimento"`.
2. **Índices `1..N-1` (`2 / N`, ...)**: análises pagas/harmonizadas ordenadas por `created_at` crescente (**da mais antiga para a mais recente**), empilhadas da esquerda para a direita.

### Navegação e setas sutis
- As setas de troca (`<` e `>`) usam apenas o ícone (`ChevronIcon`), **sem botão circular de fundo**, mantendo altura/largura sutis com destaque dourado no hover.
- A navegação **não faz loop circular**:
  - No primeiro card (`safeIndex === 0`): a seta da esquerda fica oculta (`opacity-0 pointer-events-none`), exibindo apenas a seta da direita quando há outros cards.
  - No último card (`safeIndex === orderedSlides.length - 1`): a seta da direita fica oculta, exibindo apenas a seta da esquerda.
  - Em cards intermediários: ambas as setas ficam visíveis.

### Favoritar Análise Principal
- **Arquivos:** `src/frontend/lib/favorite-analysis.ts`, `src/pages/api/analyses/favorite.ts`, `src/pages/app/analises/index.astro`.
- Apenas análises **não gratuitas** (`!isFree` e `product_type !== 'analise_gratuita'`) podem ser marcadas como análise principal no dashboard.
- O estado é salvo no banco em `analyses.frequencias_numeros.is_favorite = true` (limpando as demais análises elegíveis do mesmo `user_id`) e espelhado no `localStorage` (`nm:favorite-analysis:v1:<userId>`).
- Quando o dashboard abre com uma análise favoritada, `activeIndex` inicia focado diretamente na posição cronológica da favorita; o usuário pode navegar livremente para a esquerda até o Nome de Nascimento Inicial ou para a direita para análises mais recentes.

### Estrutura visual do Hero Card
- **Desktop (`lg:`):** grid `lg:grid-cols-[minmax(0,1fr)_300px]` com dados à esquerda (`lg:order-1`) e visor circular de score ampliado à direita (`lg:order-2`, `lg:h-[280px] lg:w-[280px]`).
- **Mobile:** empilhado verticalmente com o círculo de score no topo (`order-1`) e as informações abaixo (`order-2`).
- **Pílulas de análise:** nível do score (`Harmonioso`, `Favorável`, `Equilíbrio Parcial`, etc.), contagem de bloqueios (`✓ 0 Bloqueios` ou `⚠ N Bloqueio(s) ativo(s)`), compatibilidade Expressão × Destino (`✦ Harmônica / Favorável`, `◈ Neutra`, `⚠ Tensão Vibracional`) e ganho de pontos (`+N pts sobre o nome de nascimento`). Sem rótulos genéricos.
- **As 5 pontas da estrela:** Destino, Expressão, Motivação, Missão e Impressão em tipologia ampliada (`col-span-2` no mobile para destacar o número imutável de **Destino** no topo do bloco, seguido das 4 demais pontas em 2×2).
- **Ações:** `Baixar PDF` e `Ver Painel de Análise`.
- **Ordem das seções abaixo do Hero:** logo após o Hero Card principal vem **Mapa de Alinhamento Vibracional** (seguido por **Jornada de Ativação** nos cards harmonizados e por **Suas análises**).

---

## 2. Gráfico de Teia Dinâmico (`ReadingRadar`)

**Arquivos principais:**
- `src/frontend/components/app/chat/ReadingRadar.tsx`
- `src/frontend/components/app/dashboard/AppDashboard.tsx`
- `src/pages/app/index.astro`

- Cada `DashboardHeroSlide` transporta seus próprios eixos `birthRadarAxes`, `harmonizedRadarAxes` e `radarLabels` calculados por `computeContextualRadarAxes` em `src/shared/interactive-engine/motor-radar.ts` (mesma função e lógica do Painel de Análise), com persistência de `areaFoco` e `ondeVaiUsar` em `analyses.frequencias_numeros` (`chat-pdf-persist.ts` → `/api/analyze`).
- Quando o card ativo é o **Nome de Nascimento Inicial** (`isFree: true`), `harmonizedRadarAxes` é `null` e `showNumericLabels` é `false` — o radar renderiza **apenas o polígono base (amarelo/cor do score de nascimento)** e os percentuais originais em dourado.
- Quando o card ativo é uma **Assinatura Harmonizada**, `showNumericLabels={Boolean(activeHarmonizedAxes)}` ativa o cálculo de deltas comparativos idêntico ao Painel de Análise (`+X%` na cor do tier da harmonização, `-X%` em vermelho `#ef4444` quando há perda pontual no eixo, `0%` em dourado `#f2ca50` quando se mantém igual).
- Ao navegar no carrossel, os polígonos e vértices `<circle>` animam suavemente (`transition-all duration-700 ease-out`).
- Visual no dashboard: mantém o aspecto flutuante (`.nm-floating-card` com borda fina na cor dinâmica do score `activeVisual.stroke` em ~35% de opacidade) exclusivamente no Hero Card principal; os demais cards inferiores (`Jornada de Ativação`, `Mapa de Alinhamento Vibracional` e `Suas análises`) utilizam superfície uniforme `rounded-2xl bg-[#1C1C1C]` com sombra suave (`shadow-[0_6px_18px_rgba(0,0,0,0.28)]`). O card do radar utiliza `.nm-reading-card`, título padrão `<h2>` (`font-cinzel text-lg font-bold text-[#e5e2e1]`, `Mapa de Alinhamento Vibracional`) sem subtítulo e `variant="dashboard"` no `ReadingRadar` (`viewBox="-24 -4 848 596"`, `radius = 212`, `.nm-radar-svg--dashboard` em `max-width: 620px`) para aproveitar melhor a largura do card mantendo o tamanho de fonte tipográfico (`24px` SVG em container `>= 28rem`, `32px` no mobile).

---

## 3. Checklist Vibracional por Card e Grau de Vibração

**Arquivos principais:**
- Lógica e textos: `src/frontend/lib/app-dashboard-checklist.ts`
- Endpoint API: `src/pages/api/analyses/checklist.ts`
- UI no Dashboard: `src/frontend/components/app/dashboard/AppDashboard.tsx`

### Visibilidade condicional
- O card do checklist (`Jornada de Ativação`) é exibido **exclusivamente em cards de nomes harmonizados** (`!activeSlide.isFree && Boolean(activeHarmonizedAxes) && hasDistinctHarmonizedName`).
- Quando o usuário navega para o card do **Nome de Nascimento Inicial**, o checklist desaparece automaticamente.

### Os 6 passos (isolados por card/slide)
Cada card do carrossel possui seu próprio checklist independente, na ordem do processo de implementação da assinatura:
1. `pdf` — **Baixar o dossiê completo em PDF**
2. `treino_assinatura` — **Treinar a nova assinatura (ciclo de 21 dias)**
3. `registro_identidade` — **Atualizar a assinatura na CIN (novo RG), CNH e Cartório**
   - Baseado no fluxo oficial brasileiro atual: a emissão da **CIN (Carteira de Identidade Nacional)** oficializa a nova rubrica no Registro Civil; depois recomenda-se atualizar gradualmente a **CNH (Detran)** e a ficha de firma em **Cartório de Notas** para evitar divergências cadastrais.
4. `redes_email` — **Usar o nome nas redes sociais e assinatura de e-mail**
5. `cartao_visita` — **Criar cartão de visita digital ou físico com o nome harmonizado**
6. `primeiro_documento` — **Assinar seu primeiro documento ou contrato oficial**

### Barra de Grau de Vibração (`getVibrationActivationInfo`)
Conforme os passos são marcados em checkboxes redondos (`rounded-full`), a barra de progresso avança de `0%` a `100%` seguindo a lógica de cores do sistema (`score-tier-visual`):

| Passos concluídos | Percentual | Rótulo (`levelName`) | Tom visual |
|---|---|---|---|
| `0 / 6` | `0%` | Potencial Latente | Roxo místico (`#d7c6ff`) |
| `1 / 6` | `17%` | Despertar Vibracional | Laranja (`#FB923C`) |
| `2 / 6` | `33%` | Frequência em Formação | Amarelo (`#FACC15`) |
| `3 / 6` | `50%` | Ressonância em Expansão | Dourado (`#f2ca50`) |
| `4–5 / 6` | `67%–83%` | Forte Atração Magnética | Verde-lima (`#A3E635`) |
| `6 / 6` | `100%` | Plena Sintonia Magnética | Esmeralda (`#34D399`) |

### Persistência no Banco de Dados (sem nova migration)
- `POST /api/analyses/checklist` valida `{ analysisId, slideKey, checklist }` com Zod, verifica sessão (`locals.user`) e posse da linha em `analyses` (`eq('id', analysisId).eq('user_id', user.id)`).
- Os dados ficam armazenados no campo JSONB já existente `analyses.frequencias_numeros`:
  - `frequencias_numeros.checklist_by_slide[slideKey]`: estado booleano dos 6 passos + `updated_at`.
  - `frequencias_numeros.checklist_progress[slideKey]`: `{ doneCount, totalCount, percentage, updated_at }`.
- O front grava otimisticamente em `localStorage` (`nm-dashboard-checklist:v2:<userId>:<slideKey>`) e sincroniza com `/api/analyses/checklist`; no carregamento SSR (`src/pages/app/index.astro`), o banco hidrata `slide.initialChecklist`.

---

## 4. Painel de Análise Unificado (`/app/resultado/[id]`)

- **Arquivo:** `src/pages/app/resultado/[id].astro`
- Análises de nascimento (`analise_gratuita`, `is_free = true` ou acessadas com `?modo=nascimento`) reutilizam o mesmo componente `ChatSidebarSection` usado durante a entrevista interativa, com `harmonizedPanel={null}` e `isSuggestion={false}`.
- Análises `nome_social` harmonizadas abrem `ChatSidebarSection` em modo comparativo (`birthPanel` vs `harmonizedPanel`, `isSuggestion={true}`).
- O componente legado `NomeAtualResultado` foi removido desse fluxo.

---

## 5. CTA Dinâmico no Header e Glossário Dinâmico

- **CTA Dinâmico (`+ Nova Análise` ↔ `Retomar Análise`):** `src/frontend/components/app/chat/chat-session-storage.ts` (`hasUnfinishedChatSession`, `syncAnaliseCtaLabels`) detecta se há conversa/questionário em aberto no `localStorage` antes da seleção final e atualiza o botão do header em `/app`.
- **Glossário Público e Interno (`/glossario`, `/app/glossario`) + Auto-Linker:**
  - Termos vêm do banco/catálogo (`src/backend/glossary/service.ts` + `src/shared/glossary/canonical-terms.ts`).
  - Páginas públicas (`/glossario`, `/glossario/[termo]`) usam o mesmo header da landing (`LandingHeader`).
  - Auto-linker (`src/shared/glossary/term-linker.ts`, `src/frontend/components/glossary/GlossaryLinkedText.tsx`, `GlossaryTermOverlay.tsx`) identifica automaticamente termos no painel de análise e nos relatórios, abrindo explicação contextual no painel lateral/modal sem quebrar o fluxo do usuário.

---

## 6. Minhas Análises Split-View (`/app/analises`)

- **Arquivos:** `src/pages/app/analises/index.astro`, `src/backend/numerology/saved-analyses-view.ts`, `src/frontend/components/app/analises/MyAnalysesWorkspace.tsx`, `src/frontend/components/app/analises/types.ts`, `src/frontend/lib/mobile-dock-context.ts`.
- **Layout & Superfície:** utiliza `.nm-chat-shell` (`#1a1a1a`) com `AppLayout noPadding mobileFullViewport` espelhando as fontes, espaçamentos, bordas e cores de `/app/analise/nome-social`.
- **Desktop (`md+`):** coluna esquerda estreita com cards empilhados em ordem decrescente da última análise (`created_at DESC`) exibindo apenas tag de data, favoritar/excluir, nome, score e barra (`ScoreCardRow`, superfície `#1C1C1C` com borda e halo dourado na seleção); coluna direita sem título `"Painel de análise"` e sem faixa escura extra, mantendo apenas o ícone de baixar PDF à esquerda do botão expandir/contrair tela e `<ChatSidebarSection>` atualizado em tempo real conforme a seleção.
- **Mobile (`< 1024px`):** `/app/analises` integra `ACTION_DOCK_PREFIXES`, adicionando o divisor dourado + botão de painel (`MobileDockActionBridge`) na `AppMobileDock`; tocar em um card no mobile (`< 768px`) ou no ícone do painel na dock abre o `<MobileReadingBottomSheet>` idêntico ao fluxo de análise.
