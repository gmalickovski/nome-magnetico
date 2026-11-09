# DEV-121 — Resgate transacional de trials

Validação: 08/11/2026 (America/Sao_Paulo). PR #127.

## Causa e comportamento

A versão anterior consumia access_code_uses antes de inserir subscriptions, ignorava erros das inserções e podia retornar sucesso sem acesso. O identificador trial_{codigo} também colidia entre produtos e usuários. O índice único de access_code_uses permite um uso por código e usuário, impedindo contabilização separada por produto.

O backend agora chama redeem_access_trial uma única vez. A função SECURITY INVOKER bloqueia perfil e código, valida estado/expiração/limite/uso anterior e confirma uso, assinaturas, perfil e auditoria na mesma transação. Erro SQL desfaz tudo e permite tentar novamente. max_uses é conferido sob lock do código. Assinaturas usam trial_{codeId}_{userId}_{product}. O prefixo trial_ e metadata de origem foram preservados.

Um produto é gravado com seu tipo; resgates multiproduto usam uma única linha all. O escopo efetivo continua nas assinaturas por produto; all não amplia o acesso. Configuração vazia usa nome_social, único produto vendável atual. Se o catálogo vendável mudar, atualizar a função junto de SELLABLE_PRODUCT_TYPES.

Clientes anon/authenticated não executam a RPC. Somente service_role, no backend, possui EXECUTE; a função não eleva privilégios e usa search_path vazio. A rota existente continua obtendo userId/e-mail da sessão e ignorando dias/produtos fornecidos pelo cliente. Nenhum fluxo de cupom de desconto ou Stripe Checkout foi alterado.

## Evidências

- 479 testes unitários passaram com op run e referências do cofre TESTE, sem gravar segredos.
- npx astro check: 0 erros, 0 warnings.
- npm run build: passou.
- lint:polling e 18 guardrails: passaram.
- scripts/sql/verify-dev121-trial-transaction-test.sql: testes reais no TESTE sob service_role; produto único, configuração vazia, 3 produtos, subset gift, dois usuários no mesmo código, limite, repetição, legado, acesso ativo e parcial, códigos inválidos, grants.
- Falhas forçadas na assinatura e auditoria final: nenhuma persistência parcial de uso/assinatura/perfil; nova tentativa com o mesmo código passou após remover a falha sintética. Testes SQL e triggers desfeitos por ROLLBACK.
- Duas chamadas concorrentes para código sintético max_uses=1: uma 200 e outra 400 por limite; exatamente um uso e uma assinatura. Fixtures removidas; contagem final de usuários/códigos sintéticos zero.
- Advisors de segurança TESTE/produção: nenhum achado novo; somente aviso preexistente de proteção contra senhas vazadas desativada.

## Migração e produção

Arquivo criado pela CLI: supabase/migrations/20261109000041_dev121_atomic_trial_redemption.sql.
Aplicado TESTE kbqrkkltjvmxomrgsrbc primeiro, depois produção bhxneaeuhybtucmbmpvg após testes.
Hash md5(pg_get_functiondef): 8a1b61f065e335ed37631d17eb08047d em ambos.
invoker=true; anon_execute=false; authenticated_execute=false; service_execute=true em ambos.
Sem fixtures ou testes de concessão em produção; nenhuma chamada de IA, cobrança ou e-mail.
A aplicação usa a RPC após deploy do código; merge não faz deploy.

## Rollback

Antes de qualquer deploy, confirmar a presença da RPC e grants. A migration é aditiva, sem reescrever usos antigos. Em falha após deploy, reverter a aplicação à tag anterior pelo processo humano de deploy e preservar a função enquanto houver instâncias usando-a. Não apagar usos ou assinaturas válidos. Remoção da função, se necessária, deve ocorrer só depois que nenhum consumidor novo estiver ativo. Históricos de migrations não foram reescritos nem sincronizados por db push.

Referência técnica: https://supabase.com/docs/guides/database/functions.
