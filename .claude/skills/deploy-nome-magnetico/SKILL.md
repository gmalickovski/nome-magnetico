---
name: deploy-nome-magnetico
description: Use quando o Guilherme pedir deploy, tag ou release do Nome Magnético. Compara TESTE e produção, valida mudanças no banco e acompanha GitHub Actions até o smoke test.
---

# Deploy do Nome Magnético

Operar no repo `gmalickovski/nome-magnetico`. Ler `AGENTS.md`, `DEPLOY.md`, `.github/workflows/deploy.yml` e `docs/devops/dev253-database-predeploy-validation.md` da revisão a publicar. Os caminhos abaixo são relativos à raiz do repo.

O workflow dispara por push de tag `v*.*.*`, faz checkout, Node 20, build com configuração pública de produção e envio de artefatos à VPS. Executa `pm2 restart` (breve indisponibilidade), apesar da referência antiga a reload no manual. `SENTRY_RELEASE` recebe a tag. Migrations NÃO são aplicadas pelo Actions; segredos ficam no ambiente fixo da VPS.

## 1. Pré-condições e candidato

- Exigir PR revisado/aprovado pelo Dev, OK explícito de Guilherme nesta sessão, CI/testes verdes, migrations testadas no Supabase TESTE e issue em In Review antes de publicar. Aprovação de outro agente não vale como OK humano.
- Reaproveitar autorização já dada nesta sessão para o mesmo escopo; não perguntar novamente por rotina. Criar a skill ou aprovar código não autoriza automaticamente uma release.
- Executar `git fetch origin --tags`, conferir os PRs necessários e fixar o SHA de `origin/main`. Se o humano já fez merge, apenas verificar; não repetir merge nem reabrir issues finalizadas.
- Rodar `npm test`, `npx astro check` e `npm run build` no SHA candidato com dependências do lockfile. Testes de uma branch anterior não cobrem automaticamente o merge. Falhas bloqueiam a tag. Localmente, usar configuração TESTE sem clientes, pagamentos ou IA paga.

## 2. Comparação TESTE → produção e backup

- Confirmar destinos pelo conector: TESTE `nome_magnetico_teste` (`kbqrkkltjvmxomrgsrbc`); produção `nome_magnetico` (`bhxneaeuhybtucmbmpvg`). A inspeção de produção deve estar autorizada na sessão. Começar somente com metadados e conteúdo público funcional necessário, sem dados de clientes.
- Comparar migrations do SHA, históricos remotos e catálogo efetivo: tabelas/colunas/defaults, constraints, índices, RLS/policies, grants, funções/ACL, views e triggers. Históricos têm versões heterogêneas e duplicadas: ausência de nome não prova ausência de schema. Não executar db push em lote.
- Revisar consumidores e classificar diferenças: necessárias ao release, equivalentes, específicas do ambiente ou legadas/experimentais. Não clonar bancos nem copiar fixtures, usuários, pagamentos, IDs, sequências, permissões amplas ou segredos.
- Para conteúdo funcional como glossário, produzir diff por chave estável (slug) e campo. Promover somente conteúdo revisado da versão testada, preservando IDs/referências de produção. Contagem igual não prova paridade.
- Validar SQL necessário primeiro no TESTE. Usar as fixtures sintéticas com rollback e verificações de catálogo indicadas no guia DEV-253; o script de fixtures nunca roda em produção. Conferir advisors antes/depois. Registrar equivalência quando o objeto já estiver correto.
- Preparar plano concreto com SQL/diff, dependências, verificação e recuperação. Havendo migration ou mudança de conteúdo em produção, pedir ao Infra backup adequado e aguardar confirmação identificável. Uma tabela antiga de backup não comprova recuperação do banco.
- Identificar tag/SHA do último deploy bem-sucedido pelo Actions e, quando disponível, confirmar o release servido. `git describe --tags --abbrev=0 origin/main` localiza tag alcançável, mas não comprova a versão em produção. Registrar o alvo de recuperação.

## 3. Merge

Se necessário, fazer squash-merge somente com OK explícito para o PR. Se já mergeado, apenas conferir. Atualizar origin/main, fixar novamente o SHA e validar qualquer novo candidato. Não publicar arquivos locais não commitados.

## 4. Migrations em produção

Exigir OK explícito específico, separado do simples merge/tag. Execução sob responsabilidade do Dev/Infra; o Antigravity não aplica migrations em produção. Registrar executor e recibo. Não ampliar autorização existente para SQL destrutivo ou conteúdo não revisado.

Promover somente SQL validado no TESTE e coberto pelo backup confirmado, antes da tag quando o app depender dele. Conferir catálogo, privilégios efetivos e advisors em produção após aplicar, sem fixtures reais. Erros de segurança ou diferenças funcionais necessárias pendentes bloqueiam o release. Justificar avisos informativos; não criar policies públicas para silenciar advisors. Não reescrever o histórico só para fazê-lo parecer idêntico.

## 5. Tag semver

Escolher versão disponível pelas tags remotas atualizadas e conteúdo: patch para fix, minor para feature, major para quebra de compatibilidade. Registrar versão e SHA antes de publicar. Conferir que origin/main continua no candidato validado e que a tag ainda não existe.

```bash
git tag vX.Y.Z <SHA_VALIDADO>
git push origin vX.Y.Z
```

Substituir marcadores por valores conferidos. Enviar somente essa tag, sem push de todas as tags, alteração de tags existentes ou force-push. Criar GitHub Release editorial apenas se solicitado.

## 6. GitHub Actions

Localizar o run de `deploy.yml` correspondente à tag e SHA. Registrar URL e acompanhar até concluir usando o conector GitHub ou `gh run list/view/watch` quando faltar capacidade no conector. Não confundir CI de PR com deploy. Durante esperas longas, consultar em intervalos limitados e informar mudanças relevantes.

Se falhar, ler job/step e resolver a causa antes de repetir. Não criar tags sucessivas para tentar novamente. Encaminhar falha de VPS ao Infra.

## 7. Smoke test

Após Actions verde, verificar HTTP somente leitura seguindo redirects e registrando o status final (esperado 200): `/`, `/analise-gratuita` e `/nome-social` em `https://www.nomemagnetico.com.br`. Não fazer login, criar análise, cobrar ou enviar mensagens reais como smoke.

Observar erros novos do release no Sentry por 15 minutos, com consultas limitadas e atualizações relevantes. Se não houver acesso ao Sentry, informar essa limitação e solicitar observação pelo Infra, sem inventar validação. Actions verde sozinho não comprova saúde do produto.

## 8. Rollback

Se o smoke falhar, registrar impacto e acionar recuperação. Para regressão de código, preparar revert dos commits do release numa branch/PR e nova tag patch após revisão/autorização; não reescrever main/tags nem reverter merges não relacionados.

Se houve migration, pedir ao Infra recuperação compatível: avaliar rollback de schema ou restauração de backup sem descartar gravações legítimas posteriores. Nunca restaurar backup automaticamente ou recriar permissões inseguras. Se não houver compatibilidade com a versão anterior, conter o fluxo afetado com o Infra antes de voltar código.

## 9. Registro

Registrar na issue de release SHA/tag, PRs, diferenças de banco/decisões, backup confirmado, recibos, validações, URL/conclusão do run, smoke, Sentry e rollback. Comentar no Linear faz parte deste procedimento quando invocado para a release. Mover a issue correspondente para Done somente ao concluir seu escopo; criação da skill não conclui a release. Gravar fato sem segredos no Mem0 se disponível; informar ausência sem inventar persistência.

## Limites

Não ler/usar chaves locais de produção ou o cofre de produção `Studio MLK`. Não acessar diretamente a VPS; pm2/nginx/ambiente/backup são tarefas do Infra. Não imprimir credenciais. Esta skill não concede acesso extra nem substitui autorização humana exigida pelo projeto.
