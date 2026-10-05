# AGENTS.md

Orientacao para agentes IA que trabalham neste repositorio. Este arquivo e a base pratica para Codex e outros agentes; `CLAUDE.md` continua sendo a referencia canonica completa do projeto.

## Projeto

- Produto: Nome Magnetico.
- Tipo: SaaS de numerologia cabalistica.
- Stack: Astro 5 SSR, React islands, Tailwind CSS, Supabase Cloud e Stripe/Asaas.
- Regra de marca: "Astro" e apenas o framework tecnico. Nunca usar "Astro" em copy, branding, nomes de produto ou interface.
- Fluxo de trabalho: SEMPRE trabalhar em branch com PR, NUNCA diretamente na `main` local. Criar branch a partir da issue Linear (`linear/dev-XXX-...`), abrir PR para review e merge. Mudanças devem ser validadas tecnicamente (`npx astro check`, `npm run build`) antes de abrir ou mesclar PR.

## Playbooks Studio MLK (obrigatório) <!-- pragma: allowlist secret -->

Um time Linear: **Desenvolvimento** (`DEV-*`). FE/BE = labels `area:frontend` / `area:backend` — não criar times separados.

Antes de mudar UI/layout/mobile/fold/tipografia/SVG/containers: seguir o [Playbook Frontend](https://linear.app/studio-mlk/document/playbook-frontend-layout-tipografia-mobilefold-4ad2081fba87). <!-- pragma: allowlist secret -->
Antes de mudar API/auth/DB/migrations/LGPD/segurança: seguir o [Playbook Backend](https://linear.app/studio-mlk/document/playbook-backend-seguranca-api-lgpd-400dc095d4f4). <!-- pragma: allowlist secret -->
Guia Linear: https://linear.app/studio-mlk/document/guia-linear-regras-e-suporte-b9d5bfb39654 <!-- pragma: allowlist secret -->

## Comandos

```bash
npm run dev
npm run build
npm run preview
npx astro check
```

Nao ha suite de testes automatizados. Para validacao tecnica, rode pelo menos `npx astro check` e `npm run build` quando a mudanca tocar TypeScript, Astro, frontend, backend ou build.

## Arquitetura Obrigatoria

- `src/backend/`: IA, numerologia, Supabase server-side, PDF, emails e servicos.
- `src/frontend/`: componentes React, hooks e cliente Supabase browser.
- Componentes React nunca importam de `src/backend/`.
- Frontend fala com backend somente via `fetch` para `/api/*`.
- Endpoints API devem validar input com Zod.
- Nunca expor Supabase service key no cliente.
- Antes de processar analise, checar acesso ativo: subscription, usuario teste valido ou admin.

Fluxo esperado:

```text
React component -> /api/* -> Astro API route -> backend/service -> Supabase/IA
```

## Design System

Seguir `DESIGN.md` e o tema "The Celestial Alchemist".

- Fundo base: `#131313`.
- Texto claro: usar `#e5e2e1`, nunca branco puro.
- Dourado primario: `#f2ca50` e `#d4af37`.
- Roxo mistico/focus: `#d7c6ff` e `#bea5ff`.
- Regra NO-LINE: nao usar `border: 1px solid` para sectioning. Preferir profundidade, stacking de fundo, whitespace e outlines sutis.
- Tailwind sempre. CSS custom somente quando necessario para glassmorphism ou detalhes ja estabelecidos.
- Componentes base primeiro: `src/frontend/components/ui/`.
- Componentes de produto/app primeiro: `src/frontend/components/app/`.
- Radius visual do projeto: `rounded-2xl` em cards e `rounded-full` em botoes/chips.
- Fontes: Cinzel para headings/branding; Inter para body/UI.

## Numerologia

- Toda analise usa os 4 triangulos: Vida, Pessoal, Social e Destino.
- Nunca implementar apenas o Triangulo da Vida.
- Usar `calcularTodosTriangulos` de `src/backend/numerology/triangle.ts`.
- Bloqueios sao sequencias repetidas >= 3 em qualquer triangulo e devem ser consolidados.
- Cada bloqueio inclui `codigo`, `titulo`, `descricao`, `aspectoSaude` e `triangulos[]`.
- Licoes karmicas e tendencias ocultas ficam em `src/backend/numerology/karmic.ts`.
- Score e compatibilidade de harmonizacao ficam em `src/backend/numerology/harmonization.ts`.
- No copy para cliente, nao usar "incompativel"; usar "Tensao Vibracional".
- Nunca mencionar radiestesia, pendulo ou tecnicas radiestesicas. O projeto usa apenas criterios formais objetivos.

## IA

- Development (`APP_ENV=development`): Groq por padrao.
- Production (`APP_ENV=production`): Claude por padrao, salvo config runtime.
- Editar configuracoes de IA apenas em:
  - `src/backend/ai/config/providers.ts`
  - `src/backend/ai/config/models.ts`
  - `src/backend/ai/config/temperatures.ts`
  - `src/backend/ai/prompts/`
- Toda chamada de IA deve passar pelo LoopGuard.
- Maximo de 3 tentativas por analise.
- Limite de uso: 50k tokens por sessao de usuario.

## Produtos

```ts
type ProductType = 'nome_social' | 'nome_bebe' | 'nome_empresa'
```

- `nome_social`: produto principal; analisa nome de nascimento e data, calcula numeros, triangulos, bloqueios, licoes karmicas, tendencias e sugestoes.
- `nome_bebe`: avalia candidatos com sobrenome e data do bebe.
- `nome_empresa`: avalia candidatos considerando socio principal e data de fundacao opcional.
- Modelo comercial: pagamento unico por ciclo de 30 dias, nao recorrente.
- Produto e self-service: usar "Acesso imediato", "Analise na hora", "voce mesmo faz sua analise". Nao usar promessa de entrega manual ou revisao individual.

## Bot Suporte

O bot Suporte le a FAQ ativa e o status minimo de um contato por e-mail. O resto do banco fica negado.

- View: `support_faq.support_faq_v` (categorias + itens com `is_active`; sem embeddings).
- Lookup: `support_faq.support_lookup_contact(email)` devolve uma linha com `is_registered`, `is_subscriber` e `is_lead_only`, mais perfil (id, email, nome, created_at), `product_types` e `ends_at` maximo, ou datas/status de lead. Sem ids de pagamento, valores, metadata, PDF ou texto de analise.
- Role: `support_bot` (`NOLOGIN`). `SELECT` so na view e `EXECUTE` so na funcao. Sem `GRANT` em `profiles`, `subscriptions`, `analise_leads`, `free_analyses_leads`, `analyses`, `ai_usage`, `auth.users` ou qualquer outra tabela.
- A migration nao cria senha. Guilherme autorizou o apply depois do PR alinhado; quem aplica e o Dev.
- Padrao para Simulaweb, Vibraweb e SaaS novos. Nao criar a FAQ desses produtos neste repositorio.
- Detalhe e checklist: `docs/architecture/support-bot-faq-readonly.md`. Regra curta: `LINEAR.md`.

## Auth, Admin e HQ

- `/app/*`: exige session e acesso ativo.
- `/admin/*`: redireciona para `https://hq.studiomlk.com.br`.
- `/api/admin/*`: endpoints legados ainda protegidos por `role='admin'`.
- `/acesso` e `/acesso/resgatar`: fluxo de trial vindo do HQ.
- Usuarios teste usam `profiles.is_test` e `profiles.test_ends_at`.

## Emails e Notificacoes

- Emails de auth sao nativos do Supabase Auth com Amazon SES.
- Nao criar envio custom para confirmacao de cadastro ou reset de senha.
- Emails transacionais de pagamento/suporte devem ir via n8n:

```ts
import { notify } from '@/backend/notifications/notify'

await notify('payment.confirmed', { email, firstName, accessUrl })
```

## Pagamentos

- O sistema suporta Stripe e Asaas.
- Webhook Asaas: `src/pages/api/asaas-webhook.ts`.
- Sempre usar a conta Stripe do Nome Magnetico, a partir do `.env` do projeto.
- Se aparecerem produtos "Sincro Sinergia" ou "Sincro Desperta", a chave Stripe esta errada.

## Sentry

Erros nao tratados em producao vao para o projeto Sentry `studio-mlk / nome-magnetico` (regiao DE) via `@sentry/astro`. O app nao e Next.js: o DSN entra em runtime (`SENTRY_DSN`, com alias `PUBLIC_SENTRY_DSN` e `NEXT_PUBLIC_SENTRY_DSN`). Sem DSN, ou fora de `production`, o SDK fica desligado.

Nao gravar o DSN no codigo. Nao ligar Session Replay nem tracing. Scrubbing tira e-mail, token, cookie, chave e corpo de analise/PDF.

Smoke interno (sem link no menu): `/app/sentry-test` para admin, ou `POST /api/internal/sentry-test` com `X-Internal-Secret`. Detalhe e token de source maps: `docs/devops/sentry.md`.

## Deploy

- Deploy de producao roda por tag semver `v*.*.*`, conforme `.github/workflows/deploy.yml`.
- Push normal para `main` nao deve disparar deploy.
- Push de tag dispara GitHub Actions e deploy para VPS.
- Guia completo: `DEPLOY.md`.
- Antes de deploy, validar build/type-check quando a mudanca tiver impacto tecnico.

Fluxo pratico atual:

```bash
git add .
git commit -m "tipo: resumo da mudanca"
git push origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

## Documentacao

Todo novo processo, componente reutilizavel ou decisao de arquitetura deve ser documentado em `docs/`, sem arquivos soltos na raiz de `docs/`.

Pastas esperadas:

- `docs/architecture/`
- `docs/sops/`
- `docs/snippets/`
- `docs/devops/`

Consulte tambem:

- `CLAUDE.md`: referencia completa do projeto.
- `GEMINI.md`: contexto para Gemini/Antigravity.
- `DESIGN.md`: detalhes visuais.
- `DEPLOY.md`: deploy e VPS.
- `.agents/workflows/`: workflows reutilizaveis.
- `.claude/commands/`: comandos do Claude.

## Regras De Trabalho Para Codex

- Respeitar alteracoes existentes do usuario; nunca reverter sem pedido explicito.
- Preferir mudancas pequenas e alinhadas aos padroes existentes.
- Antes de criar componente, verificar `src/frontend/components/ui/` e `src/frontend/components/app/`.
- Antes de alterar regra de negocio numerologica, checar docs em `docs/architecture/` e referencias em `docs/PDF/` quando relevante.
- O padrao deste projeto e SEMPRE trabalhar via branch e PR (`linear/dev-XXX-...`). Nunca commitar ou dar push direto na `main`.
- Ao finalizar mudancas, relatar arquivos alterados e validacoes executadas.
