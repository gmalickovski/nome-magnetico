# DEV-253 — validação de migrations e revisão antes de deploy

Data: 08/11/2026 (America/Sao_Paulo). Base: `251a2c8`.
Autorização explícita do Guilherme neste chat para migrações/configurações necessárias nos dois bancos, sempre TESTE validado antes de produção. Nenhum deploy, merge ou tag foi executado.

## Projetos confirmados

| Ambiente | Projeto | Ref | PostgreSQL |
| --- | --- | --- | --- |
| Produção | nome_magnetico | bhxneaeuhybtucmbmpvg | 17.6.1.084 |
| TESTE | nome_magnetico_teste | kbqrkkltjvmxomrgsrbc | 17.11.0.011 |

Ambos estavam ACTIVE_HEALTHY. O ref do item NM-TESTE-Supabase, no cofre Studio MLK - TESTE, foi conferido sem imprimir credenciais. O conector Supabase forneceu acesso para a inspeção e aplicação.

## Cobertura

Foram inventariados todos os 60 arquivos SQL anteriores desta base (001–057, com números repetidos em 005, 013 e 014), os históricos remotos completos e os objetos efetivos dos schemas da aplicação: tabelas/views, colunas, defaults, constraints, índices, RLS/policies, grants, funções e triggers. Nenhum dado de cliente foi exportado ou copiado.

Histórico inicial: 78 registros em produção e 65 no TESTE. O TESTE tinha nome correspondente para todos os arquivos locais; produção mistura versões curtas, timestamps, nomes alternativos e registros duplicados. Portanto ausência de um nome no histórico não foi tratada automaticamente como SQL pendente.

## Achados corrigidos

- A tabela `chat_checkout_choices`, usada pelo checkout, webhook e retomada do chat já presentes em main, não existia em produção. A 057 já estava registrada no TESTE.
- A tabela no TESTE herdava permissões amplas para anon/authenticated. Agora anon/PUBLIC não têm acesso; authenticated possui somente SELECT com RLS por dono; service_role possui SELECT/INSERT/UPDATE/DELETE, sem TRUNCATE/REFERENCES/TRIGGER.
- `user_status` no TESTE era SECURITY DEFINER; foi alinhada ao `security_invoker` já existente em produção.
- TESTE não aceitava `scheduled`, `active_any` e `manual` nos checks de mensagens, embora produção já aceitasse.
- TESTE não tinha dois constraints e cinco índices já presentes em produção. As pré-condições tinham zero valores inválidos, zero órfãos e zero duplicatas relevantes.
- A numeração automática de suporte estava ausente no TESTE (sequência, função e trigger). Foi criada somente quando ausente; a sequência de produção nunca foi reiniciada.

## Aplicação registrada

| Ambiente | Versão remota | Nome |
| --- | --- | --- |
| TESTE | 20261108191311 | dev253_predeploy_database_parity |
| Produção | 20261108192153 | 057_chat_checkout_choice |
| Produção | 20261108192200 | dev253_predeploy_database_parity |

O arquivo novo local foi criado pelo CLI: `20261108191009_dev253_predeploy_database_parity.sql`.
Timestamps remotos são gerados pelo serviço; foram registrados os recibos, sem reescrever o histórico antigo.
Histórico final: 80 registros em produção e 66 no TESTE.

## Provas antes de promover

`scripts/sql/verify-database-predeploy-test.sql` foi executado somente no TESTE:
fixtures sintéticas de dois usuários, upsert idempotente, INSERT/UPDATE de escolha pelo servidor, restrição de assinatura, FK de análise, mensagens scheduled/manual, numeração de ticket, leitura do próprio registro, isolamento de outro usuário, view por dono e bloqueio de escrita pelo cliente/SELECT anônimo.

Todas as fixtures foram revertidas por ROLLBACK. A verificação posterior contou zero usuários, escolhas, tickets e mensagens remanescentes do teste. A sequência de tickets de TESTE pode avançar um número por execução, pois nextval não é transacional. DELETE foi verificado por privilégios no catálogo, sem exclusão real: a tentativa de ampliar o teste com DELETE não executou porque a confirmação do conector expirou.

`scripts/sql/verify-database-predeploy-catalog.sql` retornou **14/14 true** no TESTE antes da promoção e **14/14 true nos dois bancos** após produção: tabela/RLS, grants mínimos, view invoker, índices, constraints validados, função admin privada, tabela de rate limit e numeração de suporte.

O advisor de segurança deixou de apontar SECURITY DEFINER em user_status. Nos dois projetos permanece somente o aviso de proteção contra senhas vazadas desativada, não alterado nesta tarefa.

## Diferenças mantidas com justificativa

- `public.leads` e `infra_dev262.cart_recovery_sent` permanecem somente no TESTE. A primeira é legado; a segunda pertence a fluxo de recuperação ainda em andamento. Nenhuma foi promovida ou apagada automaticamente.
- O schema legado `suporte` e `public.match_documents` permanecem somente em produção. Não têm consumidores no código atual inspecionado; sua replicação no TESTE depende da definição de escopo do legado.
- `crm_funil_leads` tem diferenças de aliases internos, mantendo o contrato final. `user_status` tem diferença de projeção interna de metadata não exposta no resultado, mantendo colunas e filtros finais.
- Cinco das seis diferenças de função eram formatação/comentários. `check_rate_limit_ip` tem variável não utilizada a mais no TESTE; ambas as versões retornam TRUE. A proteção efetiva do fluxo público deve continuar sendo validada nos guards da aplicação, não presumida por essa função legada.
- Nenhuma reescrita de `supabase_migrations.schema_migrations`, migração destrutiva de dados, cópia de produção para teste ou ativação de e-mail/n8n foi feita.

Essas diferenças impedem afirmar que os bancos são clones integrais. As dependências correntes revisadas e as 14 verificações ficaram alinhadas.

## Gate obrigatório antes de qualquer deploy

1. Confirmar a tag/SHA a publicar e atualizar origin/main; não usar checkout local atrasado.
2. Comparar arquivos de migration com histórico e catálogo dos dois projetos. Não executar db push às cegas: há versões locais duplicadas e históricos heterogêneos.
3. Revisar SQL e consumidores; separar alterações de app de objetos experimentais/legados.
4. Aplicar primeiro no TESTE, executar fixtures sintéticas com rollback e catálogo, revisar advisors.
5. Com autorização explícita para produção, aplicar somente o SQL que passou no TESTE; conferir recibos, catálogo e advisors novamente. Não copiar fixtures para produção.
6. Rodar testes, Astro check e build do SHA de deploy; qualquer erro bloqueia a publicação.
7. Registrar PR/issue, plano de recuperação e evidências. Merge/tag/deploy continuam humanos salvo autorização explícita.

O script legado `scripts/verify-rls-matrix.ts` não foi usado: ele fixa o ref de produção, usa IDs estáticos e imprime OK sem assertivas. Para este gate, usar os dois SQLs revisados; o de fixtures é exclusivo do TESTE.

## Recuperação

As alterações são de schema/permissões; não houve transformação ou remoção de dados. Não remover automaticamente a nova tabela se passar a conter escolhas reais. Em caso de incidente, suspender o fluxo afetado e revisar a compatibilidade com a tag anterior, preservando dados. Grants amplos e SECURITY DEFINER não devem ser restaurados automaticamente. Qualquer mudança inversa de schema requer revisão específica.


## Validação do app e bloqueio de deploy

Após as mudanças: npm ci e build aprovados. Suíte completa com injeção somente TESTE: 467/468 aprovados; persiste a falha de rótulo em motor.test.ts:106 (Foco: Prosperidade versus Foco do Momento). Astro check tem o mesmo erro da base em resultado/[id].astro:20 (AreaFoco não exportado). Esses erros não foram causados nem corrigidos por esta migração e bloqueiam o deploy.

O inventário de CREATE TABLE de todos os 61 SQLs atuais confirmou que não falta nenhuma tabela local no TESTE. Em produção só falta public.leads, removida pelo histórico legado; chat_checkout_choices passou a existir. A ausência de leads não foi corrigida com recriação indevida.

