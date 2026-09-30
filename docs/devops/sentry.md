# Sentry — erros em produção

Monitoramento de erros não tratados do Nome Magnético no projeto Sentry **studio-mlk / nome-magnetico** (região `https://de.sentry.io`).

O app é Astro 5 com adapter Node na VPS, não Next.js. O SDK é `@sentry/astro`. O projeto no Sentry foi criado como `javascript-nextjs`; eventos do SDK Astro entram no mesmo projeto.

Issue: [DEV-97](https://linear.app/studio-mlk/issue/DEV-97/integrar-sentry-no-nome-magnetico-erros-em-producao).

## Quando o SDK envia

O SDK só inicia se houver DSN **e** o ambiente resolvido for `production`.

Ordem do ambiente: `SENTRY_ENVIRONMENT`, depois `VERCEL_ENV`, depois `APP_ENV`, depois `NODE_ENV=production`.

- Sem DSN: desligado.
- Ambiente local (qualquer valor que não seja `production`): desligado, mesmo com DSN no `.env`.
- `SENTRY_ENABLED=true`: liga fora de production (smoke local).
- `SENTRY_ENABLED=false`: desliga mesmo em production.

Tracing, Session Replay e instrumentação de SDKs de IA ficam fora. `tracesSampleRate` é `0`.

## Variáveis

Colocar na VPS (`/var/www/webapp/nome-magnetico/.env`, lido pelo `start.mjs`) e no ambiente do Cursor Cloud Agents. Não commitar o valor do DSN.

| Variável | Obrigatória | Onde | Função |
| --- | --- | --- | --- |
| `SENTRY_DSN` | sim | VPS + Cursor Cloud | DSN do servidor. O browser recebe o mesmo valor em runtime, via meta tag, só quando o SDK está ligado. |
| `PUBLIC_SENTRY_DSN` | alias | VPS + Cursor Cloud | Aceito se `SENTRY_DSN` estiver vazio. Prefixo público do Astro. |
| `NEXT_PUBLIC_SENTRY_DSN` | alias | VPS + Cursor Cloud | Nome citado no DEV-97. Aceito no servidor como alias. O Vite não expõe `NEXT_PUBLIC_` ao bundle; o HTML é montado em runtime. |
| `SENTRY_ENVIRONMENT` | não | VPS | Força a tag de ambiente (`production`, `preview`). |
| `SENTRY_RELEASE` | não | VPS | Tag de release. Sem isso o evento segue sem release. |
| `SENTRY_ENABLED` | não | local | `true` liga um smoke fora de production. |
| `SENTRY_ORG` | no build, se houver token | GitHub Actions | Default no código: `studio-mlk`. |
| `SENTRY_PROJECT` | no build, se houver token | GitHub Actions | Default no código: `nome-magnetico`. |
| `SENTRY_URL` | no build, se houver token | GitHub Actions | Default no código: `https://de.sentry.io`. |
| `SENTRY_AUTH_TOKEN` | não | **só o build** | Upload de source maps. Sem token o build passa e o stack chega minificado. |

O DSN não entra no bundle de CI. O workflow de deploy não grava o DSN no `.env` de build de propósito.

### Token de source maps

Guilherme cria em Sentry → Settings → Auth Tokens (org `studio-mlk`):

- scopes: `project:releases` e `org:read`
- secret no GitHub: `SENTRY_AUTH_TOKEN`, no job de deploy (o workflow já lê esse secret)
- não colocar o token no `.env` de runtime da VPS

Enquanto o token não existir, erros ainda aparecem. O trecho de código fica minificado.

## O que é enviado

- Exceções não tratadas no servidor: o middleware chama `captureException` e relança.
- Exceções no browser: `sentry.client.config.ts` inicia o SDK quando a meta `nm-sentry-dsn` existe. A meta só é renderizada com o SDK ligado.
- Handlers globais do SDK pegam erro de página e promise rejeitada depois do `init`.

`logError()` (tabela `error_logs`) não replica para o Sentry. Esse caminho guarda detalhe operacional no Supabase.

## Scrubbing

Equivalente ao `sendDefaultPii: false` no SDK 11, via `dataCollection`:

- sem user info, IP, e-mail, cookies, headers, query string e corpos HTTP
- sem variáveis locais de stack e sem dados de query de banco

`beforeSend` ainda redige e-mail, chaves (`sk_live`, `sk_test`, `whsec`, `sk-ant`, `gsk_`), Bearer tokens e chaves com nome de token, cookie, secret, pdf, análise ou corpo. Strings muito longas (corpo de PDF/análise colado na mensagem) são substituídas.

O ingest do Sentry ainda vê o IP de quem entrega o envelope (a VPS, nos erros de servidor; o navegador, nos erros de cliente) e pode gravar uma localização aproximada. Para não armazenar isso, Guilherme liga **Prevent Storing of IP Addresses** no projeto (`Settings → Security & Privacy`).

## Smoke

Não há link no menu, no sitemap nem na landing.

1. Admin autenticado abre `/app/sentry-test`.
2. **Disparar erro no servidor** faz `POST /api/internal/sentry-test` com a sessão.
3. **Disparar erro no navegador** envia `Sentry smoke test — Nome Magnético (client)`.

Infra, sem login:

```bash
curl -X POST https://www.nomemagnetico.com.br/api/internal/sentry-test \
  -H "X-Internal-Secret: $INTERNAL_API_SECRET"
```

Resposta `503` com `enabled: false` significa DSN ausente ou ambiente fora de production. Resposta `200` traz `eventId`. O evento leva alguns segundos para aparecer em [nome-magnetico](https://studio-mlk.sentry.io/projects/nome-magnetico/).

Buscar pela mensagem `Sentry smoke test — Nome Magnético`.
