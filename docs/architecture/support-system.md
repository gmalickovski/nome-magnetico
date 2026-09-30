# Sistema de Suporte — Guia de Arquitetura

> Documento de referência para replicar este sistema em outros SaaS do portfólio.
> Criado para: Nome Magnético | Stack: Chatwoot + Supabase + N8N + Claude AI

---

## Visão Geral

Sistema de suporte com arquitetura **Supabase-first**: os formulários da aplicação escrevem apenas no Supabase. O N8N faz a ponte assíncrona para o Chatwoot via Supabase DB Webhooks. Agentes trabalham exclusivamente no Chatwoot.

### Princípios

- **Supabase é o master de tickets** — toda criação acontece aqui primeiro
- **Chatwoot = interface dos agentes** — recebe os dados via N8N (assíncrono)
- **N8N = ponte bidirecional** — Supabase → Chatwoot (tickets/mensagens) e Supabase → Chatwoot Help Center (FAQ)
- **Graceful degradation** — se Chatwoot cair, tickets continuam no Supabase; `chatwoot_conversation_id` fica vazio e pode ser sincronizado depois

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     APLICAÇÃO ASTRO (nomemagnetico.com.br)               │
│                                                                          │
│  /suporte ou /app/suporte                                                │
│    └─ POST /api/support/ticket                                           │
│         ├─ Supabase: INSERT support_tickets                              │
│         ├─ Supabase: INSERT support_messages (mensagem inicial)          │
│         ├─ N8N notify('support.ticket_created') → email confirmação      │
│         └─ Async: POST /api/support/claude-triage (triagem IA)           │
│                                                                          │
│  /api/support/chatwoot-webhook  ◄── Chatwoot integration webhook         │
│    ├─ message_created (outgoing) → Supabase + email ao usuário           │
│    ├─ conversation_resolved → Supabase resolved                          │
│    ├─ conversation_status_changed → sync status                          │
│    └─ article_* → sync faq_items                                         │
│                                                                          │
│  /api/support/reply  (admin responde pelo painel)                        │
│    ├─ Supabase: INSERT support_messages                                  │
│    └─ Chatwoot API: postMessage via chatwootClient.ts                    │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ Supabase DB Webhooks (automático)
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         N8N  (n8n.studiomlk.com.br)                      │
│                                                                          │
│  workflow-sync-suporte-tickets-chatwoot                                  │
│    ← /webhook/sync-suporte-tickets (support_tickets INSERT/UPDATE/DELETE)│
│    INSERT → busca/cria contato → atualiza nome → cria conversa           │
│             → aplica labels → salva chatwoot_conversation_id             │
│    UPDATE → se status mudou para resolved → resolve conversa             │
│    DELETE → arquiva conversa                                             │
│                                                                          │
│  workflow-sync-suporte-mensagens-chatwoot                                │
│    ← /webhook/sync-suporte-mensagens (support_messages INSERT)           │
│    Filtra: is_admin=false + content não vazio + tipo INSERT              │
│    → aguarda 8s → busca ticket → se tem conv_id → posta incoming         │
│                                                                          │
│  workflow-sync-help-center-chatwoot  (FAQ)                               │
│    ← /webhook/sync-faq (faq_items INSERT/UPDATE/DELETE)                  │
│    → cria/edita/arquiva artigos no Chatwoot Help Center                  │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   CHATWOOT  (suporte.studiomlk.com.br)                   │
│                                                                          │
│  Inbox 1: Channel::WebWidget — live chat widget                          │
│  Inbox 2: Channel::Api — "Nome Magnético - Formulários"                  │
│    └─ callback_webhook_url: VAZIO (obrigatório — ver seção crítica)      │
│                                                                          │
│  Integration Webhook → https://nomemagnetico.com.br/api/support/         │
│                         chatwoot-webhook                                 │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       SUPABASE CLOUD                                     │
│  support_tickets + support_messages                                      │
│  faq_categories + faq_items                                              │
│  profiles + subscriptions + analyses                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Fluxos Completos

### 1. Usuário abre um ticket

```
Usuário preenche formulário (/suporte ou /app/suporte)
  ↓
POST /api/support/ticket
  ├─ Identidade: logado → usa email/nome do perfil Supabase Auth
  │              anônimo → usa email/nome do formulário
  ├─ Prioridade: assinatura ativa → urgent | logado → normal | anônimo → low
  ├─ Supabase: INSERT support_tickets { status: open, priority }
  ├─ Supabase: INSERT support_messages { is_admin: false, content: mensagem }
  ├─ N8N notify('support.ticket_created') → email confirmação (fire-and-forget)
  └─ Async: POST /api/support/claude-triage (com X-Internal-Secret)

  [Em paralelo, via Supabase DB Webhook → N8N:]

  support_tickets INSERT → workflow-sync-suporte-tickets-chatwoot
    ├─ Preparar Dados: mapeia subject → label, priority → label de tier
    ├─ GET /contacts/search?q=email → busca contato existente
    ├─ Se não existe → POST /contacts (criar)
    ├─ PATCH /contacts/{id} { name } → garante nome atualizado
    ├─ POST /conversations { inbox_id: 2, contact_id, priority, attributes }
    ├─ POST /conversations/{id}/labels { labels: [assunto, tier] }
    └─ Supabase UPDATE support_tickets SET chatwoot_conversation_id

  support_messages INSERT → workflow-sync-suporte-mensagens-chatwoot
    ├─ Filtra: is_admin=false + content não vazio + tipo=INSERT
    ├─ Wait 8s (aguarda tickets workflow salvar conversation_id)
    ├─ Supabase: GET support_tickets WHERE id = ticket_id
    ├─ Se chatwoot_conversation_id > 0:
    └─ POST /conversations/{id}/messages { message_type: "incoming" }
```

### 2. Triagem automática por IA

```
POST /api/support/claude-triage  (chamado internamente com X-Internal-Secret)
  ├─ Lê ticket + mensagens do Supabase
  ├─ Verifica plano ativo do usuário
  ├─ Claude Haiku (produção) ou Groq llama-3 (dev) analisam o ticket
  ├─ Resultado: { tipo, urgencia 1-5, resposta sugerida, auto_resolve }
  ├─ Supabase: INSERT support_messages (nota interna da triagem)
  ├─ Chatwoot: postMessage (nota PRIVADA — só agentes veem)
  ├─ Supabase: UPDATE support_tickets SET priority (baseado em urgencia)
  └─ Se auto_resolve=true → resolve ticket + Chatwoot
```

### 3. Agente responde no Chatwoot

```
Agente digita resposta no Chatwoot → clica Enviar
  ↓
Chatwoot dispara integration webhook: event=message_created, type=outgoing
  ↓
POST /api/support/chatwoot-webhook
  ├─ Ignora: private=true (notas internas, triagem IA)
  ├─ Ignora: sender.type=agent_bot (anti-loop)
  ├─ Busca ticket pelo chatwoot_conversation_id
  ├─ Supabase: UPDATE support_tickets SET status=in_progress (se era open)
  ├─ Supabase: INSERT support_messages (espelho da resposta)
  └─ N8N notify('support.ticket_reply') → email para o usuário
```

### 4. Admin responde pelo painel da aplicação

```
Admin abre /admin/suporte/[id]
  ├─ Usa SupportAiPanel (Claude) para sugestão de resposta
  └─ Clica "Enviar resposta"
       ↓
       POST /api/support/reply { ticket_id, content, resolve? }
         ├─ Supabase: INSERT support_messages { is_admin: true }
         ├─ Supabase: UPDATE support_tickets SET status=in_progress|resolved
         └─ Chatwoot API: postMessage(outgoing) via chatwootClient.ts
              ↓ Chatwoot dispara integration webhook de volta
              POST /api/support/chatwoot-webhook
                └─ Ignora: ticket já está in_progress → sem N8N duplicado
```

### 5. Ticket resolvido

```
Via Chatwoot (agente clica Resolver):
  Chatwoot: event=conversation_resolved
  → POST /api/support/chatwoot-webhook
    ├─ Supabase: UPDATE status=resolved, resolved_at=NOW()
    └─ N8N notify('support.ticket_resolved') → email ao usuário

Via painel admin (POST /api/support/reply { resolve: true }):
  ├─ Supabase: UPDATE status=resolved, resolved_at=NOW()
  └─ Chatwoot: toggleConversationStatus('resolved')

Via Supabase UPDATE (qualquer origem):
  support_tickets UPDATE → workflow-sync-suporte-tickets-chatwoot (path UPDATE)
    └─ Se status=resolved E old_record.status≠resolved E chatwoot_conv_id existe
       → POST /conversations/{id}/toggle_status { status: resolved }
```

### 6. FAQ — Supabase → Chatwoot Help Center

```
Admin cria/edita/deleta faq_item no Supabase (painel admin)
  ↓
Supabase Database Webhook → POST https://n8n.studiomlk.com.br/webhook/sync-faq
  ↓
N8N workflow-sync-help-center-chatwoot
  ├─ INSERT → POST /portals/nome-magnetico/articles → salva chatwoot_article_id
  ├─ UPDATE → PUT /portals/nome-magnetico/articles/{id}
  └─ DELETE → PUT /portals/nome-magnetico/articles/{id} { status: archived }
```

### 7. FAQ — Chatwoot → Supabase (reverso/fallback)

```
Admin edita artigo diretamente no Chatwoot Help Center
  ↓
Chatwoot: event=article_published | article_updated | article_archived
  ↓
POST /api/support/chatwoot-webhook
  └─ Supabase: UPSERT faq_items (match por chatwoot_article_id)
```

> Preferir sempre editar no Supabase (fluxo 6). O reverso existe como fallback.

---

## Labels e Prioridades

### Mapeamento subject → label

| Assunto do formulário | Label Chatwoot |
|---|---|
| Bug | `nm-bug` |
| Sugestão | `nm-sugestao` |
| Primeiros Passos | `nm-primeiros-passos` |
| Assinatura e Planos | `nm-assinaturas-e-planos` |
| Conta e Segurança | `nm-conta-e-seguranca` |
| Solução de Problemas | `nm-solucao-de-problemas` |
| Dúvida sobre os planos | `nm-duvida-sobre-planos` |
| Como funciona a numerologia | `nm-como-funciona` |
| Informações gerais | `nm-informacoes-gerais` |
| Parceria ou imprensa | `nm-parceria` |
| Outros | `nm-outros` |

### Mapeamento prioridade → label de tier

| Priority no Supabase | Condição | Label Chatwoot |
|---|---|---|
| `urgent` | Assinatura ativa | `nm-vip` |
| `normal` | Usuário logado sem assinatura | `nm-usuario` |
| `low` | Visitante anônimo | `nm-visitante` |

A prioridade é calculada em `ticket.ts` com base em `locals.user` + consulta em `subscriptions`.

---

## Banco de Dados (Supabase)

### Tabelas de suporte

```sql
support_tickets (
  id UUID PK,
  user_id UUID NULL,              -- FK auth.users (null = anônimo)
  contact_email TEXT,
  contact_name TEXT,
  subject TEXT,
  status TEXT,                    -- open | in_progress | resolved | closed
  priority TEXT,                  -- low | normal | urgent
  chatwoot_conversation_id TEXT,  -- preenchido pelo N8N após criar conversa
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ NULL
)

support_messages (
  id UUID PK,
  ticket_id UUID FK support_tickets,
  author_id UUID NULL,            -- NULL = sistema/IA
  is_admin BOOLEAN,               -- false = usuário | true = admin/IA
  content TEXT,
  created_at TIMESTAMPTZ
)
```

### Tabelas de FAQ

```sql
faq_categories (
  id UUID PK,
  title TEXT,
  slug TEXT UNIQUE,
  order_index INTEGER,
  is_active BOOLEAN
)

faq_items (
  id UUID PK,
  category_id UUID FK faq_categories,
  question TEXT,
  answer TEXT,                    -- plain text
  answer_html TEXT,               -- HTML do Chatwoot Help Center
  chatwoot_article_id TEXT UNIQUE,
  chatwoot_category_id TEXT,
  slug TEXT,
  order_index INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

---

## Variáveis de Ambiente

```bash
# Chatwoot
CHATWOOT_BASE_URL=https://suporte.studiomlk.com.br
CHATWOOT_API_TOKEN=8FsqBLpvNJhZZ73XXiad2XvK   # token do agente (server-side only)
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=2                             # Inbox API "Nome Magnético - Formulários"
CHATWOOT_PORTAL_SLUG=nome-magnetico             # Help Center slug
CHATWOOT_WEBHOOK_SECRET=string_aleatoria        # HMAC para verificar webhooks recebidos

# N8N (webhooks de notificação por email)
N8N_WEBHOOK_SUPORTE=https://n8n.studiomlk.com.br/webhook/suporte
N8N_WEBHOOK_TRANSACIONAL=https://n8n.studiomlk.com.br/webhook/transacional

# Internos
INTERNAL_API_SECRET=string_aleatoria   # protege /api/support/claude-triage
APP_ENV=production                     # production | development
APP_URL=https://nomemagnetico.com.br

# IA
ANTHROPIC_API_KEY=sk-ant-...           # Claude Haiku para triagem + assistente
GROQ_API_KEY=gsk_...                   # Fallback em development
```

---

## Configuração Chatwoot (passo a passo)

### 1. Nginx no servidor Chatwoot

**CRÍTICO:** O nginx remove headers HTTP com underscore por padrão, bloqueando o `api_access_token`. Adicionar ao bloco `server` do Chatwoot:

```nginx
underscores_in_headers on;
```

Arquivo de referência: `scripts/nginx-chatwoot.conf`

Também é necessário o bloco `/cable` para WebSocket (ActionCable):

```nginx
location /cable {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_read_timeout 86400;
}
```

### 2. Labels (Settings → Labels)

Criar todas antes de receber tickets:

```
nm-bug               nm-sugestao           nm-primeiros-passos
nm-assinaturas-e-planos                    nm-conta-e-seguranca
nm-solucao-de-problemas                    nm-duvida-sobre-planos
nm-como-funciona     nm-informacoes-gerais  nm-parceria
nm-outros            nm-vip                nm-usuario
nm-visitante
```

### 3. Inboxes (Settings → Inboxes)

**Inbox 1 — Live Chat (opcional):**
- Type: Website (Web Widget)
- Name: Nome Magnético
- Salvar o Website Token em `CHATWOOT_WEBSITE_TOKEN` (para o widget no site)

**Inbox 2 — Formulários (obrigatório):**
- Type: API
- Name: Nome Magnético - Formulários
- **`callback_webhook_url`: deixar VAZIO** ← crítico (ver seção abaixo)
- Salvar o `inbox_id` em `CHATWOOT_INBOX_ID`

### 4. Integration Webhook (Settings → Integrations → Webhooks)

```
URL: https://nomemagnetico.com.br/api/support/chatwoot-webhook
Subscribed Events:
  ✅ message_created
  ✅ conversation_resolved
  ✅ conversation_status_changed
  ✅ article_published
  ✅ article_updated
  ✅ article_archived
```

Copiar o webhook secret e salvar em `CHATWOOT_WEBHOOK_SECRET`.

### 5. Help Center (Settings → Help Center)

```
Name: Centro de Ajuda Nome Magnético
Slug: nome-magnetico   → salvar em CHATWOOT_PORTAL_SLUG
Color: #D4AF37
```

---

## Configuração Supabase DB Webhooks

Criar 3 webhooks em Supabase → Settings → Database → Webhooks:

| Nome | Tabela | Eventos | URL N8N |
|---|---|---|---|
| `support-tickets-to-n8n` | `support_tickets` | INSERT, UPDATE, DELETE | `https://n8n.studiomlk.com.br/webhook/sync-suporte-tickets` |
| `support-messages-to-n8n` | `support_messages` | INSERT | `https://n8n.studiomlk.com.br/webhook/sync-suporte-mensagens` |
| `faq-items-to-n8n` | `faq_items` | INSERT, UPDATE, DELETE | `https://n8n.studiomlk.com.br/webhook/sync-faq` |

Payload enviado automaticamente: `{ type, table, schema, record, old_record }`

---

## Configuração N8N

### Workflows a importar (pasta `n8n_workflows/`)

| Arquivo | Função |
|---|---|
| `workflow-sync-suporte-tickets-chatwoot` | Tickets Supabase → Chatwoot |
| `workflow-sync-suporte-mensagens-chatwoot` | Mensagens Supabase → Chatwoot |
| `workflow-sync-help-center-chatwoot` | FAQ Supabase → Chatwoot Help Center |

**Credenciais necessárias em cada workflow:**
- Supabase node: credencial `Supabase Cloude - Nome Magnético`
- HTTP Request nodes: header `api_access_token: TOKEN` (token vai no **header**, não na query string)

**N8N workflows de email** (criar manualmente ou importar se existirem):
- `support.ticket_created` → email de confirmação ao usuário
- `support.ticket_reply` → email notificando nova resposta do agente
- `support.ticket_resolved` → email de resolução

---

## ⚠️ Seção Crítica — Erros Comuns

### 1. `callback_webhook_url` DEVE estar vazio no inbox API

**Comportamento:** Se `callback_webhook_url` for preenchido em um inbox do tipo API, o Chatwoot tenta chamar essa URL para confirmar a entrega de cada mensagem recebida. Qualquer erro (301, 404, timeout) faz a mensagem aparecer como **"Falha ao enviar"** (em vermelho).

**Regra:** Deixar **sempre vazio**. As notificações de respostas dos agentes funcionam pelo integration webhook global, que é independente.

**Fonte:** Issues #12294 e #9965 do GitHub Chatwoot.

### 2. nginx `underscores_in_headers` é obrigatório

O nginx remove por padrão headers com underscore. Sem `underscores_in_headers on;`, todas as chamadas à API do Chatwoot retornam `401 Unauthorized` porque o header `api_access_token` é descartado.

### 3. Race condition no workflow de mensagens

O workflow `sync-suporte-mensagens` dispara quando a mensagem é inserida no Supabase, mas o workflow `sync-suporte-tickets` ainda pode estar processando (criando a conversa no Chatwoot e salvando o `chatwoot_conversation_id`). O Wait node de **8 segundos** compensa esse atraso. Se o tempo não for suficiente, aumentar o wait.

### 4. Loop de atualização no workflow de tickets

O passo final do workflow de tickets faz `UPDATE support_tickets SET chatwoot_conversation_id`, que dispara o webhook novamente (tipo UPDATE). O nó "Ticket Resolvido?" tem a condição `old_record.status ≠ resolved` para evitar que esse UPDATE acidental resolva a conversa.

### 5. `message_type: "incoming"` para mensagens do usuário

Mensagens do usuário devem ser postadas com `message_type: "incoming"` (aparece à esquerda, lado do cliente). Se usar `"outgoing"`, aparece à direita (lado do agente) e o Chatwoot tenta entregar via `callback_webhook_url` — gerando "Falha ao enviar" se a URL estiver vazia.

---

## Arquivos do Sistema (referência rápida)

| Arquivo | Responsabilidade |
|---|---|
| `src/pages/api/support/ticket.ts` | Cria ticket no Supabase (Astro API route) |
| `src/pages/api/support/chatwoot-webhook.ts` | Recebe eventos Chatwoot → atualiza Supabase + envia emails |
| `src/pages/api/support/claude-triage.ts` | Triagem IA automática (Claude/Groq) |
| `src/pages/api/support/reply.ts` | Admin responde via painel |
| `src/pages/api/support/ai-assistant.ts` | Claude como assistente do admin (streaming) |
| `src/backend/support/chatwootClient.ts` | HTTP helpers para Chatwoot API (reply + triage) |
| `src/backend/notifications/notify.ts` | Dispara eventos N8N (email) |
| `n8n_workflows/workflow-sync-suporte-tickets-chatwoot` | N8N: tickets → Chatwoot |
| `n8n_workflows/workflow-sync-suporte-mensagens-chatwoot` | N8N: mensagens → Chatwoot |
| `n8n_workflows/workflow-sync-help-center-chatwoot` | N8N: FAQ → Chatwoot Help Center |
| `scripts/nginx-chatwoot.conf` | Config nginx do servidor Chatwoot |

---

## Bot Suporte — só a FAQ

O bot Suporte não usa service role. Lê a FAQ em `support_faq.support_faq_v` e o status mínimo de um e-mail em `support_faq.support_lookup_contact`. Não lê tabelas de perfil, assinatura, lead, análise ou auth. Padrão, grants e checklist: `docs/architecture/support-bot-faq-readonly.md`.

## Como Replicar em Outro SaaS

### Backend (copiar e adaptar)

- [ ] `src/pages/api/support/ticket.ts` — ajustar lógica de VIP conforme o produto
- [ ] `src/pages/api/support/chatwoot-webhook.ts` — copiar integralmente
- [ ] `src/pages/api/support/claude-triage.ts` — ajustar SYSTEM_PROMPT para o produto
- [ ] `src/pages/api/support/reply.ts` — copiar integralmente
- [ ] `src/pages/api/support/ai-assistant.ts` — ajustar SYSTEM_PROMPT e contexto
- [ ] `src/backend/support/chatwootClient.ts` — copiar integralmente
- [ ] `src/backend/notifications/notify.ts` — garantir eventos `support.*`

### N8N (importar e adaptar)

- [ ] `workflow-sync-suporte-tickets-chatwoot` — atualizar LABEL_MAP no nó "Preparar Dados"
- [ ] `workflow-sync-suporte-mensagens-chatwoot` — copiar integralmente
- [ ] `workflow-sync-help-center-chatwoot` — copiar integralmente
- [ ] Criar workflows de email para `support.ticket_created/reply/resolved`

### Supabase

- [ ] Aplicar migration com tabelas `support_tickets`, `support_messages`, `faq_categories`, `faq_items`
- [ ] Configurar 3 DB Webhooks (tickets, messages, faq_items)
- [ ] Configurar RLS policies
- [ ] Aplicar o padrão do bot Suporte (view `support_faq.support_faq_v`, função `support_lookup_contact`, role `support_bot`). Ver `docs/architecture/support-bot-faq-readonly.md`. Não criar senha na migration.

### Chatwoot

- [ ] Aplicar nginx com `underscores_in_headers on`
- [ ] Criar labels com prefixo do produto
- [ ] Criar inbox API com `callback_webhook_url` **vazio**
- [ ] Configurar integration webhook global
- [ ] Criar Help Center com slug correto

### Variáveis de ambiente

- [ ] `CHATWOOT_BASE_URL`, `CHATWOOT_API_TOKEN`, `CHATWOOT_ACCOUNT_ID`
- [ ] `CHATWOOT_INBOX_ID` (inbox API), `CHATWOOT_PORTAL_SLUG`
- [ ] `CHATWOOT_WEBHOOK_SECRET`
- [ ] `N8N_WEBHOOK_SUPORTE`, `N8N_WEBHOOK_TRANSACIONAL`
- [ ] `INTERNAL_API_SECRET`, `APP_ENV`, `APP_URL`
- [ ] `ANTHROPIC_API_KEY`, `GROQ_API_KEY`
