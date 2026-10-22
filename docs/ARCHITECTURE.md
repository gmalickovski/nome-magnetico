# ARCHITECTURE.md

## Arquitetura Geral do Nome Magnético

* **Produto:** SaaS de numerologia cabalística.
* **Modelo Comercial:** Pagamento único por ciclo de 30 dias (não recorrente).

## Produtos
* `nome_social`: produto principal (nascimento + data), 4 triângulos, bloqueios, lições kármicas, tendências.
* `nome_bebe`: avalia candidatos (sobrenome + data do bebê).
* `nome_empresa`: avalia candidatos (sócio + data opcional) e tem penalidade extra por tendência 8.

## Banco de Dados
* **Supabase Cloud:** `public` schema.
* **Auth:** `auth.users` nativo. RLS ativo em tudo.
* **Tabelas Principais:** `profiles`, `subscriptions` (metadata JSONB), `analyses`, `magnetic_names`, `ai_config`, `support_tickets`.
* **Migrations:** não crie senha na migration do `support_bot`. O bot suporta FAQ `is_active` e lookup sem expor financeiro/PDFs.

## Emails e Pagamentos
* **Auth:** Amazon SES nativo via Supabase.
* **Transacionais (Pagamentos):** via `n8n` recebendo eventos de webhook. NUNCA enviar do código. Use `notify('payment.confirmed', ...)`.
* **Pagamentos:** Checkout Stripe Hospedado. Sem Assinatura automática / Sem Pix Recorrente.

## Sentry
Erros para o Sentry (`studio-mlk / nome-magnetico`). O SDK liga com `SENTRY_DSN` se `production`. Sem tracing / Sem Replay. Dados sensíveis e IPs extraídos (scrubbed).
