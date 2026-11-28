# E-mails transacionais em TESTE com Mailtrap

Última atualização: 2026-11-28 · DEV-358

Testar e-mails de pagamento (e outros eventos do `notify()`) sem envio real e sem tocar nos workflows de produção do n8n.

## Peças

| Peça | Onde | Observação |
| :--- | :--- | :--- |
| Workflow de TESTE | n8n `[NM]-[TESTE]-Eventos de e-mail (Mailtrap)` (`v3ZeFLZHhWPElWH3`) | Cópia do `[NM]-[OPS]-Eventos de e-mail`. Sem Slack, Brevo ou encaminhamento a workflows de produção. `payment.confirmed` e `payment.failed` com os templates de produção corrigidos; demais eventos caem em "Outros eventos (captura)", que manda o JSON do evento para a caixa. |
| Webhook | `https://n8n.studiomlk.com.br/webhook/events-nm-teste-<sufixo>` | O caminho completo está no nó **Webhook TESTE**. Sem o segredo de produção `N8N_EVENTS_WEBHOOK_SECRET`. |
| Caixa | Mailtrap Email Sandbox `My Sandbox` (5053033) | Só captura: nada é entregue ao destinatário. Plano gratuito limita envios por segundo. |
| Credenciais | Cofre `Studio MLK - TESTE`: `mailtrap-studiomlk` (token da API) e `NM-TESTE-Mailtrap Sandbox SMTP` (SMTP) | No n8n, credencial SMTP **Mailtrap Sandbox SMTP (TESTE)**. |

## Rodar

1. No `.env` local (nunca no `.env.1password`), aponte `N8N_WEBHOOK_TRANSACIONAL` para o webhook de TESTE e deixe `N8N_EVENTS_WEBHOOK_SECRET` vazio. `APP_URL=http://localhost:4321` faz os links do e-mail apontarem para o ambiente local (`notify()` envia `baseUrl`).
2. Gere o evento pelo app (compra no Stripe sandbox, Pix expirado etc.) ou chame `notify()` com payload sintético.
3. Confira no n8n a execução do workflow de TESTE e, no Mailtrap, assunto, texto, links e os relatórios de HTML e spam. Envio pela API do Sandbox não gera `Message-Id`, o que soma 4 pontos de spam artificiais; pelo SMTP isso não acontece.

## Regras

- Nunca disparar o workflow de produção com dados de teste: ele envia pelo Amazon SES e avisa no Slack.
- Os nós de e-mail da cópia só podem usar a credencial do Mailtrap. Ao criar ou importar nós, o n8n tende a atribuir a credencial **SMTP Amazon SES** automaticamente: confira antes de ligar o nó.
- Mudança aprovada no TESTE só vai ao workflow de produção com OK do Guilherme.

## Payload dos eventos de pagamento

- `firstName`: só o primeiro nome (`greetingFirstName`), com fallback para a parte local do e-mail e depois "Cliente".
- `baseUrl`: origem do ambiente (`APP_URL`), acrescentada pelo `notify()` a todo evento transacional.
- `payment.failed`: `payment_method` (`card` | `pix`) e `reason_type` (`expired` | `declined`) definem o texto do template.
