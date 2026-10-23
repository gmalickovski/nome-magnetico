> **Agentes:** leia primeiro [`AGENTS.md`](../../AGENTS.md) na raiz do repositório.


---
description: Documenta feature ou correção no Changelog Técnico do Notion
---

# PASSO 1 — Coletar contexto git

Execute os seguintes comandos e analise o output:

```bash
git log --oneline -5
git diff HEAD~1 HEAD --stat
```

# PASSO 2 — Classificar

Com base no diff, classifique:

- **Tipo:** Nova Feature / Bug Fix / Config / Refactor / DB Migration
- **Área:** frontend / backend / api / database / auth / payments / ai / pdf / notion / infra

# PASSO 3 — Criar entrada no Notion

USE a ferramenta MCP do Notion disponível (ex: `mcp_notion-mcp-server_API-post-page`) com:

- **Parent:** database "Changelog Técnico" dentro da página com ID `$NOTION_DEVOPS_PAGE_ID`
- **Se o DB não existir:** criá-lo primeiro com a ferramenta apropriada (ex: `mcp_notion-mcp-server_API-create-a-data-source`) com as propriedades:
  - `Resumo` (title)
  - `Data` (date)
  - `Tipo` (select: Nova Feature, Bug Fix, Config, Refactor, DB Migration)
  - `Área` (select: frontend, backend, api, database, auth, payments, ai, pdf, notion, infra)
- **Propriedades da página:**
  - `Resumo` ← título conciso da mudança (ex: "Integração Notion — FAQs e Suporte")
  - `Data` ← data atual (formato ISO: YYYY-MM-DD)
  - `Tipo` ← classificação do passo 2
  - `Área` ← área do passo 2
- **Corpo da página:** descrição técnica com:
  - Resumo do que foi implementado
  - Arquivos alterados (do `git diff --stat`)
  - Decisões arquiteturais relevantes
  - Breaking changes (se houver)
  - Novas variáveis de ambiente (se houver)
  - Migrações de banco (se houver)

# PASSO 4 — Retornar link

Retorne ao usuário o link da página criada no Notion para consulta futura.
