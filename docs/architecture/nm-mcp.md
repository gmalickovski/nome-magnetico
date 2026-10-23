# Servidor MCP Admin do Nome Magnético (`nm-mcp`)

Este documento descreve a arquitetura, modelo de segurança e guia de uso do **servidor MCP administrativo (`nm-mcp`)** do Nome Magnético, implementado na issue [DEV-207](https://linear.app/studio-mlk/issue/DEV-207/mcp-do-nome-magnetico-para-agentes-operacoes-admin).

---

## 1. Visão Geral e Arquitetura

O `nm-mcp` é um serviço isolado em Node.js (TypeScript) que implementa a especificação oficial Model Context Protocol (MCP) com transporte HTTP Streamable (Server-Sent Events / SSE).

### Premissas de Isolamento e Segurança
1. **Container e Processo Separados:** O `nm-mcp` roda em container independente (`nm-mcp`), com deploy e ciclo de vida desacoplados do app principal. Uma falha no MCP não afeta o checkout ou a área do cliente.
2. **Escuta Estritamente Local:** O serviço escuta em `127.0.0.1:8765`. Nenhuma porta pública é exposta.
3. **Sem `service_role`:** O MCP nunca possui nem utiliza a chave `service_role` do Supabase.
   - **Leituras:** Feitas através de views dedicadas no schema `mcp_admin` com a role Postgres mínima `nm_mcp_bot` (`NOLOGIN`, `NOINHERIT`).
   - **Mutações:** O MCP **não escreve diretamente no banco**. Ações (reprocessar análise, reenviar PDF) chamam endpoints internos do app assinados com HMAC-SHA256 (`/api/internal/mcp/*`).
4. **Sem SQL Livre:** Nenhuma interface de query livre é exposta.
5. **Auditoria Append-Only:** Todas as chamadas são registradas na tabela `mcp_admin.mcp_audit` com PII (e-mails) mascarada.
6. **Proteção de Dados (LGPD):** Nenhum e-mail ou segredo é gravado em texto puro nos logs.

```text
Agente (Grok, Cursor, Gemini)
         │  (Bearer Token em hash)
         ▼
  [nm-mcp :8765] (127.0.0.1)
   ├── Rate Limiter (60 leituras/min, 10 ações/h)
   ├── Scope Verifier (read, reprocess, resend)
   ├── Auditoria ──► [mcp_admin.mcp_audit] (append-only)
   ├── Consultas ──► [mcp_admin.analises_gratis_v] (role: nm_mcp_bot)
   └── Mutações  ──► [POST /api/internal/mcp/*] (HMAC-SHA256) ──► App Principal
```

---

## 2. Autenticação e Escopos

A autenticação é feita via cabeçalho `Authorization: Bearer <token>`.

### Armazenamento de Tokens
Seguindo o padrão do `brain-memo` / `mcp-mem0`, **o servidor MCP nunca armazena tokens em texto puro**. Apenas o hash SHA-256 do token é configurado em variáveis de ambiente (`MCP_TOKENS_JSON`).

A verificação compara os hashes em tempo constante (`crypto.timingSafeEqual`) para prevenir ataques de temporização (*timing attacks*).

### Escopos da Fase 1

| Escopo | Permissões | Ferramentas Habilitadas |
|---|---|---|
| `read` | Consultas e leituras sem efeitos colaterais | `listar_analises_gratis`, `status_lead` |
| `reprocess` | Disparo de reprocessamento de análises grátis | `reprocessar_analise` |
| `resend` | Disparo de reenvio de PDF por e-mail | `reenviar_pdf` |

### Rate Limits por Token
- **Leituras (`read`):** 60 requisições por minuto por token.
- **Ações (`reprocess` / `resend`):** 10 requisições por hora por token.

---

## 3. Ferramentas Disponíveis (Fase 1)

### `listar_analises_gratis`
- **Escopo:** `read`
- **Descrição:** Lista análises gratuitas capturadas, com filtros e mascaramento de e-mails.
- **Parâmetros:**
  - `status`: `'pending' | 'processing' | 'complete' | 'error'` (opcional)
  - `email`: string (opcional)
  - `created_after`: string ISO 8601 (opcional)
  - `created_before`: string ISO 8601 (opcional)
  - `limit`: number (1 a 100, default: 50)

### `status_lead`
- **Escopo:** `read`
- **Descrição:** Consulta consolidada do status de um lead/cliente pelo e-mail.
- **Parâmetros:**
  - `email`: string (obrigatório)
- **Retorno:** Status de cadastro, assinaturas ativas e histórico da análise grátis (com e-mail mascarado).

### `reprocessar_analise`
- **Escopo:** `reprocess`
- **Descrição:** Reprocessa um lead da análise grátis com erro, reaproveitando a esteira da DEV-206.
- **Parâmetros:**
  - `lead_id`: string UUID (obrigatório)
  - `dry_run`: boolean (opcional, padrão: `true`)
- **Comportamento:**
  - `dry_run: true` valida o lead e simula a execução sem efetuar mutações.
  - Se o lead já estiver `complete`, a operação é pulada de forma idempotente.

### `reenviar_pdf`
- **Escopo:** `resend`
- **Descrição:** Reenvia o PDF de uma análise grátis por e-mail para o lead.
- **Parâmetros:**
  - `lead_id`: string UUID (obrigatório)
  - `dry_run`: boolean (opcional, padrão: `true`)

---

## 4. Gestão de Tokens (CLI)

Para gerar um novo token para um bot ou agente:

```bash
cd nm-mcp
npm run token:generate <nome_do_agente>
```

A saída exibirá o **Bearer Token** (mostrado apenas uma vez) e o **Hash SHA-256** para ser adicionado ao `.env` do servidor:

```json
[
  {
    "agent": "grok_bot",
    "token_hash": "d161047d6e3455438f3b684663c4cbd1316db30f84918427d12e8126bd23343a",
    "scopes": ["read", "reprocess", "resend"],
    "is_active": true
  }
]
```

---

## 5. Como Conectar os Clientes MCP

### Cursor / VS Code / Claude Code (`claude_desktop_config.json` ou `.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "nome-magnetico-admin": {
      "url": "http://127.0.0.1:8765/sse",
      "headers": {
        "Authorization": "Bearer nm_admin_seu_token_secreto_aqui"
      }
    }
  }
}
```

---

## 6. Orientações para a Infraestrutura (VPS / Cloudflare)

Conforme a issue DEV-207:
1. **Container Docker:** Rodar via `docker-compose.override.example.yaml` na rede interna.
2. **Reverse Proxy (Nginx):**
   - Configurar vhost para `mcp.nomemagnetico.com.br` apontando para `http://127.0.0.1:8765`.
   - Adicionar diretivas de proxy SSE (`proxy_set_header Connection ''; proxy_http_version 1.1; chunked_transfer_encoding off;`).
   - Adicionar `limit_req` preventivo no nginx.
3. **Cloudflare Access:**
   - Proteger `mcp.nomemagnetico.com.br` com Service Tokens para os agentes automatizados e autenticação Google OAuth (`@studiomlk.com.br`) para o Guilherme.
