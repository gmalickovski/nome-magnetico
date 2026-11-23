# DEV-270 · Alerta de chargeback no Slack

O workflow [Eventos de e-mail do Nome Magnético](https://n8n.studiomlk.com.br/workflow/6RcWDhG0S3EzFzik) recebe o envelope de sempre com `event`, `payload` e `timestamp`. A saída de `payment.chargeback` é adicionada ao fim do Switch **Derivações**, preservando a posição das rotas existentes.

O alerta usa o bot dos pagamentos, a menção individual existente e o canal [#alertas-criticos](https://studiomlk.slack.com/archives/C0CBEFW2X6K). Inclui produto, valor em BRL, motivo, status e referência do pagamento. Os rótulos vêm de listas conhecidas. A mensagem omite nome, e-mail e ID de usuário. Disputas encerradas e eventos com `skipAdminSlack: true`, `payment_provider: 'test'` ou `livemode: false` são descartados nesse ramo.

O POST usa timeout de 15 segundos. A entrega só é confirmada quando o Slack retorna `ok: true` para o canal esperado. Falhas seguem para o tratador de erros configurado no workflow. A deduplicação de reentregas de eventos do Stripe cabe ao emissor do app.

## Validação

1. Execute `node --test scripts/n8n/dev270-chargeback.test.mjs scripts/n8n/dev248-{alerts,workflows}.test.mjs` em um shell POSIX. Os testes exercitam os nós gerados e a expressão do Slack com dados sintéticos.
2. Exporte os detalhes da versão ativa pelo MCP em modo leitura. Gere o patch com `node scripts/n8n/dev270-chargeback.mjs < workflow.json`. Mantenha a exportação e o JSON de operações em armazenamento privado. O gerador interrompe se já houver uma rota de chargeback ou se o workflow tiver um rascunho concorrente.
3. Em um workflow de teste isolado, use o envelope sintético com `event: 'payment.chargeback'`, `payment_id: 'pi_fixture270'`, `amount: 6590`, `productType: 'nome_social'`, `reason: 'fraudulent'` e `status: 'needs_response'`. Aponte envio e confirmação para o canal de teste combinado, use uma credencial de teste e retire a menção da cópia. O esperado é uma mensagem com produto, valor, motivo, status e referência. Confira que as variantes de Pix, checkout abandonado, disputa encerrada e compra de teste deixam o ramo sem envio.

## Publicação e rollback

1. Confirme o emissor `payment.chargeback` do app em ambiente de teste e a autorização explícita da DEV-270 para publicar. Faça o backup cifrado e verifique a recuperação conforme o Runbook da Infra. Guarde também o identificador da versão ativa do workflow.
2. Leia novamente o workflow e compare a versão com a exportação usada no gerador antes de aplicar as operações por `update_workflow`. Confira o diff da nova versão, a ordem das saídas, o canal e a credencial reutilizada. Publique a versão validada e monitore a primeira execução legítima.
3. Se houver falha após publicar, restaure e publique a versão anterior do workflow. Confirme que seu webhook está ativo e que o histórico das execuções indica o roteamento esperado. A versão observada na preparação foi `0b8b4482-2ae7-4065-a71e-caed0f6873c5`.

[Objeto de disputa do Stripe](https://docs.stripe.com/api/disputes/object) · [API de mensagens do Slack](https://docs.slack.dev/reference/methods/chat.postMessage/) · [Switch do n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/)
