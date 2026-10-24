# AGENTS.md

Fonte única para agentes IA (**Cursor**, **Antigravity**, Codex e similares) neste repositório.

- Arquitetura e regras detalhadas: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Referência canônica extendida: [`CLAUDE.md`](CLAUDE.md)
- Antigravity / Gemini: [`GEMINI.md`](GEMINI.md)

## Projeto

**Nome Magnético** — SaaS de numerologia cabalística (análise de nome, bloqueios, harmonização).  
**Stack:** Astro 5 SSR, React islands, Tailwind CSS, Supabase Cloud, Stripe.  
**Marca:** “Astro” é só o framework; nunca na UI, copy ou nomes de produto.

## Comandos

```bash
npm ci
npm run dev
npm test
npm run build
npm run preview
npx astro check
```

Validação mínima quando a mudança tocar TS/Astro/frontend/backend/build: `npm test`, `npx astro check` e `npm run build`.

## Segredos e Variáveis de Ambiente (1Password CLI `op`)

- **Nunca** criar ou versionar segredos reais em `.env` (ignorado pelo Git) ou no código-fonte.
- **Local / worktree:** subir o dev server com segredos injetados em runtime: `npm run dev:1p` (`op run --env-file=.env.1password -- npm run dev`). Ou gerar `.env` local com `npm run env:1p` (`op inject -i .env.1password -o .env --force`).
- **Nova variável de ambiente:** o agente deve (1) cadastrar ou atualizar o valor no cofre **Studio MLK** via CLI (`op item edit "<Item>" --vault "Studio MLK" "NOVA_CHAVE[password]=valor"` ou `op item create ... --vault "Studio MLK"`, seguindo itens `NM-PROD-*` / `NM-OPS-*`); (2) adicionar em `.env.1password` a referência `NOVA_CHAVE="op://Studio MLK/<Item>/NOVA_CHAVE" # pragma: allowlist secret` para o `detect-secrets` no pre-commit.
- **Cursor Cloud Agents:** com `OP_SERVICE_ACCOUNT_TOKEN` no ambiente, o `install` em `.cursor/environment.json` tenta instalar o `op` e rodar `npm run env:1p`; sem token ou se a injeção falhar, o install continua (variáveis já definidas no ambiente).

## Regras essenciais

- **Camadas:** React em `src/frontend/` nunca importa `src/backend/`. Só `fetch` para `/api/*`. Endpoints validam com Zod.
- **Segurança:** sem service key Supabase no cliente; sem segredos commitados no código.
- **Banco:** sem mutação de banco no front; sem migrations/schema sem pedido explícito do humano. Toda `CREATE TABLE public.*` (a partir de 30/10/2026) traz na mesma migration: `ENABLE ROW LEVEL SECURITY`, políticas, e GRANT explícito e mínimo por role (`anon`, `authenticated`, `service_role`) conforme o uso. Sem GRANT a tabela não aparece no Data API. Nunca `GRANT ALL ... TO anon`. Views e funções novas: GRANT também explícito. FKs sempre com índice e RLS usando `(select auth.uid())`.
- **Acesso:** checar subscription ativa, usuário teste válido ou admin antes de processar análise.
- **IA:** toda chamada passa pelo LoopGuard; config só em `src/backend/ai/config/` e `prompts/`.
- **Numerologia:** sempre os 4 triângulos (`calcularTodosTriangulos`); copy “Tensão Vibracional”, não “incompatível”; sem radiestesia/pêndulo.
- **Landing pública:** não alterar layout, design system nem animações — **apenas texto/copy**, salvo pedido explícito.
- **Documentação nova:** em `docs/architecture/`, `docs/sops/`, `docs/snippets/` ou `docs/devops/` — nunca `.md` solto na raiz de `docs/`.

## Playbooks Studio MLK (obrigatório) <!-- pragma: allowlist secret -->

Time **Desenvolvimento** (`DEV-*`). Labels `area:frontend` / `area:backend`.

- UI/layout/mobile/fold/tipografia/SVG: [Playbook Frontend](https://linear.app/studio-mlk/document/playbook-frontend-layout-tipografia-mobilefold-4ad2081fba87) <!-- pragma: allowlist secret -->
- API/auth/DB/LGPD/segurança: [Playbook Backend](https://linear.app/studio-mlk/document/playbook-backend-seguranca-api-lgpd-400dc095d4f4) <!-- pragma: allowlist secret -->
- Guia: https://linear.app/studio-mlk/document/guia-linear-regras-e-suporte-b9d5bfb39654 <!-- pragma: allowlist secret -->

## Fluxo de trabalho (agentes)

- Trabalhar em **branch** (ex.: `linear/dev-XXX-slug` ou conforme a issue), nunca commit direto na `main`.
- Abrir **PR em draft** com título `DEV-### …` referenciando a issue Linear.
- **Não** fazer merge nem criar tag de deploy — isso é ação humana, salvo pedido explícito.
- Labels na issue: **um** `agent:` (`cursor` | `antigravity`) + **um** `tier:` (`simples` | `complexo`). Se risco ≠ `nenhum`, preferir `agent:cursor`.

Detalhes de branches/PRs: [`LINEAR.md`](LINEAR.md).

## Template de issue (copiar)

```markdown
## Objetivo (1 frase)
## Repo, branch e arquivos prováveis
## Critério de aceite (checklist)
## Como testar (comando)
## Não pode mudar
## Risco: produção | banco | pagamentos | auth | nenhum
```

## Resumo de arquitetura

```text
React island → fetch /api/* → Astro API route → src/backend/* → Supabase / IA
```

- `/app/*` — sessão + acesso ativo  
- `/admin/*` — redireciona para HQ (`hq.studiomlk.com.br`)  
- Produtos: `nome_social` | `nome_bebe` | `nome_empresa` — pagamento único por ciclo de 30 dias, self-service (“Acesso imediato”)

## Links úteis

| Documento | Uso |
|-----------|-----|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Playbooks, design, IA, pagamentos, Sentry, deploy |
| [`DESIGN.md`](DESIGN.md) | The Celestial Alchemist |
| [`DEPLOY.md`](DEPLOY.md) | Tag semver `v*.*.*` |
| [`.agents/workflows/`](.agents/workflows/) | Workflows criar-* , Stripe, docs |
| [`.claude/commands/`](.claude/commands/) | Comandos Claude espelhados |
