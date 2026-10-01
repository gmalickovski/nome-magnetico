# Painel staff em admin.nomemagnetico.com.br

Fatia 1 do DEV-40. O painel operacional do Nome Magnético passa a viver no mesmo processo do SaaS, num host separado. A Área do Analista continua em `www` (`/app/admin-analise` e `/api/admin/*`).

## Host

| Host | O que entrega |
| --- | --- |
| `admin.nomemagnetico.com.br` | Painel staff. URLs curtas (`/`, `/login`, `/users`) são reescritas para `/ops/*`. |
| `www.nomemagnetico.com.br` e o apex | Site e app do cliente. `/ops` e `/api/ops` respondem 404. `/admin` segue redirecionando para o HQ. |
| `localhost` com `astro dev` | Atalho `/ops` e `/api/ops` para o time testar sem DNS. O build da VPS não abre esse atalho. |

Hosts extras entram em `OPS_HOSTS` (lista separada por vírgula). `admin.localhost` já é host staff.

O gate lê o header `Host`, que o Nginx substitui por `$host`. `X-Forwarded-Host` é ignorado.

## Auth

Login só de staff, em `/login` no host admin (em localhost, `/ops/login`).

- Cookies próprios: `nm-ops-access-token` e `nm-ops-refresh-token`.
- `HttpOnly`, `SameSite=Lax`, sem `Domain` (não vazam para `www`). `Secure` quando `X-Forwarded-Proto` é `https`.
- O cookie da área do cliente não abre o painel.
- Cada request confirma o JWT e `profiles.role = admin` no servidor. Conta comum recebe 403 e nenhum cookie.
- `GET /api/ops/users` repete a checagem de role antes de ler o banco.
- A service role fica em `src/backend/`. O browser só fala com `/api/ops/*`.
- Login: 10 tentativas por IP a cada 15 minutos.

## Rotas desta fatia

| URL no host admin | Interna | Função |
| --- | --- | --- |
| `/login` | `/ops/login` | Login staff |
| `/` | `/ops` | Painel (contagens) |
| `/users` | `/ops/users` | Usuários, somente leitura |
| `POST /api/ops/auth/login` | — | Sessão admin |
| `POST /api/ops/auth/logout` | — | Encerra a sessão |
| `GET /api/ops/users` | — | Mesma lista, JSON |

A lista mostra email, nome, papel, teste, produtos com `ends_at` no futuro e data de cadastro. Não mostra telefone, nascimento, valor pago nem ids de pagamento. Não há edição.

Fora do mapa, o host admin responde 404. Isso inclui `/app`, `/api/admin` e o restante do site.

## Próximas fatias

Assinaturas, cobrança, promoções, monitor, FAQ, suporte, blog, mensagens e ajustes. `access_codes` continua no plano adapter HQ → tabelas no Supabase do Nome Magnético → cutover, sem entrar nesta fatia.

DNS, certificado e o server block do Nginx ficam em `docs/devops/admin-host.md`. Não aplicar na VPS sem aprovação do Guilherme.
