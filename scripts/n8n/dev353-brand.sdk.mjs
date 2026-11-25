import { expr, node, trigger, workflow } from '@n8n/workflow-sdk';

const start = trigger({
  type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Execução manual' },
});
const settings = node({
  type: 'n8n-nodes-base.set', version: 3.5,
  config: {
    name: 'Destino TESTE e artefato GitHub',
    parameters: {
      mode: 'raw',
      jsonOutput: JSON.stringify({ testOrigin: 'https://nm-dev353-test.invalid', apply: false, artifact: null }),
    },
  },
});
const sync = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Sincronizar bloco de tokens',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.testOrigin + "/api/internal/paid-operations" }}'),
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ { operation: "brand", apply: $json.apply === true, artifact: $json.artifact } }}'),
      options: { timeout: 30000 },
    },
  },
});

export default workflow('nm-dev353-brand', '[NM] DEV-353 · Tokens do deploy → Notion (TESTE)')
  .add(start).to(settings).to(sync);
