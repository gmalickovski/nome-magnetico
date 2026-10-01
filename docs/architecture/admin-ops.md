# Admin operacional (`admin.nomemagnetico.com.br`)

Painel de operação do Nome Magnético no mesmo processo Astro do site público. A Área do Analista continua em `www` (`/app/admin-analise` e `/api/admin/*`).

Issue: DEV-40.

## Host

O middleware lê o header `Host` (o Nginx deve enviar `$host`). Não usa `X-Forwarded-Host`.

Hosts de ops:

- `admin.nomemagnetico.com.br`
- `admin.localhost`
- o valor de `ADMIN_HOST_OVERRIDE`, se existir (só para desenvolvimento)

No host admin, marketing, `/app` e `/comprar` redirecionam para `APP_URL` (padrão `https://www.nomemagnetico.com.br`). APIs que não são `/api/ops/*` respondem 404.

No site público, `/ops/*` responde 404 e `/api/ops/*` responde 403. `/admin` vai para `ADMIN_OPS_URL` quando a variável está preenchida; se estiver vazia, continua em `https://hq.studiomlk.com.br`.

## Auth

- Login em `/login` (página interna `/ops/login`), reutilizando os cookies de sessão que o site já grava.
- Em `*.nomemagnetico.com.br` o cookie usa `Domain=.nomemagnetico.com.br`.
- Staff = `profiles.role = 'admin'`, conferido no middleware e de novo em cada API.
- Conta autenticada sem esse papel cai em `/sem-permissao`, sem ir para `/app`.
- `service_role` só no servidor (`src/backend/**` e `src/pages/api/ops/**`).

## Rotas desta fatia

URLs limpas no host admin. O middleware reescreve para `src/pages/ops/*`.

| URL | Estado |
|-----|--------|
| `/` | Dashboard (stub) |
| `/users` | Lista somente leitura |
| `/subscriptions`, `/billing`, `/promocoes`, `/monitor`, `/faq`, `/support`, `/blog`, `/mensagens`, `/settings` | Stub “Em breve” |
| `GET /api/ops/users` | Lista perfis: email, nome, papel, teste, produtos ativos |

Filtros da lista: `q`, `role` (`user` \| `admin`), `is_test` (`true` \| `false`), `page`, `per_page` (máx. 50).

Não há ban, grant, troca de papel, reembolso nem outras mutações.

## Como testar local

`admin.localhost` já é host de ops. O Vite aceita `*.localhost`.

```bash
# /etc/hosts, se o nome não resolver sozinho:
# 127.0.0.1 admin.localhost

npm run dev
```

Abra `http://admin.localhost:4321/login` com um usuário `profiles.role = admin`.

Para simular outro host:

```bash
ADMIN_HOST_OVERRIDE=ops.localhost npm run dev
```

Deixe `ADMIN_HOST_OVERRIDE` vazio em produção. Se apontar para `www`, o site público passa a exigir staff.

## Fora desta fatia

Mutações de usuário, billing, migração de `access_codes`, blog, campanhas e DNS/TLS. O bloco Nginx está em `docs/devops/admin-host-nginx.md` para a Infra; `scripts/nginx.conf` ainda não inclui o host admin.
