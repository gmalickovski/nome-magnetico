# Glossário Dinâmico, Auto-Linker e Painel `/app` (`DEV-283` / `DEV-287` / `DEV-288` / `DEV-290`)

## Visão Geral

Esta arquitetura integra três fluxos em torno dos conceitos de Numerologia Cabalística do **Nome Magnético**:

1. **Catálogo Canônico + Merge com Banco (`src/shared/glossary/canonical-terms.ts` e `src/backend/glossary/glossary-service.ts`)**:
   - `CANONICAL_GLOSSARY_TERMS` reside em `src/shared/glossary/` para respeitar a fronteira de camadas (`src/frontend/` nunca importa `src/backend/`).
   - `listPublishedGlossaryTerms()` consulta `public.glossary_terms` (`is_published = true`, com `AbortSignal.timeout(2000)` e cache em `memoize`) e faz merge determinístico por `slug`: registros vindos do Supabase têm precedência de texto e metadados, enquanto campos editoriais ausentes (categoria, aliases, termos relacionados) são herdados do catálogo canônico. Isso garante que o ambiente `TESTE` funcione integralmente mesmo com `public.glossary_terms` vazia.
   - `matchUserGlossaryTerms()` cruza bloqueios ativos (`111`–`999`), débitos kármicos (`13, 14, 16, 19`), lições kármicas, tendências ocultas, números mestres (`11, 22`) e Expressão/Destino com o catálogo para destacar **"Termos Presentes no Seu Mapa"** no `/app/glossario`.

2. **Páginas Pública (`/glossario`) e Autenticada (`/app/glossario`)**:
   - **Externa (`/glossario` e `/glossario/[termo]`)**: usa `LandingHeader` (substituindo o antigo cabeçalho do blog) e o explorador interativo `GlossaryExplorer` (`.nm-floating-card`, busca + categoria + número) no corpo da página; as rotas `/glossario/[termo]` são indexáveis (`noIndex={false}`).
   - **Interna (`/app/glossario` e `/app/glossario/[termo]`)**: usa `AppLayout` (atualizado em `app-client-nav-shared.ts`, `AppLayout.astro` e `app-mobile-nav.ts`) com leitura personalizada do mapa do usuário e ligação direta para `/app/resultado/[id]`.

3. **Auto-Linker de Termos & Overlays Desktop/Mobile (`src/shared/glossary/term-linker.ts`, `GlossaryLinkedText.tsx`, `GlossaryTermOverlay.tsx`)**:
   - Matching *longest-match-first* com fronteiras Unicode (`(?<![\p{L}\p{N}])...(?![\p{L}\p{N}])`), `exactCaseAliases` sensíveis a maiúsculas para termos ambíguos em prosa e limite estrito de **apenas a 1ª ocorrência de cada slug por bloco/card ou trecho HTML**.
   - `linkGlossaryTermsInHtml()` ignora explicitamente `<a ...>`, `<h1..h6>`, `<code>`, `<pre>`, `<button>`, `<script>` e `<style>`.
   - **Restrição PDF**: os geradores `@react-pdf` (`src/frontend/components/pdf/**`) nunca são tocados.
   - **Camadas (`z-index`)**: o `GlossaryTermOverlay` monta via Portal em `z-[95]`, exibindo popover `.nm-floating-card` em desktop (`>= 1024px`, hover/focus/`Escape`) e interceptando o toque no mobile (`< 1024px`) com bottom-sheet acima do `AppMobileDock` (`z-40`) e do `MobileReadingBottomSheet` (`z-[85]`).

4. **Dashboard `/app` e Retomada de Entrevista (`DEV-287`)**:
   - `hasUnfinishedChatSession()` e `syncAnaliseCtaLabels()` (`src/frontend/components/app/chat/chat-session-storage.ts`) alternam dinamicamente `+ Nova Análise` para `Retomar Análise` quando há sessão iniciada em andamento no `localStorage`.
   - `AppDashboard.tsx` exibe Hero `.nm-floating-card` com `ScoreCardRow`, visor circular SVG animado estilo landing page, comparação `Nome atual` vs `Harmonizado`, download direto de PDF (`PDFFeedbackButton` com `showLabel` e `showFab={false}`), checklist com auto-detecção (`assinatura` e `pdfReady`) e card **Leitura Recomendada**.
   - Removido o redirect de `isFree` em `src/pages/app/resultado/[id].astro` para permitir reabertura normal da análise gratuita, adicionando âncoras `#bloqueios` e `#guia-assinatura`.
