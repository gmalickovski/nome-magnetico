# Suporte — formulário de contato

Última atualização: 2026-10-15

O formulário de `/suporte` (`PublicContactForm`) e o de `/app/suporte` (`SupportForm`) enviam `POST /api/support/contact`. A rota grava o ticket no Supabase e manda um aviso interno por e-mail. Não há webhook no meio do caminho.

## Fluxo

1. A rota valida o corpo com Zod. Visitante precisa de nome e e-mail. Conta logada usa o e-mail da sessão e o nome de `profiles` (não o que vier no corpo).
2. Rate limit no mesmo desenho de `analyze-live`: hash do IP, 3 envios em 24 horas, tabela `support_contact_rate_limits`. Falha ao contar ou ao registrar o IP não impede o envio. Acima do limite a resposta é 429, com texto em português.
3. Insert em `support_tickets` com `subject`, `contact_email`, `contact_name`, `user_id` (nulo para visitante) e `source = 'form'`. O número do ticket vem da trigger `tr_set_ticket_number`. A aplicação não gera esse número. Essa linha, junto com `support_messages`, é a cópia de segurança do atendimento.
4. Insert em `support_messages` com `ticket_id`, `author_id` (nulo para visitante), `is_admin = false` e `content`.
5. E-mail de aviso para a caixa única `SUPPORT_INBOX_EMAIL` (padrão `suporte@nomemagnetico.com.br`). O Reply-To é o e-mail de quem escreveu. O assunto é `[Contato NM] <assunto> — <nome>`. O corpo traz nome, e-mail, mensagem, data em `America/Sao_Paulo`, o `ticket_number` e o uuid. O envio usa SMTP Amazon SES (`src/backend/notifications/smtp.ts`).
6. Se o e-mail falha, o ticket fica gravado e a pessoa recebe sucesso. O erro entra no Sentry com a tag `fluxo=suporte_contato`.

A service role fica só no servidor. Os formulários não mudam de visual e não escrevem no banco.

## Banco

```sql
support_tickets (
  id UUID PK,
  user_id UUID NULL,
  contact_email TEXT,
  contact_name TEXT,
  subject TEXT,
  source TEXT,                    -- formulário grava 'form'
  ticket_number,                  -- trigger tr_set_ticket_number
  status TEXT,                    -- open | in_progress | resolved | closed
  priority TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ NULL
)

support_messages (
  id UUID PK,
  ticket_id UUID FK support_tickets,
  author_id UUID NULL,
  is_admin BOOLEAN,
  content TEXT,
  created_at TIMESTAMPTZ
)
```

A migration `039_remove_legacy_support_sync.sql` tira triggers e colunas da integração antiga e cria `support_contact_rate_limits`. Não mexe em `faq_embeddings` nem na trigger `faq_embeddings_before_insert`. Quem aplica é o Dev, depois do PR. O agente não aplica no banco.

A FAQ do site continua em `faq_items` / `faq_categories`. O bot Suporte lê `support_faq.support_faq_v`. Ver `support-bot-faq-readonly.md`.

## Variáveis

```bash
# SMTP Amazon SES (as mesmas da edge function send-free-pdf)
SMTP_HOST=email-smtp.regiao.amazonaws.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=contato@seudominio.com.br
# Caixa única. Vazio usa suporte@nomemagnetico.com.br.
SUPPORT_INBOX_EMAIL=suporte@nomemagnetico.com.br
```

Pagamentos e o opt-in da análise grátis continuam em `N8N_WEBHOOK_TRANSACIONAL` e `N8N_WEBHOOK_MARKETING`.

## Código

| Arquivo | Função |
| --- | --- |
| `src/pages/api/support/contact.ts` | Validação, rate limit, gravação e aviso |
| `src/backend/notifications/smtp.ts` | Transporte SMTP |
| `src/frontend/components/support/PublicContactForm.tsx` | Formulário público |
| `src/frontend/components/support/SupportForm.tsx` | Formulário da área logada |
| `supabase/migrations/039_remove_legacy_support_sync.sql` | Limpeza da sincronização antiga e tabela de rate limit |
