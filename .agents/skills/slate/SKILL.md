---
name: slate
description: >
  Prepara o ambiente ao abrir ou iniciar trabalho num projeto (Cursor, Antigravity,
  Claude Code, Codex, Grok). Use com sessão, worktree, branch, issue ou PR/MR. Exige
  Linear MCP e forge MCP (GitHub ou GitLab) ativos; instala só com sim explícito.
  Pergunta uma vez: issue nova ou em andamento; sincroniza com origin antes de codar;
  cria ou reaproveita branch linear/, worktree e PR/MR em rascunho no início; no
  fechamento valida, faz push, tira o draft (gh pr ready) e registra na issue, sem merge.
  Gatilhos: /slate, worktree, branch, issue, PR, MR.
---

> **Agentes:** leia primeiro [`AGENTS.md`](../../../AGENTS.md) na raiz do repositório.


# Slate

Marca o início da sessão. Vale para qualquer repositório, no GitHub ou no GitLab, e para o agente que estiver executando este skill: Grok, Claude Code, Claude Desktop, Codex, Cursor ou Antigravity/Gemini. Não assuma um produto.

Sem o Linear e sem o MCP do forge escolhido respondendo, pare. Não crie issue, branch, worktree nem PR/MR.

## Conexões

Confira no agente atual, não num outro:

1. O Linear responde nesta sessão.
2. O forge do repositório confirmado responde: GitHub ou GitLab, nunca os dois por obrigação. GitLab self-hosted usa o host desse repositório.

Servidor configurado e ainda sem login conta como inativo.

Endereços:

- Linear: `https://mcp.linear.app/mcp`
- GitHub: `https://api.githubcopilot.com/mcp/`
- GitLab.com: `https://gitlab.com/api/v4/mcp`
- GitLab self-hosted: `https://<host>/api/v4/mcp`

Onde olhar, conforme o agente:

- Grok: `grok plugin list`, `grok mcp list`, `grok mcp doctor <nome>`, config em `~/.grok/config.toml`
- Claude Code: `claude mcp list`
- Claude Desktop: `%APPDATA%\Claude\claude_desktop_config.json`
- Codex: `~/.codex/config.toml`
- Cursor: `~/.cursor/mcp.json`
- Antigravity/Gemini: `~/.gemini/settings.json`

Se faltar plugin, servidor ou login, diga o que falta e o comando ou o bloco de config daquele agente. Pare até um sim explícito. Sem isso, não instale e não edite config. Não grave token. O `gh` ou o `glab` já autenticados não substituem o OAuth do MCP.

Com aprovação, exemplos:

- Grok: `grok plugin install <nome> --trust` e `grok mcp add --transport http <nome> <url>`
- Claude Code: `claude mcp add --transport http <nome> <url>`
- Os outros: entrada HTTP no arquivo de MCP daquele agente, com a URL acima.

Se faltar login, peça para autorizar o servidor no próprio agente e continue só quando os dois responderem.

## Início

### Repositório e clone

1. Se o projeto ainda não foi dito, pergunte o nome ou a URL. Uma pergunta só.
2. Se a URL já disser o host, use esse repositório e mesmo assim confirme. Senão procure:
   - GitHub: `gh api user --jq .login` e `gh search repos "<nome>" --owner <login> --json fullName,description,url`. Se não achar, busque sem `--owner`.
   - GitLab: `glab repo search "<nome>"`. Se o `glab` não existir, diga isso e peça aprovação antes de instalar.
   - Se o usuário não disser o host, busque nos dois e mostre de qual host veio cada resultado.
3. Mostre nome, descrição curta e URL. Pare até a confirmação. Um resultado só também espera confirmação.
4. Descubra a branch padrão. GitHub: `gh repo view <owner/repo> --json defaultBranchRef --jq .defaultBranchRef.name`. GitLab: `glab repo view --json defaultBranch`.
5. Ache um clone local (pasta de trabalho já usada ou `git worktree list`). Se não existir, clone para a pasta de projetos que o usuário já usa, ou para `~/Dev/<repo>`. Não commite nesse checkout de referência.
6. `git fetch origin`. Daqui em diante a base remota é `origin/<branch-padrão>`, nunca o HEAD local se ele estiver atrás.

### Issue: nova ou em andamento

7. **Uma pergunta só:** criar issue nova no Linear ou usar uma já em andamento?
   - Time: o que o `LINEAR.md` do repositório indicar (ex.: **Desenvolvimento**, prefixo `DEV-*`). Se o arquivo não existir, liste os times e pergunte quando houver mais de um.
   - **Em andamento:** liste issues abertas ou em progresso desse time (Linear MCP ou CLI). Mostre identificador e título; o usuário escolhe uma ou volta para “nova”.
   - **Nova:** pergunte o assunto só se ainda não tiver sido dito; crie a issue com o template que o repositório documentar. Time e rótulos: `LINEAR.md` / `AGENTS.md`.

Guarde o identificador (`DEV-123`, ou o prefixo real do time).

A branch começa sempre com `linear/`. Formato: `linear/<prefixo>-<numero>-<slug>`, em minúsculas. `DEV-123` e o assunto "dashboard nome social" viram `linear/dev-123-dashboard-nome-social`. Se o `LINEAR.md` do repositório der outro formato, siga o arquivo, desde que o prefixo continue `linear/`.

### Issue nova — branch, worktree e PR em rascunho

8. Se ainda não existir branch remota, publique a partir da base atualizada, sem trocar o checkout da branch padrão:

```shell
git push origin "origin/<branch-padrão>:refs/heads/<branch>"
git fetch origin <branch>
```

9. Worktree local, fora do checkout de referência. Se a pasta ou a branch local já existirem com outro propósito, pare e pergunte. Não sobrescreva.

```shell
git worktree add --track -b <branch> "$HOME/.agents/worktrees/<repo>/<slug>" "origin/<branch>"
```

10. **Abrir o PR/MR em rascunho já no início** (sem código da tarefa ainda). Na worktree, um commit vazio evita PR “sem nada para comparar” quando a branch aponta para o mesmo SHA da padrão:

```shell
cd "$HOME/.agents/worktrees/<repo>/<slug>"
git commit --allow-empty -m "chore(slate): abrir draft para <IDENTIFICADOR>"
git push -u origin <branch>
```

GitHub:

```shell
gh pr create --draft --base <branch-padrão> --head <branch> \
  --title "<IDENTIFICADOR> <título curto da issue>" \
  --body "Linear: <URL da issue>

Rascunho aberto pelo Slate. Commits de implementação virão nesta branch."
```

GitLab: `glab mr create --draft` com título e corpo equivalentes.

11. No Linear: anexe o link do PR/MR à issue e mova para **In Progress**.

### Issue existente — reaproveitar branch e PR

8. Localize o que já existe:
   - Linear: anexos, campo `gitBranchName`, comentários com URL de PR/MR.
   - Forge: `gh pr list --search "<IDENTIFICADOR>"` e `gh pr list --head <branch>` (GitLab: `glab mr list` com os filtros equivalentes).
9. Se houver branch mas não worktree, crie só a worktree em cima de `origin/<branch>`. Se worktree e branch já existirem, reutilize; não duplique.
10. Se **não** houver PR/MR aberto para essa branch, siga o passo 10 da issue nova (commit vazio se precisar, push, `gh pr create --draft` / `glab mr create --draft`). Se já houver PR/MR, não crie outro.
11. Garanta o link do PR/MR na issue (anexo) e status **In Progress**.

### Sincronização obrigatória (antes de qualquer alteração de código)

Execute na worktree da issue, **depois** de branch/PR prontos e **antes** do primeiro commit de implementação (e repita se voltar dias depois):

1. `git fetch origin`
2. Compare a branch local com `origin/<branch-padrão>` e com `origin/<branch>`:
   - `git rev-list --left-right --count origin/<branch-padrão>...HEAD`
   - `git rev-list --left-right --count origin/<branch>...HEAD`
3. Se a branch da issue estiver atrás de `origin/<branch-padrão>`:
   - Sem alterações locais não commitadas: atualize (fast-forward de `origin/<branch>` na worktree e/ou `git rebase origin/<branch-padrão>` na branch da issue, conforme o estado do remoto). Prefira rebase da issue sobre `origin/<branch-padrão>` quando a branch só tinha o commit vazio do Slate.
   - Com alterações locais, conflito ou ambiguidade: **pare**, explique e pergunte.
4. **Relate ao usuário:** quantos commits estava atrás em cada comparação e o que foi feito (fetch, fast-forward, rebase, nada).

### Ambiente na worktree

12. Entre na worktree e rode `npm ci` e `npm run env:1p` quando o repositório usar Node e 1Password. Antes de injetar, confirme que todas as referências ativas usam somente `Studio MLK - TESTE`. Item ausente: pare a injeção e registre a pendência, sem fallback de produção. Nunca use o cofre `Studio MLK` nem o ref de produção `bhxneaeuhybtucmbmpvg`. Migrations exigem pedido explícito e só podem ser aplicadas no TESTE.

13. Resuma: issue, repositório, branch, URL do PR/MR em rascunho, caminho da worktree. O trabalho de código fica **só** nessa worktree.

## Fechamento

Quando o usuário disser que terminou:

1. Rode a validação que o repositório documenta. Se não houver outra, e a mudança tocar código de build, rode o type-check e o build que o `package.json` definir (ex.: `npm test`, `npx astro check`, `npm run build`).
2. Commit **somente** dos arquivos da tarefa e push da mesma branch.
3. Tire o PR/MR do rascunho: GitHub `gh pr ready`, GitLab `glab mr update --ready`. Atualize título e corpo se precisar: identificador da issue no título; corpo com **Causa**, **Mudança**, **Testes rodados**, **Rollback** e link da issue.
4. No Linear: comente o que foi feito e o que ficou pendente; anexe ou confirme o link do PR/MR; mova para **In Review** se o time usar esse estado após PR pronto para revisão.
5. Não faça merge e não crie tag, salvo pedido explícito.
