# Email marketing do Nome Social

## Objetivo

Converter usuarios que concluiram a analise gratuita para o produto Nome Social sem misturar regra comercial no site.

## Evento do app

Quando uma analise gratuita termina com sucesso, `src/pages/api/analyze.ts` dispara:

```json
{
  "event": "marketing.free_analysis_completed",
  "payload": {
    "email": "cliente@email.com",
    "firstName": "Cliente",
    "analysisId": "uuid",
    "analysisUrl": "https://nomemagnetico.com.br/app/resultado/uuid",
    "productType": "nome_social",
    "productName": "Nome Social",
    "offerUrl": "https://nomemagnetico.com.br/nome-social",
    "checkoutUrl": "https://nomemagnetico.com.br/auth/cadastro?produto=nome_social",
    "score": 72,
    "bloqueios": 2,
    "licoesCarmicas": 1,
    "tendenciasOcultas": 3,
    "debitosCarmicos": 1,
    "source": "free_analysis_completed"
  }
}
```

Esse evento usa o webhook dedicado:

```bash
N8N_WEBHOOK_MARKETING=https://n8n.seudominio.com.br/webhook/nm-email-marketing
```

## Templates

Use os templates abaixo no n8n:

| Momento | Template | Assunto sugerido |
| --- | --- | --- |
| Imediato | `email-templates/marketing-free-analysis-upsell-01.html` | `{{firstName}}, sua analise gratuita revelou o proximo passo` |
| +24h | `email-templates/marketing-free-analysis-upsell-02.html` | `{{firstName}}, seu nome pode ter uma versao mais fluida` |
| +72h com cupom | `email-templates/marketing-free-analysis-upsell-03-coupon.html` | `{{firstName}}, seu cupom para o Nome Social esta ativo` |

O workflow base para importar/adaptar esta em `n8n_workflows/workflow-email-marketing-free-analysis-upsell`.

Substituicoes minimas:

- `{{firstName}}` -> `payload.firstName`
- `{{analysisUrl}}` -> `payload.analysisUrl`
- `{{checkoutUrl}}` -> `payload.checkoutUrl`
- `{{score}}` -> `payload.score`
- `{{bloqueios}}` -> `payload.bloqueios`
- `{{licoesCarmicas}}` -> `payload.licoesCarmicas`
- `{{tendenciasOcultas}}` -> `payload.tendenciasOcultas`
- `{{debitosCarmicos}}` -> `payload.debitosCarmicos`
- `{{couponBlock}}` -> bloco HTML opcional com cupom/desconto ativo
- `{{couponCode}}` -> codigo do cupom criado no HQ
- `{{discountLabel}}` -> texto do desconto, por exemplo `20% OFF` ou `R$ 20 OFF`
- `{{couponExpiresAt}}` -> texto de validade, por exemplo `valido ate 07/05`
- `{{unsubscribeUrl}}` -> link de descadastro ou preferencia de comunicacao

## Cupom e HQ

O HQ continua sendo a fonte de precos, promocoes e cupons. O n8n pode operar de duas formas:

1. **Cupom fixo no workflow**: defina `couponCode`, `discountLabel` e `discountExpiresAt` em um Set node quando quiser uma campanha manual.
2. **Cupom ativo do HQ**: adicione um HTTP Request node antes do email para consultar a promocao publica do HQ e montar `discountBlock`.

O app nao deve gravar desconto no payload, porque o valor final ja e resolvido pelo checkout/HQ.

## Sequencia recomendada

1. **Imediato apos a analise gratuita ficar completa**
   - Gatilho: app envia `marketing.free_analysis_completed` para `N8N_WEBHOOK_MARKETING`.
   - Enviar template `marketing-free-analysis-upsell-01.html`.
   - Objetivo: converter enquanto o diagnostico esta fresco.
   - CTA: `{{checkoutUrl}}`.
   - Cupom: opcional. Se nao houver cupom, substituir `{{couponBlock}}` por string vazia.

2. **24 horas depois**
   - Antes de enviar, consultar Supabase:
     - tabela `subscriptions`
     - `user_id = payload.userId`
     - `product_type = nome_social`
     - `is_active = true`
   - Se ja comprou, parar a sequencia.
   - Se nao comprou, enviar `marketing-free-analysis-upsell-02.html`.
   - Objetivo: reforcar diferenca entre diagnostico gratuito e plano de acao completo.
   - Cupom: opcional.

3. **72 horas depois do primeiro e-mail**
   - Repetir a checagem de compra no Supabase.
   - Se ja comprou, parar a sequencia.
   - Se nao comprou, buscar/receber cupom criado no HQ e enviar `marketing-free-analysis-upsell-03-coupon.html`.
   - Objetivo: incentivo final com condicao especial.
   - Variaveis obrigatorias nesse e-mail: `{{couponCode}}`, `{{discountLabel}}`, `{{couponExpiresAt}}`.

Para checar compra antes dos passos 2 e 3, o n8n deve consultar `subscriptions` filtrando `user_id`, `product_type = nome_social` e `is_active = true`.

## Estrutura do workflow no n8n

1. Webhook Trigger
   - Method: `POST`
   - Path: `nm-email-marketing`
   - URL final: `https://n8n.studiomlk.com.br/webhook/nm-email-marketing`

2. IF/Switch
   - Condicao: `event == marketing.free_analysis_completed`

3. Normalizar payload
   - Extrair `payload.email`, `payload.firstName`, `payload.userId`, `payload.analysisUrl`, `payload.checkoutUrl`, diagnostico e produto.
   - Criar `unsubscribeUrl` se houver sistema de descadastro.
   - Criar `couponBlock` vazio no primeiro envio, ou preenchido se o HQ ja devolver cupom.

4. Enviar e-mail imediato
   - Template: `marketing-free-analysis-upsell-01.html`
   - SMTP: Amazon SES.

5. Wait 24h
   - Consultar Supabase para ver se comprou Nome Social.
   - Se comprou: finalizar.
   - Se nao comprou: enviar template 02.

6. Wait ate completar 72h do gatilho inicial
   - Consultar Supabase novamente.
   - Se comprou: finalizar.
   - Se nao comprou: inserir/consultar cupom do HQ e enviar template 03.

## Bloco HTML de cupom opcional

Quando quiser preencher `{{couponBlock}}`, usar algo neste formato:

```html
<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.08);border-radius:14px;margin:0 0 22px;">
  <tr>
    <td style="padding:16px 18px;text-align:center;">
      <p style="margin:0 0 6px;color:#10b981;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Condicao especial ativa</p>
      <p style="margin:0;color:#e5e2e1;font-size:15px;">Use o cupom <strong style="color:#f2ca50;">{{couponCode}}</strong> para {{discountLabel}}</p>
      <p style="margin:8px 0 0;color:#8f8a83;font-size:12px;">{{couponExpiresAt}}</p>
    </td>
  </tr>
</table>
```

## Anti-abuso

O cadastro bloqueia dominios descartaveis comuns em `src/backend/security/disposableEmail.ts`, incluindo `temp-mail.org`.

## Sync direta com a Brevo (DEV-148)

Depois que a analise gratis fica `complete`, `src/pages/api/analyze.ts` chama `syncFreeAnalysisToBrevo` (`src/backend/brevo/sync-free-analysis.ts`). O upsert e `POST https://api.brevo.com/v3/contacts` com `updateEnabled: true` (idempotente por e-mail). Atributos: `NOME`, `ANALISE_DATA` (`YYYY-MM-DD`), `SCORE`, `ANALISE_ID`. A lista e `BREVO_FREE_LIST_ID`.

O score gravado no contato e o mesmo ja persistido em `public.analyses.score` no momento do calculo. A coluna e integer nullable (migration `008`, reforcada de forma idempotente em `037_analyses_score_nullable.sql`).

Consentimento LGPD: o formulario da analise gratis e `POST /api/save-lead` (`analise_leads`) nao tem campo de marketing. A sync so ocorre quando o body de `POST /api/analyze` traz `marketing_consent === true`. Sem esse booleano, ou sem `BREVO_API_KEY` / `BREVO_FREE_LIST_ID`, a chamada e no-op. Timeout curto; erro da Brevo nao altera o status da analise.

```bash
BREVO_API_KEY=
BREVO_FREE_LIST_ID=
```
