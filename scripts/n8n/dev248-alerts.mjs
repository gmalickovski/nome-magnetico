// Pure helpers shared by the workflow builder and offline tests. No network access.
const PRODUCTS = new Set(['nome_magnetico', 'nome_social', 'nome_bebe', 'nome_empresa']);
const KINDS = new Set(['payment_without_analysis', 'analysis_error', 'analysis_stalled']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function normalizeIncidents(rows) {
  const unique = new Map();
  for (const row of rows) {
    if (!row || !KINDS.has(row.kind) || !UUID.test(row.entity_id) ||
        !PRODUCTS.has(row.product_type) || !Number.isFinite(Date.parse(row.incident_at))) {
      throw new Error('Invalid operational alert row');
    }
    // An entity/status is alerted once; no contact data or raw failure text is retained.
    const key = row.kind + ':' + row.entity_id.toLowerCase();
    unique.set(key, { alertKey: key, kind: row.kind, entity_id: row.entity_id.toLowerCase(),
      product_type: row.product_type, incident_at: new Date(row.incident_at).toISOString() });
  }
  return [...unique.values()];
}
export function summarizeIncidents(rows) {
  if (!rows.length) return [];
  const safe = normalizeIncidents(rows);
  const counts = Object.fromEntries([...KINDS].map(kind => [kind, safe.filter(r => r.kind === kind).length]));
  const lines = safe.slice(0, 15).map(r => r.kind + ' | ' + r.product_type + ' | ' + r.entity_id);
  return [{ channel: 'C0CBEFW2X6K', text: '*[NM] Alertas operacionais*\n' +
    JSON.stringify(counts) + '\n' + lines.join('\n') +
    (safe.length > 15 ? '\n+' + (safe.length - 15) + ' ocorrências nesta execução; consulte o histórico restrito do n8n.' : ''),
    total: safe.length }];
}
export function prepareFailure(input, handlerId) {
  const workflowId = String(input?.workflow?.id ?? '');
  const executionId = String(input?.execution?.retryOf ?? input?.execution?.id ?? '');
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(workflowId) || workflowId === handlerId ||
      !/^[0-9]{1,30}$/.test(executionId)) return [];
  // Node names and exception messages are untrusted and can contain PII/secrets.
  const node = String(input?.execution?.lastNodeExecuted ?? '');
  const event = node.includes('payment.confirmed') ? 'payment.confirmed' :
    node.includes('user.analysis_complete') || node.includes('Análise Pronta') ? 'user.analysis_complete' : 'workflow.failure';
  const email = input?.email ?? input?.body?.payload?.email;
  const masked = typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? '***@***' : 'indisponível';
  const text = '*[NM] Falha de automação*\nworkflow: ' + workflowId + '\nevento: ' + event +
    '\ne-mail: ' + masked + '\nexecução: ' + executionId;
  return [{ alertKey: workflowId + ':' + executionId, channel: 'C0CBEFW2X6K', text,
    executionId, workflowId, event, maskedEmail: masked }];
}
export function slackSucceeded(response) { return response?.ok === true; }

export function pendingIncidents(rows, confirmed = {}) {
 const pending = normalizeIncidents(rows).filter(row => !Object.hasOwn(confirmed, row.alertKey));
 if (Object.keys(confirmed).length + pending.length > 100000) throw new Error('Alert history capacity reached');
 return pending;
}
export function acknowledgeIncidents(rows, confirmed = {}, at = Date.now()) {
 const next = { ...confirmed };
 for (const row of normalizeIncidents(rows)) next[row.alertKey] = at;
 return next;
}
