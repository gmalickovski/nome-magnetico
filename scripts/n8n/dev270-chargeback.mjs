import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const workflowId = '6RcWDhG0S3EzFzik';
const event = 'payment.chargeback';
const routeName = 'Derivações';
const prepareName = 'payment.chargeback: preparar alerta';
const slackName = 'Slack - Notificar Chargeback (#alertas-criticos)';
const confirmName = 'payment.chargeback: validar entrega';
const channel = 'C0CBEFW2X6K';
const mention = '<@U0CBPKPB76F>';

function formatAlert(body) {
  const payload = body?.payload;
  if (body?.event !== 'payment.chargeback' || !payload || typeof payload !== 'object'
      || Array.isArray(payload) || payload.skipAdminSlack === true
      || payload.payment_provider === 'test' || payload.livemode === false) {
    return null;
  }

  const closed = ['won', 'lost', 'warning_closed', 'prevented'];
  if (closed.includes(payload.status)) return null;

  const products = {
    nome_social: 'Nome Social',
    nome_bebe: 'Nome de Bebê',
    nome_empresa: 'Nome Empresarial',
  };
  const reasons = {
    bank_cannot_process: 'Banco não conseguiu processar',
    check_returned: 'Cheque devolvido',
    credit_not_processed: 'Crédito não processado',
    customer_initiated: 'Iniciada pelo cliente',
    debit_not_authorized: 'Débito não autorizado',
    duplicate: 'Cobrança duplicada',
    fraudulent: 'Suspeita de fraude',
    general: 'Motivo geral',
    incorrect_account_details: 'Dados bancários incorretos',
    insufficient_funds: 'Saldo insuficiente',
    noncompliant: 'Não conformidade',
    product_not_received: 'Produto não recebido',
    product_unacceptable: 'Produto insatisfatório',
    subscription_canceled: 'Assinatura cancelada',
    unrecognized: 'Cobrança não reconhecida',
  };
  const statuses = {
    appeal_needs_response: 'Recurso aguardando resposta',
    appeal_under_review: 'Recurso em análise',
    needs_response: 'Aguardando resposta',
    under_review: 'Em análise',
    warning_needs_response: 'Alerta preliminar aguardando resposta',
    warning_under_review: 'Alerta preliminar em análise',
  };
  const label = (labels, value, fallback) =>
    typeof value === 'string' && Object.hasOwn(labels, value) ? labels[value] : fallback;
  const product = label(products, payload.productType, 'Nome Magnético');
  const reason = label(reasons, payload.reason, 'Não informado');
  const status = label(statuses, payload.status, 'Não informado');
  const amount = Number.isSafeInteger(payload.amount) && payload.amount >= 0
    ? (payload.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'Não informado';
  const id = typeof payload.payment_id === 'string' && /^(?:pi|ch)_[A-Za-z0-9]{1,120}$/.test(payload.payment_id)
    ? payload.payment_id
    : 'Não informado';

  return '🚨 *[NM] Disputa de pagamento aberta (chargeback)*'
    + '\n*Produto:* ' + product + ' · *Valor:* ' + amount
    + '\n*Motivo:* ' + reason + ' · *Status:* ' + status
    + '\n*Pagamento:* ' + id;
}

export function buildChargebackPatch(workflow) {
  if (workflow?.id !== workflowId || !workflow.active || !workflow.activeVersionId
      || workflow.activeVersionId !== workflow.versionId) {
    throw new Error('Use a versão ativa e sem rascunhos do workflow de eventos do Nome Magnético.');
  }

  const route = workflow.nodes.find((node) => node.name === routeName);
  const paymentSlack = workflow.nodes.find((node) => node.name === 'Slack - Notificar Pagamento (#nome-magnetico)');
  const credential = paymentSlack?.credentials?.httpHeaderAuth;
  const rules = route?.parameters?.rules?.values;
  const outputs = workflow.connections?.[routeName]?.main;
  const template = rules?.find((rule) => rule.conditions?.conditions?.length === 1
    && rule.conditions.conditions[0].rightValue === 'payment.confirmed'
    && rule.conditions.conditions[0].leftValue === '={{ $json.body.event }}'
    && rule.conditions.conditions[0].operator?.type === 'string'
    && rule.conditions.conditions[0].operator?.operation === 'equals');

  if (route?.type !== 'n8n-nodes-base.switch' || !template || !Array.isArray(outputs)
      || rules.length !== outputs.length || Object.keys(route.parameters.options ?? {}).length > 0
      || paymentSlack?.parameters?.url !== 'https://slack.com/api/chat.postMessage'
      || !credential?.id || !credential.name) {
    throw new Error('Derivações ou credencial Slack diferentes da configuração validada. Revise a versão ativa.');
  }
  if (rules.some((rule) => rule.conditions?.conditions?.some((condition) => condition.rightValue === event))
      || workflow.nodes.some((node) => [prepareName, slackName, confirmName].includes(node.name))) {
    throw new Error('Há uma configuração de chargeback neste workflow. Revise a versão antes de aplicar.');
  }

  const rule = structuredClone(template);
  Object.assign(rule.conditions.conditions[0], {
    id: '0ee661fe-daf2-48e1-b7f8-27f5ad3bd4a3',
    rightValue: event,
  });

  const nodes = [
    {
      name: prepareName,
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [-632, 3800],
      parameters: {
        jsCode: formatAlert.toString() + '\n\nreturn $input.all().flatMap((item, index) => {\n'
          + '  const text = formatAlert(item.json.body);\n'
          + '  return text ? [{ json: { text }, pairedItem: { item: index } }] : [];\n'
          + '});',
      },
    },
    {
      name: slackName,
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: paymentSlack.typeVersion,
      position: [-392, 3800],
      credentials: { httpHeaderAuth: { id: credential.id, name: credential.name } },
      parameters: {
        method: 'POST',
        url: 'https://slack.com/api/chat.postMessage',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify({ channel: ' + JSON.stringify(channel)
          + ', text: ' + JSON.stringify(mention + ' ') + ' + $json.text, unfurl_links: false, unfurl_media: false }) }}',
        options: { timeout: 15000 },
      },
    },
    {
      name: confirmName,
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [-152, 3800],
      parameters: {
        jsCode: 'return $input.all().map((item, index) => {\n'
          + '  if (item.json.ok !== true || item.json.channel !== ' + JSON.stringify(channel) + ') {\n'
          + "    throw new Error('O Slack não confirmou a entrega do alerta de chargeback.');\n"
          + '  }\n'
          + '  return { json: { delivered: true }, pairedItem: { item: index } };\n'
          + '});',
      },
    },
  ];

  return {
    workflowId,
    versionName: 'DEV-270 · Alerta de chargeback',
    versionDescription: 'Rota payment.chargeback para #alertas-criticos com validação de entrega.',
    operations: [
      ...nodes.map((node) => ({ type: 'addNode', node })),
      { type: 'setNodeParameter', nodeName: routeName, path: 'rules.values', value: [...rules, rule] },
      { type: 'addConnection', source: routeName, sourceIndex: rules.length, target: prepareName },
      { type: 'addConnection', source: prepareName, target: slackName },
      { type: 'addConnection', source: slackName, target: confirmName },
    ],
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = JSON.parse(readFileSync(0, 'utf8').replace(/^\uFEFF/, ''));
  const data = input.structuredContent ?? input;
  process.stdout.write(JSON.stringify(buildChargebackPatch(data.workflow ?? data), null, 2) + '\n');
}
