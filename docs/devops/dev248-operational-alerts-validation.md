# DEV-248 — alertas operacionais

Estado: rascunhos validados, ainda inativos e não vinculados. Nenhum Slack ou e-mail real enviado nos testes.

## Entrega
- Monitor: https://n8n.studiomlk.com.br/workflow/sI7o0WxcRvf5SGOb
- Tratador dedicado: https://n8n.studiomlk.com.br/workflow/LEYGmnPKWJHvS8rd
- Snapshots e SDKs reproduzíveis em docs/snippets/dev248-*; gerador: node scripts/n8n/build-dev248-sdk.mjs.
- Cron de 30 minutos; consulta somente a view privada nm_ops_alerts.incidents.
- Uma mensagem Slack resume o lote, com até 15 detalhes e contagem das demais ocorrências; sem retries HTTP.
- O IF payment.confirmed do workflow 6RcWDhG0S3EzFzik já exclui payment_provider=test/skipAdminSlack=true sem impedir o e-mail. Não foi duplicado.

## Banco e credenciais
Migration local 20261109025428_dev248_scoped_alert_reader.sql aplicada primeiro em TESTE (kbqrkkltjvmxomrgsrbc), validada e depois em produção (bhxneaeuhybtucmbmpvg).
Históricos remotos: TESTE 20261109025459; produção 20261109025638. Não executar db push para reconciliar timestamps.
Hash pg_get_viewdef nos dois: 03eef156ba9e24df22a814d0da771625.
A role nm_alerts_reader não possui BYPASSRLS, privilégios administrativos ou grants de leitura/escrita nas tabelas base.
Apenas USAGE no schema privado e SELECT na view; default_transaction_read_only=on, statement_timeout=15s, idle_in_transaction_session_timeout=10s e limite de duas conexões.
A view tem security_barrier=true e avaliação intencional como owner postgres: permite a projeção operacional entre contas sem dar à conexão acesso direto aos registros. Schema sem grants para PUBLIC, anon, authenticated e service_role, fora dos schemas REST expostos.
Saída: kind, entity_id, product_type e incident_at. Não contém e-mail, nome, texto de análise, user_id ou mensagem bruta.
Credenciais distintas geradas no 1Password:
- Studio MLK - TESTE / NM-TESTE-Alertas Postgres Leitura; n8n NmAlertsTest24801.
- Studio MLK / NM-OPS-Alertas Postgres Leitura; n8n NmAlertsProd24801.
Senhas nunca impressas, versionadas ou gravadas localmente. Importação n8n usa arquivo temporário privado removido ao terminar. Provisionamento reproduzível: scripts/n8n/provision-dev248-reader.ps1 (usar somente com autorização de banco/cofre).

## Regras e entrega
Pagamento: valor positivo, provider diferente de test, acesso ainda ativo, sem estorno, starts_at anterior a 24h, perfil não teste e nenhuma análise posterior do mesmo usuário/produto.
Qualquer status de análise satisfaz a existência; erro tem alerta separado.
Análise com erro: updated_at nos últimos 60 minutos (sobreposição entre polls); processing: mais de 30 minutos sem atualização, inclusive registros antigos.
Monitor guarda histórico confirmado somente após Slack ok:true e sucesso da execução. Falha antes disso permite nova tentativa no próximo agendamento.
Histórico limitado a 100000 chaves: interrompe antes de enviar se lotar, exige revisão operacional. Não remove chaves silenciosamente.
Timeout de execução de 60s é inferior ao intervalo de 30min. Não executar o monitor manualmente com serviços reais: execuções simultâneas e resposta Slack ambígua não garantem entrega exatamente uma vez.
Tratador sanitiza antes de deduplicar por workflow+execução original (retryOf). Ignora falha do próprio handler. Mensagens brutas, stack, URL e nome livre do nó não entram no alerta.
O Error Trigger normalmente não fornece o destinatário: mostra indisponível; se existir no payload explícito, usa ***@***. Evento inferido apenas de nomes conhecidos; demais casos workflow.failure.
Tratador limita a uma tentativa Slack e um fallback SES, usando remetente/destinatário/credencial já existentes. Fallback apenas texto sanitizado. Erros HTTP e Slack HTTP200/ok:false seguem para fallback. Sem retries, sem errorWorkflow apontando para si.
Dedupe nativo do tratador ocorre antes do envio e guarda até 100000 chaves. Uma falha de ambos os canais pode consumir a chave: investigar a execução e recuperar manualmente com dados sanitizados; não usar histórico como comprovante de entrega.

## Evidências
- Filtros SQL testados com tabelas temporárias e ROLLBACK: testes positivos/negativos de janela, produto, perfil teste, provider teste, estorno, valor zero, expiração, análise posterior, erro e processamento parado.
- EXPLAIN compilou contra schema real TESTE e usa o índice analyses_product_user_idx para a exclusão.
- Leitura da view e negação de leitura direta em profiles/analyses e DELETE em subscriptions comprovadas sob SET ROLE, com grants temporários de SET revertidos.
- Login real via pooler, TLS com CA/hostname verificados, settings readonly/timeout e negações comprovados tanto em TESTE quanto em produção, sem leitura de dados de contato.
- Advisors nos dois bancos: nenhum novo problema; apenas aviso anterior de proteção contra senhas vazadas.
- Dez testes offline executam também o código dos snapshots reais. Nenhum serviço externo é chamado.
- SDKs: 7 nós no monitor e 6 no tratador, ambos validados sem warnings.
- Astro check: 0 erros e 0 warnings; build, lint:polling e 18 testes guard-shell passaram.
- Suíte completa final: 520 testes passaram, zero falhas (inclui os 10 testes novos). Harness Poppler verificado por SHA256 da release; pypdf 5.1.0 instalado somente em diretório temporário.

## CA preparada, ainda não aplicada
A credencial Postgres nativa não oferece campo de CA. O teste real passou com NODE_EXTRA_CA_CERTS apontando para a CA oficial Supabase.
CA pública no volume compartilhado por main e workers: /home/node/.n8n/certs/dev248-supabase-ca.crt.
Fingerprint SHA256: 807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA.
Origem: https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt
A verificação TLS deve permanecer habilitada; não usar allowUnauthorizedCerts para contornar falha.
Override preparado em /workspace/n8n/backups/dev248-before-20261109/dev248-ca.override.yml e validado com docker compose config --quiet. Cópia revisável em docs/snippets/dev248-ca.override.yml.
Aplicá-lo exige recriar main/workers do n8n. Nenhum restart/recreate foi executado.

## Publicação e rollback — requer OK explícito do Guilherme
A issue exige: “Nenhuma ativação em produção sem OK do Guilherme via Chefe.”
1. Backup privado dos workflows envolvidos e configurações do Compose, verificar fila/executando e planejar janela para recriar main/workers com o override de CA.
2. Validar credencial pelo nó nativo e execução simulada, sem enviar mensagens reais. Não usar o monitor real como teste manual.
3. Publicar primeiro LEYGmnPKWJHvS8rd; depois configurar errorWorkflow desse ID em 6RcWDhG0S3EzFzik e no novo monitor.
4. Desativar DngkkqSghBRu2izU antes de publicar sI7o0WxcRvf5SGOb. Manter HjLASj3NWhl9FIf6 inativo. Não deixar dois monitores equivalentes agendados.
5. Registrar versões, acompanhar primeira execução agendada e retorno Slack. Publicação habilita notificações operacionais reais.
Backups 0600 em /workspace/n8n/backups/dev248-before-20261109: payment.json, analysis.json, errors.json e mail.json.
Rollback: desativar novo monitor; restaurar errorWorkflow=ZGohfAOtlnR10CV3 no e-mail e configuração/versão anterior de monitor; restaurar Compose anterior e recriar serviços se necessário. Manter backups e não recriar credenciais amplas.
Banco: em rollback operacional, ALTER ROLE nm_alerts_reader NOLOGIN basta para interromper novas conexões; não apagar view/role automaticamente. Migration aditiva não modifica registros de usuários.
Nenhum deploy da aplicação, tag ou alteração de Stripe/auth/IA foi feito nesta tarefa.
