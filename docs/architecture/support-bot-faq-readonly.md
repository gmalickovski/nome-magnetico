# Bot Suporte — FAQ e status mínimo de cliente

Padrão de acesso do bot **Suporte** no Nome Magnético. Vale para Simulaweb, Vibraweb e SaaS novos. O bot lê a FAQ ativa e faz um lookup mínimo por e-mail. O resto do banco fica negado. Esta issue não cria FAQ nos outros produtos.

Projeto de referência: Supabase `nome_magnetico` (`bhxneaeuhybtucmbmpvg`).

Guilherme autorizou o apply em produção depois que o PR estiver alinhado. A migration não cria senha. Quem aplica é o Dev; a senha continua fora do git.

## Regra

A role `support_bot` só tem:

- `SELECT` em `support_faq.support_faq_v`
- `EXECUTE` em `support_faq.support_lookup_contact(text)`

Não há `GRANT` em `profiles`, `subscriptions`, `analise_leads`, `free_analyses_leads`, `analyses`, `ai_usage`, `auth.users` nem nas outras tabelas. `SELECT` direto nessas relações responde `permission denied` (`42501`).

A service role existente não muda. A migration não cria senha, JWT nem chave de API. A role nasce `NOLOGIN`.

## O que a migration `033_support_faq_readonly.sql` cria

| Objeto | Função |
| --- | --- |
| Schema `support_faq` | Fora dos Exposed schemas do Data API. `PUBLIC` não tem `USAGE`. |
| View `support_faq.support_faq_v` | Categorias e itens com `is_active`. Sem embeddings, sem id do Chatwoot, sem meta SEO. |
| Função `support_faq.support_lookup_contact(email)` | Uma linha com o status mínimo do contato. `SECURITY DEFINER`, dono `postgres`. |
| Role `support_bot` | `NOLOGIN`, `NOINHERIT`, `search_path = support_faq`. |

A view usa `security_invoker = false` de propósito. Com `security_invoker = true` a role precisaria de `GRANT` em `faq_items` e `faq_categories`. O dono da view lê as bases; o `WHERE is_active` é o filtro publicado.

A função também é do dono (`postgres`), com `search_path = public`. O corpo não seleciona colunas de pagamento, PDF ou texto de análise. `EXECUTE` fica só em `support_bot`.

`anon` e `authenticated` continuam lendo a FAQ ativa pelas tabelas e pela RLS de sempre.

## Lookup por e-mail

Chamada: `SELECT * FROM support_faq.support_lookup_contact('pessoa@email.com')`.

O e-mail é comparado com `lower(btrim(...))`. A função devolve sempre uma linha.

| Situação | Flags | Campos |
| --- | --- | --- |
| Existe em `profiles` | `is_registered` | `profile_id`, `email`, `nome`, `profile_created_at` do perfil mais antigo com aquele e-mail |
| Assinatura ativa em algum desses perfis | `is_subscriber` | `product_types` (distintos) e `subscription_ends_at` |
| Linha em `analise_leads` e/ou `free_analyses_leads` e nenhum profile | `is_lead_only` | datas e, na análise gratuita, `free_analysis_status` |
| Nenhum dos três | as três flags falsas | e-mail normalizado, resto nulo |

Assinatura ativa: `refunded_at IS NULL` e (`ends_at IS NULL` ou `ends_at > now()`). Se alguma assinatura ativa não tem `ends_at`, `subscription_ends_at` volta nulo (acesso sem prazo). Caso contrário é o maior `ends_at`.

Fora do retorno: ids Stripe/Asaas, `amount_paid`, `metadata`, dados de reembolso, `pdf_base64`, `error_message`, data de nascimento, nome do lead e qualquer coluna de `analyses`.

Quem já tem profile não é `is_lead_only`, mesmo que também esteja numa tabela de lead. As datas de lead ficam nulas nesse caso. `profiles.is_test` não entra neste lookup.

## Por que também revoga `EXECUTE` de `PUBLIC`

No projeto, `PUBLIC` tem `USAGE` no schema `public` e `EXECUTE` nas funções `SECURITY DEFINER` do app (`ensure_profile`, `handle_new_user`, `is_admin`, `check_rate_limit_ip`, `match_faq_embeddings`). Uma role nova herdaria isso e, no caso de `ensure_profile`, escreveria em `profiles`.

A migration tira o `EXECUTE` de `PUBLIC` nessas funções. Os grants explícitos de `anon`, `authenticated` e `service_role` ficam. `handle_new_user` ganha `EXECUTE` para `supabase_auth_admin`, que dispara o trigger de cadastro.

Funções novas criadas por `postgres` também deixam de nascer executáveis por `PUBLIC`. O default que concede esse `EXECUTE` é global; revogar só dentro do schema `public` não tira. `anon`, `authenticated` e `service_role` seguem no `ALTER DEFAULT PRIVILEGES` do schema `public`.

## Credencial

A role nasce sem login. Aplicar a migration não abre conexão para o bot. A senha não entra no repositório.

Quando for a hora de ligar o bot, no SQL editor do projeto `nome_magnetico`:

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

-- Esperado: uma linha. Flags conforme o e-mail (cadastro, assinante ou so lead).
SELECT *
FROM support_faq.support_lookup_contact('algum@email');

-- Esperado em todas: SQLSTATE 42501 permission denied
SELECT 1 FROM public.subscriptions LIMIT 1;
SELECT 1 FROM public.analise_leads LIMIT 1;
SELECT 1 FROM public.free_analyses_leads LIMIT 1;
SELECT 1 FROM public.profiles LIMIT 1;
SELECT 1 FROM public.analyses LIMIT 1;
SELECT 1 FROM public.ai_usage LIMIT 1;
SELECT 1 FROM public.faq_items LIMIT 1;
SELECT 1 FROM public.faq_embeddings LIMIT 1;
SELECT 1 FROM auth.users LIMIT 1;

RESET ROLE;

SELECT rolcanlogin FROM pg_roles WHERE rolname = 'support_bot';
-- esperado: false
```

Conferir também que o site público ainda lê `faq_items` ativos e que um cadastro novo ainda cria perfil (`handle_new_user`).

## Réplica em outro SaaS

1. FAQ já existente com `is_active` em categorias e itens. Não recriar conteúdo.
2. Copiar a migration ajustando colunas que não existirem (a view usa `answer_markdown`, `slug`, `is_featured`, `updated_at`).
3. O lookup usa `profiles` (id, email, nome, created_at), `subscriptions` (user_id, product_type, ends_at, refunded_at) e as tabelas de lead do produto. Não selecionar PDF, pagamento ou conteúdo de análise.
4. Não dar `GRANT` da role nessas tabelas. Só `SELECT` na view e `EXECUTE` na função.
5. Não colocar senha na migration.
6. Rodar o checklist com os nomes locais das tabelas.

## Residual conhecido

O schema `net` (pg_net) é de `supabase_admin`. `PUBLIC` tem `USAGE` e as funções `http_*` nascem com `EXECUTE` para `PUBLIC`. A role `postgres` da migration não revoga isso. `support_bot` não lê tabelas por aí, mas conseguiria chamar `net.http_post` se a credencial existisse. Fechar esse caminho pede um `REVOKE` feito por `supabase_admin`, fora desta migration.

O catálogo (`pg_class`) continua listando nomes de relações. Sem `GRANT`, o `SELECT` nos dados falha.
