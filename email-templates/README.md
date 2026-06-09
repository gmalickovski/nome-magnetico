# Email Templates — Nome Magnético

Templates HTML para emails transacionais. O envio atual deve usar Amazon SES.

## Arquitetura

```
Código (notify.ts) → n8n webhook → n8n workflow → Amazon SES → usuário
```

- **Webhook transacional**: `N8N_WEBHOOK_TRANSACIONAL` — todos os eventos exceto `support.*`
- **Webhook suporte**: `N8N_WEBHOOK_SUPORTE` — apenas eventos `support.*`

## Payload recebido pelo n8n

```json
{
  "event": "nome.do.evento",
  "payload": { "...campos específicos..." },
  "timestamp": "2026-03-18T09:00:00.000Z"
}
```

## Templates e eventos

| Arquivo | Evento | Placeholders |
|---------|--------|-------------|
| `welcome.html` | `user.welcome` | `{{firstName}}` |
| `supabase-email-verification.html` | Supabase Auth `Magic Link` | `{{ .SiteURL }}`, `{{ .TokenHash }}` |
| `password-reset.html` | `user.password_reset` | `{{resetUrl}}` |
| `payment-confirmed.html` | `payment.confirmed` | `{{firstName}}`, `{{productName}}`, `{{accessUrl}}` |
| `payment-failed.html` | `payment.failed` | `{{firstName}}` |
| `subscription-expiring.html` | `subscription.expiring_soon` | `{{firstName}}`, `{{daysLeft}}`, `{{renewUrl}}` |
| `subscription-expired.html` | `subscription.expired` | `{{firstName}}`, `{{renewUrl}}` |
| `analysis-complete.html` | `user.analysis_complete` | `{{firstName}}`, `{{analysisUrl}}` |
| `marketing-free-analysis-upsell-01.html` | `marketing.free_analysis_completed` | `{{firstName}}`, `{{nomeCompleto}}`, `{{analysisUrl}}`, `{{checkoutUrl}}`, `{{score}}`, `{{bloqueios}}`, `{{licoesCarmicas}}`, `{{tendenciasOcultas}}`, `{{debitosCarmicos}}`, `{{couponBlock}}`, `{{unsubscribeUrl}}` |
| `marketing-free-analysis-upsell-02.html` | `marketing.free_analysis_reminder_24h` | `{{firstName}}`, `{{analysisUrl}}`, `{{checkoutUrl}}`, `{{couponBlock}}`, `{{unsubscribeUrl}}` |
| `marketing-free-analysis-upsell-03-coupon.html` | `marketing.free_analysis_coupon_72h` | `{{firstName}}`, `{{checkoutUrl}}`, `{{couponCode}}`, `{{discountLabel}}`, `{{couponExpiresAt}}`, `{{unsubscribeUrl}}` |
| `support-confirmation.html` | `support.ticket_created` | `{{nome}}`, `{{assunto}}` |

## Como usar no n8n

## Template de verificação posterior no Supabase

O botão "Verificar E-mail" do app usa o fluxo de Magic Link do Supabase para confirmar `profiles.email_verified_at`.
Por isso, o HTML em `supabase-email-verification.html` deve ser colado no painel do Supabase em:

`Authentication` -> `Email Templates` -> `Magic Link`

Assunto sugerido:

`Confirme seu e-mail - Nome Magnético`

O template monta o link direto para `/auth/confirmar-email?token_hash={{ .TokenHash }}&type=magiclink&redirect=/app`.
Esse caminho evita exibir o usuário em uma página intermediária do Supabase: a página do app valida o token com `verifyOtp`, marca `profiles.email_verified_at` e redireciona para `/app`.

### Workflow transacional (events-nm)

1. **Webhook Trigger** — recebe POST com `event` e `payload`
2. **Switch node** — roteia por `{{ $json.event }}`
3. Para cada rota: **Set node** para extrair campos do `payload`, depois **Send Email node** (Resend) com o HTML do template

### Substituição de variáveis no node de email

No campo "Email Body (HTML)", cole o conteúdo do template e use expressões n8n:

```
{{ $('Set').item.json.firstName }}
```

Substitua cada `{{placeholder}}` pela expressão correspondente.

### Configurar assunto por evento

| Evento | Sugestão de assunto |
|--------|-------------------|
| `user.welcome` | Bem-vindo ao Nome Magnético ✨ |
| `user.password_reset` | Redefinição de senha |
| `payment.confirmed` | Pagamento confirmado — acesso liberado ✅ |
| `payment.failed` | Problema no seu pagamento ⚠️ |
| `subscription.expiring_soon` (7d) | Seu acesso expira em 7 dias |
| `subscription.expiring_soon` (1d) | Último dia — renove seu acesso hoje! |
| `subscription.expired` | Seu acesso expirou — renove agora |
| `user.analysis_complete` | Sua análise numerológica está pronta 🌟 |
| `marketing.free_analysis_completed` | {{firstName}}, sua análise gratuita revelou o próximo passo |
| `marketing.free_analysis_reminder_24h` | {{firstName}}, seu nome pode ter uma versão mais fluida |
| `marketing.free_analysis_coupon_72h` | {{firstName}}, seu cupom para o Nome Social está ativo |
| `support.ticket_created` | Recebemos sua mensagem 📬 |

### Diferenciação 7d vs 1d em subscription.expiring_soon

Use um **IF node** após o Switch para verificar `{{ $json.payload.daysLeft }}`:
- `daysLeft == 7` → assunto informativo, banner gold
- `daysLeft == 1` → assunto urgente, banner vermelho (ajuste a cor no template)

## Endpoint de expiração (automação diária)

Configurar no n8n:
1. **Schedule Trigger** — todo dia às 09:00
2. **HTTP Request** — `POST https://seusite.com.br/api/internal/notify-expiring`
   - Header: `X-Internal-Secret: <valor de INTERNAL_API_SECRET>`
3. Retorna: `{ sent: N, groups: { expiring7d: N, expiring1d: N, expired: N } }`

## Variáveis de ambiente necessárias

```bash
N8N_WEBHOOK_TRANSACIONAL=https://n8n.seudominio.com.br/events-nm
N8N_WEBHOOK_SUPORTE=https://n8n.seudominio.com.br/suport-nm
INTERNAL_API_SECRET=<uuid-aleatorio>
```
