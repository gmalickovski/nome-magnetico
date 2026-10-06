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

## Rotas

URLs limpas no host admin. O middleware reescreve para `src/pages/ops/*`.

| URL | Estado |
|-----|--------|
| `/` | Dashboard (stub, com atalhos) |
| `/users` | Lista de usuários |
| `/users/:id` | Ficha, papel e acesso teste |
| `/subscriptions` | Assinaturas, somente leitura |
| `/promocoes` | Promoções e códigos de acesso: criar, listar, desativar e reativar |
| `/billing`, `/monitor`, `/faq`, `/support`, `/blog`, `/mensagens`, `/settings` | Stub “Em breve” |

### Usuários

`GET /api/ops/users` lista perfis. Filtros: `q`, `role` (`user` | `admin`), `is_test` (`true` | `false`), `page`, `per_page` (máx. 50).

`GET /api/ops/users/:id` devolve a ficha: email, nome, telefone, papel, teste, produtos ativos (assinatura com `ends_at` futuro e `refunded_at` nulo), nascimento, gênero, confirmação de email, último acesso e origem. A resposta inclui `is_self`.

`PATCH /api/ops/users/:id` aceita um ou mais destes campos:

| Campo | Efeito |
|-------|--------|
| `role` | `user` ou `admin` |
| `is_test` | liga ou desliga o acesso teste em `profiles` |
| `test_ends_at` | data ISO com fuso, ou `null` para teste sem expiração |

Ao desligar o teste, `test_ends_at` volta para `null`. A própria conta não pode perder o papel admin. Também não dá para rebaixar o último admin. O log no servidor registra só o id de quem alterou, o id alvo e os campos — sem email.

`profiles` não tem coluna de banimento ou desativação. Esta fatia não grava `banned_until` no Auth e não cria tabela nova.

### Assinaturas

`GET /api/ops/subscriptions` lê `subscriptions` e junta email/nome de `profiles`. Sem mutação.

Filtros: `q` (email, nome, ou UUID de usuário/assinatura), `user_id`, `product_type` (`nome_social` | `nome_bebe` | `nome_empresa`), `status` (`active` | `expired` | `refunded`), `provider` (`stripe` | `asaas`), `kind` (`trial` | `paid`), `page`, `per_page` (máx. 50).

A busca por texto considera no máximo 100 perfis. Trial é `stripe_session_id` começando com `trial_`; esse código não volta na resposta. Sessão Stripe e id Asaas voltam só quando não é trial. `kind=paid` inclui sessão nula. `metadata` e ids de reembolso Stripe ficam de fora.

Situação ativa: `refunded_at` nulo e `ends_at` no futuro.

### Promoções e códigos de acesso

Tela `/promocoes` com duas abas. Tudo passa por `/api/ops/*`: o browser só faz `fetch`, nunca grava no banco. As tabelas `promotions`, `access_codes` e `access_code_uses` (migrations `035_ops_promotions_access_codes.sql` e `036_promotions_access_codes_parity.sql`) têm RLS ligado, sem grant para `anon` nem `authenticated`; só a `service_role` do servidor lê e grava.

O checkout, a landing e `/acesso/resgatar` leem esse registro. Falha no banco devolve preço Stripe sem promoção. `HQ_API_URL` não é mais lido.

| Rota | Método | Efeito |
|------|--------|--------|
| `/api/ops/promotions` | GET | Lista. Filtros: `state` (`active` \| `scheduled` \| `expired` \| `inactive`), `page`, `per_page` (máx. 50) |
| `/api/ops/promotions` | POST | Cria: `name`, `product_types`, `discount_type`, `discount_value`, `starts_at` (opcional), `ends_at`, `banner_text` (opcional) |
| `/api/ops/promotions/:id` | PATCH | `{ "is_active": boolean }` desativa ou reativa |
| `/api/ops/access-codes` | GET | Lista. Filtros: `q` (código ou nota), `kind` (`trial` \| `gift` \| `coupon`), `state` (`active` \| `expired` \| `inactive`), `page`, `per_page` |
| `/api/ops/access-codes` | POST | Cria: `code`, `kind`, `product_types`, `trial_days` (trial/gift) ou `discount_type` + `discount_value` (coupon), `expires_at`, `max_uses` (opcional, vazio = ilimitado), `note` |
| `/api/ops/access-codes/:id` | PATCH | `{ "is_active": boolean }` |

Regras:

- Desativar é lógico (`is_active = false` e `deactivated_at`). Não há DELETE, então um código desativado continua ocupando o valor; reative em vez de recriar.
- `product_types` vazio vale para todos os produtos.
- Desconto percentual vai de 1 a 100. Valor fixo é guardado em **centavos** de BRL, até R$ 1.000,00. O contrato público da promoção (`ActivePromotion.discountValue` de tipo `fixed`) continua em reais, como o HQ.
- Código: 3 a 40 caracteres `A-Z 0-9 - _`, gravado em maiúsculas e único. Lookup ignora hífen e caixa. Duplicado responde 409.
- Trial e presente exigem 1 a 365 dias e não aceitam desconto. Cupom exige desconto e não aceita dias.
- Nas mutações o servidor exige host admin, staff, mesma origem (`Origin`) e `Content-Type: application/json` (`src/backend/security/opsGate.ts`). O log registra só ids e campos, sem email.
- A coluna "Usos" conta `access_code_uses` (cupom, trial e presente) e mostra o limite (`max_uses`; vazio = ilimitado).
- Resgate de trial valida o código em `access_codes` e usa `trial_days` / `product_types` do banco, não da URL. Código inexistente não concede acesso. `trial_redemptions` continua registrando o resgate.
- Se a migration 035/036 ainda não foi aplicada, a API responde 503 com aviso em vez de 500.

Importação HQ → NM: [`docs/devops/import-hq-promotions.md`](../devops/import-hq-promotions.md). A 036 precisa ser aplicada antes do deploy.

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

O que conferir nesta fatia:

- `/users` abre a ficha ao clicar no email.
- Na ficha, trocar papel e ligar/desligar teste persiste depois de recarregar.
- A própria conta não oferece troca de papel. Rebaixar o último admin responde 409.
- `/subscriptions` filtra por produto, situação, provedor e tipo. Não há botão de reembolso.
- `/promocoes` cria, filtra e desativa/reativa promoções e códigos. Banner, limite de usos e contagem real aparecem na lista. Com a conta sem papel admin a API responde 403.
- No host público, `/api/ops/*` continua 403.

## Fora desta fatia

Banimento, billing, reembolso, blog, campanhas e DNS/TLS. O bloco Nginx está em `docs/devops/admin-host-nginx.md` para a Infra; `scripts/nginx.conf` ainda não inclui o host admin. Importação dos dados do HQ: `docs/devops/import-hq-promotions.md`.
