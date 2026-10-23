# Servidor MCP Admin do Nome Magnético (`nm-mcp`)

Este documento descreve a arquitetura, modelo de segurança e guia de uso do **servidor MCP administrativo (`nm-mcp`)** do Nome Magnético, implementado na issue [DEV-207](https://linear.app/studio-mlk/issue/DEV-207/mcp-do-nome-magnetico-para-agentes-operacoes-admin).

---

## 1. Visão Geral e Arquitetura

O `nm-mcp` é um serviço isolado em Node.js (TypeScript) que implementa a especificação oficial Model Context Protocol (MCP) com transporte HTTP Streamable (Server-Sent Events / SSE).

### Premissas de Isolamento e Segurança
1. **Container e Processo Separados:** O `nm-mcp` roda em container independente (`nm-mcp`), com deploy e ciclo de vida desacoplados do app principal. Uma falha no MCP não afeta o checkout ou a área do cliente.
2. **Escuta Estritamente Local:** O serviço escuta em `127.0.0.1:8765`. Nenhuma porta pública é exposta.
3. **Sem `service_role`:** O MCP nunca possui nem utiliza a chave `service_role` do Supabase.
   - **Leituras:** Feitas através de views e funções RPC dedicadas no schema `mcp_admin` com a role Postgres mínima `nm_mcp_bot` (`NOLOGIN`, `NOINHERIT`).
   - **Mutações:** O MCP **não escreve diretamente no banco**. Ações (reprocessar análise, reenviar PDF, criar promoção, recálculo F5) chamam endpoints internos do app assinados com HMAC-SHA256 (`/api/internal/mcp/*`).
4. **Sem SQL Livre:** Nenhuma interface de query livre é exposta.
5. **Auditoria Append-Only:** Todas as chamadas são registradas na tabela `mcp_admin.mcp_audit` com PII (e-mails) mascarada.
6. **Proteção de Dados (LGPD):** Nenhum e-mail ou segredo é gravado em texto puro nos logs.

```text
Agente (Grok, Cursor, Gemini)
         │  (Bearer Token em hash)
         ▼
  [nm-mcp :8765] (127.0.0.1)
   ├── Rate Limiter (60 leituras/min, 10 ações/h)
   ├── Scope Verifier (read, reprocess, resend, growth, finance, promotions, action)
   ├── Auditoria ──► [mcp_admin.mcp_audit] (append-only)
   ├── Consultas ──► [mcp_admin views / RPCs] (role: nm_mcp_bot)
   └── Mutações  ──► [POST /api/internal/mcp/*] (HMAC-SHA256) ──► App Principal
```

---

## 2. Autenticação e Escopos

A autenticação é feita via cabeçalho `Authorization: Bearer <token>`.

### Armazenamento de Tokens
Seguindo o padrão do `brain-memo` / `mcp-mem0`, **o servidor MCP nunca armazena tokens em texto puro**. Apenas o hash SHA-256 do token é configurado em variáveis de ambiente (`MCP_TOKENS_JSON`).

A verificação compara os hashes em tempo constante (`crypto.timingSafeEqual`) para prevenir ataques de temporização (*timing attacks*).

### Escopos Configurados

| Escopo | Permissões | Ferramentas Habilitadas |
|---|---|---|
| `read` | Consultas gerais e operacionais | `listar_analises_gratis`, `status_lead`, `lead_360`, `funil`, `listar_promocoes`, `stripe_resumo`, `votos_f6_status` |
| `growth` | Consultas de métricas, catálogo e leads | `funil`, `lead_360`, `listar_promocoes`, `votos_f6_status` |
| `finance` | Métricas financeiras e de conversão | `stripe_resumo`, `funil` |
| `promotions` | Gestão de promoções e cupons | `listar_promocoes`, `criar_promocao` |
| `reprocess` | Disparo de reprocessamento e recálculos | `reprocessar_analise`, `disparar_recalculo_f5` |
| `resend` | Disparo de reenvio de PDF por e-mail | `reenviar_pdf` |
| `action` | Permissão genérica para ferramentas com efeito colateral | `reprocessar_analise`, `reenviar_pdf`, `criar_promocao`, `disparar_recalculo_f5` |

### Rate Limits por Token
- **Leituras (`read` / `growth` / `finance`):** 60 requisições por minuto por token.
- **Ações (`reprocess` / `resend` / `promotions` / `action`):** 10 requisições por hora por token.

---

## 3. Ferramentas Disponíveis

### Fase 1 (Operação e Suporte)

#### `listar_analises_gratis`
- **Escopos:** `read`, `growth`
- **Descrição:** Lista análises gratuitas cadastradas, com filtros e mascaramento de e-mails.
- **Parâmetros:**
  - `status`: `'pending' | 'processing' | 'complete' | 'error'` (opcional)
  - `email`: string (opcional)
  - `created_after`: string ISO 8601 (opcional)
  - `created_before`: string ISO 8601 (opcional)
  - `limit`: number (1 a 100, default: 50)

#### `status_lead`
- **Escopos:** `read`, `growth`
- **Descrição:** Consulta consolidada do status de um lead/cliente pelo e-mail.
- **Parâmetros:**
  - `email`: string (obrigatório)
- **Retorno:** Status de cadastro, assinaturas ativas e histórico da análise grátis (com e-mail mascarado).

#### `reprocessar_analise`
- **Escopos:** `reprocess`, `action`
- **Descrição:** Reprocessa um lead da análise grátis com erro, reaproveitando a esteira da DEV-206.
- **Parâmetros:**
  - `lead_id`: string UUID (obrigatório)
  - `dry_run`: boolean (opcional, padrão: `true`)
- **Comportamento:**
  - `dry_run: true` valida o lead e simula a execução sem efetuar mutações.
  - Se o lead já estiver `complete`, a operação é pulada de forma idempotente.

#### `reenviar_pdf`
- **Escopos:** `resend`, `action`
- **Descrição:** Reenvia o PDF de uma análise grátis por e-mail para o lead.
- **Parâmetros:**
  - `lead_id`: string UUID (obrigatório)
  - `dry_run`: boolean (opcional, padrão: `true`)

---

### Fase 2 (Growth & Finanças)

#### `funil`
- **Escopos:** `read`, `growth`, `finance`
- **Descrição:** Métricas agregadas de conversão do funil (leads gerados, análises gratuitas completadas, vendas confirmadas, reembolsos, receita líquida e taxas de conversão %).
- **Parâmetros:**
  - `periodo`: `'dia' | 'semana'` (opcional, default: `'dia'`)

#### `lead_360`
- **Escopos:** `read`, `growth`
- **Descrição:** Visão 360° unificada do histórico do lead/cliente: cadastro, assinaturas pagas, análises pagas (com scores e versionamento v3), análises gratuitas e consentimento de marketing (DEV-148).
- **Parâmetros:**
  - `email`: string (obrigatório)

#### `listar_promocoes`
- **Escopos:** `read`, `growth`, `promotions`
- **Descrição:** Lista as campanhas promocionais e cupons com status computado (`active`, `scheduled`, `expired`, `inactive`).
- **Parâmetros:**
  - `state`: `'active' | 'scheduled' | 'expired' | 'inactive'` (opcional)

#### `criar_promocao`
- **Escopos:** `promotions`, `action`
- **Descrição:** Cria nova campanha ou cupom com validação rigorosa de pisos de preço (DEV-178). Idempotente e com `dry_run: true` por padrão.
- **Parâmetros:**
  - `name`: string (3 a 80 chars)
  - `product_types`: array de `['nome_social', 'nome_bebe', 'nome_empresa']` (opcional)
  - `discount_type`: `'percent' | 'fixed'`
  - `discount_value`: number (1 a 100 para percent, centavos para fixed)
  - `starts_at`: string ISO 8601 (opcional)
  - `ends_at`: string ISO 8601 (obrigatório)
  - `banner_text`: string (opcional)
  - `dry_run`: boolean (opcional, padrão: `true`)

#### `stripe_resumo`
- **Escopos:** `finance`, `read`
- **Descrição:** Resumo financeiro só-leitura: total de vendas, receita líquida, total de reembolsos, MRR de assinaturas ativas e saldo disponível/pendente na conta Stripe.
- **Parâmetros:**
  - `periodo`: `'mes' | 'semana' | 'total'` (opcional, default: `'mes'`)

#### `votos_f6_status`
- **Escopos:** `read`, `growth`
- **Descrição:** Consulta a contagem agregada de votos da funcionalidade F6 (próximo produto do catálogo, zero dado pessoal).
- **Parâmetros:** nenhum

#### `disparar_recalculo_f5`
- **Escopos:** `reprocess`, `action`
- **Descrição:** Dispara o recálculo F5 de uma análise legada para o motor v3 de scores. Idempotente e com `dry_run: true` por padrão.
- **Parâmetros:**
  - `analysis_id`: string UUID (obrigatório)
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
    "scopes": ["read", "growth", "finance", "reprocess", "resend", "promotions", "action"],
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
