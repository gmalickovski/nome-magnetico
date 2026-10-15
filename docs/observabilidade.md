# Observabilidade — Sentry

Complemento de [devops/sentry.md](devops/sentry.md). O SDK continua desligado sem DSN. No servidor ele só liga em `production` (ou com `SENTRY_ENABLED=true`).

## Ambientes

| Onde | Ambiente | Envia evento? |
| --- | --- | --- |
| VPS (`APP_ENV=production` ou `NODE_ENV=production`) | `production` | sim, com DSN |
| Browser com a meta `nm-sentry-environment` | o valor da meta (o mesmo do servidor) | sim, quando o SDK está ligado |
| Browser sem essa meta | `development` | a meta de DSN também não existe nesse HTML; se o SDK iniciar mesmo assim, o ambiente não cai em `production` |
| localhost, `127.0.0.1`, `::1`, `0.0.0.0` | qualquer | não. O `beforeSend` descarta o evento (hostname da página no cliente, `event.request.url` no servidor) |

`SENTRY_ENABLED=true` ainda permite um smoke fora de production. O descarte de host local continua valendo.

## Release

O release é a tag do deploy (`github.ref_name`, no formato `vX.Y.Z`).

- O build recebe `SENTRY_RELEASE`. Com `SENTRY_AUTH_TOKEN`, o plugin `@sentry/astro` usa `release.name` nesse valor para o upload de source maps. Sem o token o upload segue desligado e o build passa.
- Na VPS, o workflow exporta `SENTRY_RELEASE` antes do `pm2 restart --update-env` (o `pm2 start` de fallback herda o mesmo export). O `dotenv` do `start.mjs` não sobrescreve variável já definida.
- O servidor manda esse valor no `Sentry.init`. O browser lê a meta `nm-sentry-release`.

## Tag `fluxo`

Erros não tratados no middleware ganham a tag quando o pathname está na tabela. Rotas que capturam o próprio erro (e respondem 4xx/5xx ou 200 no webhook) chamam `captureFluxoException` só na falha inesperada: Stripe, Supabase, n8n, 500. Não entra validação (400), 401 de secret ou assinatura inválida do webhook.

| `fluxo` | Rotas |
| --- | --- |
| `checkout` | `POST /api/create-checkout` |
| `stripe_webhook` | `POST /api/stripe-webhook` (processamento e o fetch ao n8n transacional) |
| `resultado_gratis` | `GET /app/resultado/*`, `POST /api/analyze` (gera a análise gratuita; a mesma rota também atende Nome Social), `POST /api/analyze-live` |
| `notify_expiring` | `POST /api/internal/notify-expiring` (falha ao consultar ou ao enviar o aviso) |
| `leads` | `POST /api/save-lead`, `GET /obrigado`, opt-in da análise grátis (`marketing.free_analysis_completed` para o n8n) |
| `suporte_contato` | `POST /api/support/contact` (falha ao gravar o ticket ou ao enviar o aviso interno por e-mail). Se só o e-mail falha, o ticket permanece gravado e a pessoa recebe sucesso |

O `extra` dessa tag não leva e-mail, nome, token nem texto de análise.
