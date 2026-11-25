import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Script } from 'node:vm';
import { buildChargebackPatch } from './dev270-chargeback.mjs';

const activeVersion = '0b8b4482-2ae7-4065-a71e-caed0f6873c5';
const legacyEvents = [
  'payment.confirmed', 'payment.failed', 'subscription.expiring_soon', 'subscription.expired',
  'payment.refunded', 'free_analysis.requested', 'access.lifecycle', 'user.analysis_complete',
  'refund.requested', 'cart.abandoned',
];
const route = {
  name: 'Derivações',
  type: 'n8n-nodes-base.switch',
  parameters: {
    options: {},
    rules: {
      values: legacyEvents.map((event, index) => ({
        conditions: {
          conditions: [{
            id: 'original-' + index,
            leftValue: '={{ $json.body.event }}',
            rightValue: event,
            operator: { type: 'string', operation: 'equals' },
          }],
        },
      })),
    },
  },
};
const paymentSlack = {
  name: 'Slack - Notificar Pagamento (#nome-magnetico)',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  credentials: { httpHeaderAuth: { id: 'fixture', name: 'Slack Bot' } },
  parameters: { url: 'https://slack.com/api/chat.postMessage' },
};
const workflow = {
  id: '6RcWDhG0S3EzFzik',
  active: true,
  activeVersionId: activeVersion,
  versionId: activeVersion,
  nodes: [route, paymentSlack],
  connections: {
    'Derivações': {
      main: legacyEvents.map((event) => [{ node: event, type: 'main', index: 0 }]),
    },
  },
};
const patch = buildChargebackPatch(workflow);
const [prepare, send, confirm] = patch.operations.filter((op) => op.type === 'addNode').map((op) => op.node);
const sample = {
  event: 'payment.chargeback',
  timestamp: '2026-11-22T20:00:00.000Z',
  payload: {
    payment_id: 'pi_fixture270',
    amount: 6590,
    amount_formatted: 'R$ 65,90',
    productType: 'nome_social',
    reason: 'fraudulent',
    status: 'needs_response',
    userId: 'customer-fixture',
    email: 'fixture@example.invalid',
    firstName: 'Cliente de teste',
  },
};

function runCode(node, ...data) {
  const items = data.map((json) => ({ json }));
  const script = new Script('(function () {\n' + node.parameters.jsCode + '\n})()');
  return script.runInNewContext({ $input: { all: () => items } }, { timeout: 1000 });
}

function slackRequest(body) {
  const prepared = runCode(prepare, { body });
  if (prepared.length === 0) return null;
  assert.equal(prepared.length, 1);
  const expression = send.parameters.jsonBody.slice(3, -2).trim();
  return JSON.parse(new Script(expression).runInNewContext({ $json: prepared[0].json }, { timeout: 1000 }));
}

test('appends one exact output and preserves all routes in their original order', () => {
  const before = structuredClone(workflow);
  const [update] = patch.operations.filter((op) => op.type === 'setNodeParameter');
  assert.equal(update.path, 'rules.values');
  assert.deepEqual(update.value.slice(0, -1), route.parameters.rules.values);
  assert.equal(update.value.at(-1).conditions.conditions[0].rightValue, 'payment.chargeback');
  const edges = patch.operations.filter((op) => op.type === 'addConnection');
  assert.deepEqual(edges.map(({ source, target }) => [source, target]), [
    [route.name, prepare.name], [prepare.name, send.name], [send.name, confirm.name],
  ]);
  assert.equal(edges[0].sourceIndex, legacyEvents.length);
  assert.deepEqual(workflow, before);
  assert.equal(patch.operations.length, 7);
});

test('declines a different target, concurrent draft, missing Slack credential and duplicate branch', () => {
  assert.throws(() => buildChargebackPatch({ ...workflow, id: 'other' }), /versão ativa/);
  assert.throws(() => buildChargebackPatch({ ...workflow, versionId: 'draft' }), /versão ativa/);
  assert.throws(() => buildChargebackPatch({ ...workflow, nodes: [route] }), /credencial Slack/);
  assert.throws(() => buildChargebackPatch({ ...workflow, nodes: [...workflow.nodes, send] }), /já|Há uma configuração/);
});

test('sends a compact alert with the existing mention, safe fields and critical channel', () => {
  const request = slackRequest(sample);
  assert.equal(request.channel, 'C0CBEFW2X6K');
  assert.match(request.text, /^<@U0CBPKPB76F> 🚨 \*\[NM\] Disputa de pagamento aberta \(chargeback\)\*/);
  assert.match(request.text, /Nome Social.*R\$\s65,90/);
  assert.match(request.text, /Suspeita de fraude.*Aguardando resposta/);
  assert.match(request.text, /pi_fixture270/);
  assert.doesNotMatch(request.text, /fixture@example|customer-fixture|Cliente de teste/);
  assert.equal(request.unfurl_links, false);
  assert.equal(request.unfurl_media, false);
  assert.deepEqual(send.credentials, paymentSlack.credentials);
  assert.equal(send.parameters.options.timeout, 15000);
  assert.notEqual(send.retryOnFail, true);
});

test('ignores existing payment events, cart and Pix events, closed disputes and tests', () => {
  for (const event of [...legacyEvents, 'checkout.session.created', 'payment.pix_created', 'payment.chargeback.closed']) {
    assert.equal(slackRequest({ ...sample, event }), null, event);
  }
  for (const overrides of [
    { livemode: false }, { skipAdminSlack: true }, { payment_provider: 'test' },
    ...['won', 'lost', 'warning_closed', 'prevented'].map((status) => ({ status })),
  ]) {
    assert.equal(slackRequest({ ...sample, payload: { ...sample.payload, ...overrides } }), null);
  }
});

test('keeps a useful alert when optional fields are missing or contain arbitrary text', () => {
  const request = slackRequest({
    ...sample,
    payload: {
      payment_id: 'ch_fixture270',
      amount: '1000',
      amount_formatted: '<!channel>',
      productType: 'constructor',
      reason: '<!here>',
      status: 'private@example.invalid',
    },
  });
  assert.match(request.text, /Nome Magnético.*Não informado/);
  assert.match(request.text, /ch_fixture270/);
  assert.doesNotMatch(request.text, /<!|private@example|constructor/);
  assert.match(slackRequest({ ...sample, payload: {} }).text, /Disputa de pagamento aberta/);
  assert.match(slackRequest({ ...sample, payload: { amount: 0 } }).text, /R\$\s0,00/);
  assert.equal(slackRequest({ ...sample, payload: null }), null);
});

test('marks delivery only after Slack acknowledges the expected channel', () => {
  const ok = runCode(confirm, { ok: true, channel: 'C0CBEFW2X6K', text: 'discarded' });
  assert.equal(ok[0].json.delivered, true);
  assert.deepEqual(Object.keys(ok[0].json), ['delivered']);
  assert.throws(() => runCode(confirm, { ok: false, error: 'not_in_channel' }), /Slack não confirmou/);
  assert.throws(() => runCode(confirm, { ok: true, channel: 'COTHER' }), /Slack não confirmou/);
});
