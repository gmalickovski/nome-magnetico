---
name: slate
description: >
  Slate a session before any code. Use when starting a session, a change, a branch,
  a worktree, an issue, or a PR/MR, in any GitHub or GitLab project, including the
  words sessão, seção, worktree, branch, issue, PR, MR, GitHub, or GitLab. Checks
  that the Linear MCP and the forge MCP (GitHub or GitLab) are active in the current
  agent and installs them only after approval. Asks which project, searches, waits
  for confirmation, creates the Linear issue, publishes a linear/ branch from the
  remote default branch, and checks out a local worktree. Opens the PR or MR when
  the work is finished and does not merge. Use when the user runs /slate.
---

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

1. Se o projeto ainda não foi dito, pergunte o nome ou a URL. Uma pergunta só.
2. Se a URL já disser o host, use esse repositório e mesmo assim confirme. Senão procure:
   - GitHub: `gh api user --jq .login` e `gh search repos "<nome>" --owner <login> --json fullName,description,url`. Se não achar, busque sem `--owner`.
   - GitLab: `glab repo search "<nome>"`. Se o `glab` não existir, diga isso e peça aprovação antes de instalar.
   - Se o usuário não disser o host, busque nos dois e mostre de qual host veio cada resultado.
3. Mostre nome, descrição curta e URL. Pare até a confirmação. Um resultado só também espera confirmação.
4. Descubra a branch padrão. GitHub: `gh repo view <owner/repo> --json defaultBranchRef --jq .defaultBranchRef.name`. GitLab: `glab repo view --json defaultBranch`.
5. Ache um clone local (pasta de trabalho já usada ou `git worktree list`). Se não existir, clone para a pasta de projetos que o usuário já usa, ou para `~/Dev/<repo>`. Não commite nesse checkout.
6. `git fetch origin <branch-padrão>`. A base é `origin/<branch-padrão>`, nunca o HEAD local se ele estiver atrás.
7. Pergunte o assunto só se ele ainda não tiver sido dito.
8. Crie a issue no Linear antes da branch. Time e rótulos: os que o `LINEAR.md` do repositório indicar. Se o arquivo não existir, liste os times e pergunte quando houver mais de um. Guarde o identificador (`DEV-123`, ou o prefixo real do time).
9. A branch começa sempre com `linear/`. Formato: `linear/<prefixo>-<numero>-<slug>`, em minúsculas. `DEV-123` e o assunto "dashboard nome social" viram `linear/dev-123-dashboard-nome-social`. Se o `LINEAR.md` do repositório der outro formato, siga o arquivo, desde que o prefixo continue `linear/`.
10. Publique sem trocar o checkout da branch padrão:

```shell
git push origin "origin/<branch-padrão>:refs/heads/<branch>"
git fetch origin <branch>
```

11. Worktree local, fora desse checkout:

```shell
git worktree add --track -b <branch> "$HOME/.agents/worktrees/<repo>/<slug>" "origin/<branch>"
```

12. Diga a issue, o repositório, a branch, a URL remota e o caminho da worktree. O trabalho seguinte fica só nessa worktree.

Se a branch ou a pasta já existirem, pare e pergunte. Não sobrescreva.

## Fechamento

Quando o usuário disser que terminou:

1. Rode a validação que o repositório documenta. Se não houver outra, e a mudança tocar código de build, rode o type-check e o build que o `package.json` definir.
2. Commit só dos arquivos da tarefa e push da mesma branch.
3. GitHub: `gh pr create` contra a branch padrão. GitLab: `glab mr create`. O título leva o identificador da issue.
4. Não faça merge e não crie tag, salvo pedido explícito.
5. Não abra PR nem MR no início, com a branch ainda vazia.
