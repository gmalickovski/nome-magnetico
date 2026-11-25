import { expr, node, trigger, workflow } from '@n8n/workflow-sdk';

const start = trigger({
  type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Execução manual' },
});
const settings = node({
  type: 'n8n-nodes-base.set', version: 3.5,
  config: {
    name: 'Destino TESTE e modo',
    parameters: {
      mode: 'raw',
      jsonOutput: JSON.stringify({ testOrigin: 'https://nm-dev353-test.invalid', apply: false }),
    },
  },
});
const sync = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Sincronizar campanhas conciliadas',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.testOrigin + "/api/internal/paid-operations" }}'),
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ { operation: "campaigns", apply: $json.apply === true } }}'),
      options: { timeout: 150000 },
    },
  },
});

export default workflow('nm-dev353-campaigns', '[NM] DEV-353 · Campanhas PostHog → Notion (TESTE)')
  .add(start).to(settings).to(sync);
