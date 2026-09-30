# Bot Suporte — FAQ read-only

Padrão de acesso do bot **Suporte** no Nome Magnético. Vale para Simulaweb, Vibraweb e SaaS novos: o bot lê a FAQ ativa e nada mais. Esta issue não cria FAQ nesses outros produtos.

Projeto de referência: Supabase `nome_magnetico` (`bhxneaeuhybtucmbmpvg`).

## Regra

O bot Suporte usa uma credencial própria. Essa credencial faz `SELECT` só na view da FAQ ativa. `subscriptions`, `analise_leads`, `profiles`, `auth.users`, `faq_embeddings` e o restante do banco respondem `permission denied` (`42501`).

A service role existente não muda. A migration não cria senha, JWT nem chave de API.

## O que a migration `033_support_faq_readonly.sql` cria

| Objeto | Função |
| --- | --- |
| Schema `support_faq` | Fora dos Exposed schemas do Data API. `PUBLIC` não tem `USAGE`. |
| View `support_faq.support_faq_v` | Categorias e itens com `is_active`. Sem embeddings, sem id do Chatwoot, sem meta SEO. |
| Role `support_bot` | `NOLOGIN`, `NOINHERIT`, `search_path = support_faq`. `SELECT` só na view. |

A view usa `security_invoker = false` de propósito. Com `security_invoker = true` a role precisaria de `GRANT` em `faq_items` e `faq_categories`, e passaria a ler as tabelas direto. O dono da view (postgres, owner das tabelas FAQ) lê as bases; o `WHERE is_active` é o filtro publicado.

`anon` e `authenticated` continuam lendo a FAQ ativa pelas tabelas e pela RLS de sempre. A view não entra nesse caminho.

## Por que também revoga `EXECUTE` de `PUBLIC`

No projeto, `PUBLIC` tem `USAGE` no schema `public` e `EXECUTE` nas funções `SECURITY DEFINER` do app (`ensure_profile`, `handle_new_user`, `is_admin`, `check_rate_limit_ip`, `match_faq_embeddings`). Uma role nova herdaria isso e, no caso de `ensure_profile`, escreveria em `profiles` sem `GRANT` na tabela.

A migration tira o `EXECUTE` de `PUBLIC` nessas funções. Os grants explícitos de `anon`, `authenticated` e `service_role` ficam. `handle_new_user` ganha `EXECUTE` para `supabase_auth_admin`, que dispara o trigger de cadastro e não estava na lista explícita.

Funções novas criadas por `postgres` também deixam de nascer executáveis por `PUBLIC`. O default global é que concede esse `EXECUTE`; revogar só dentro do schema `public` não tira. `anon`, `authenticated` e `service_role` seguem no `ALTER DEFAULT PRIVILEGES` do schema `public` que o Supabase já tem.

## Credencial — só depois do ok do Guilherme

A role nasce sem login. Aplicar a migration não abre conexão para o bot. A senha não entra no repositório.

Depois do ok, no SQL editor do projeto `nome_magnetico`:

```sql
ALTER ROLE support_bot WITH LOGIN PASSWORD '<senha-gerada-fora-do-git>';
```

String de conexão: usuário `support_bot`, banco `postgres`, pooler em session mode (porta 5432). Não usar a service role.

Não adicionar o schema `support_faq` aos Exposed schemas. O bot fala SQL direto. Se no futuro o Data API for o canal, o JWT precisa do claim `role=support_bot` (a migration já faz `GRANT support_bot TO authenticator`) e o schema entra nos Exposed schemas só nesse momento. `anon` continua sem `USAGE` nesse schema.

## Checklist de aceite

Rodar no SQL editor como `postgres`, depois de aplicar a migration. `SET ROLE` volta com `RESET ROLE`.

```sql
SET ROLE support_bot;

-- Esperado: linhas. Categoria ou item inativo nao aparece.
SELECT category_slug, item_slug, question
FROM support_faq.support_faq_v
LIMIT 20;

-- Esperado em todas: SQLSTATE 42501 permission denied
SELECT 1 FROM public.subscriptions LIMIT 1;
SELECT 1 FROM public.analise_leads LIMIT 1;
SELECT 1 FROM public.profiles LIMIT 1;
SELECT 1 FROM public.faq_items LIMIT 1;
SELECT 1 FROM public.faq_categories LIMIT 1;
SELECT 1 FROM public.faq_embeddings LIMIT 1;
SELECT 1 FROM auth.users LIMIT 1;
SELECT public.ensure_profile('00000000-0000-0000-0000-000000000000', 'x@example.com', 'x');

RESET ROLE;

-- A role continua sem senha ate o passo manual.
SELECT rolcanlogin FROM pg_roles WHERE rolname = 'support_bot';
-- esperado: false
```

Conferir também que o site público ainda lê `faq_items` ativos (RLS de `anon` intacta) e que um cadastro novo ainda cria perfil (`handle_new_user`).

## Réplica em outro SaaS

1. FAQ já existente com `is_active` em categorias e itens. Não recriar conteúdo.
2. Copiar a migration ajustando só colunas que não existirem (a view usa `answer_markdown`, `slug`, `is_featured`, `updated_at`).
3. Não dar `GRANT` da role em nenhuma tabela de cliente, pagamento, lead, auth ou HQ.
4. Não colocar senha na migration. Aplicar em produção só com ok de quem responde pelo SaaS.
5. Rodar o checklist acima com os nomes locais de `subscriptions` e da tabela de leads.

## Residual conhecido

O schema `net` (pg_net) é de `supabase_admin`. `PUBLIC` tem `USAGE` e as funções `http_*` nascem com `EXECUTE` para `PUBLIC`. A role `postgres` da migration não revoga isso. `support_bot` não lê tabelas por aí, mas conseguiria chamar `net.http_post` se a credencial existisse. Fechar esse caminho pede um `REVOKE` feito por `supabase_admin`, fora desta migration.

O catálogo (`pg_class`) continua listando nomes de relações. Sem `GRANT`, o `SELECT` nos dados falha.
