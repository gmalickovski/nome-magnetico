import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIncidents, summarizeIncidents, prepareFailure, slackSucceeded } from './dev248-alerts.mjs';
const row = {kind:'analysis_error', entity_id:'11111111-1111-4111-8111-111111111111', product_type:'nome_social', incident_at:'2026-11-08T10:00:00Z'};
test('incident projection strips PII and collapses repeated entity/status', () => {
 const out=normalizeIncidents([ {...row,email:'secret@example.invalid',error_message:'TOKEN'}, row ]);
 assert.equal(out.length,1); assert.doesNotMatch(JSON.stringify(out),/secret|TOKEN|email|error_message/);
 assert.notEqual(normalizeIncidents([{...row,kind:'analysis_stalled'}])[0].alertKey,out[0].alertKey);
});
test('malformed SQL output fails closed, no arbitrary Slack injection', () => {
 for(const patch of [{kind:'<!channel>'},{entity_id:'bad'},{product_type:'@everyone'},{incident_at:'bad'}])
  assert.throws(()=>normalizeIncidents([{...row,...patch}]));
});
test('one bounded Slack message for a large execution and no send for empty input', () => {
 assert.deepEqual(summarizeIncidents([]),[]);
 const rows=Array.from({length:2000},(_,i)=>({...row,entity_id:i.toString(16).padStart(8,'0')+'-1111-4111-8111-111111111111'}));
 const out=summarizeIncidents(rows); assert.equal(out.length,1); assert.equal(out[0].total,2000);
 assert.ok(out[0].text.length<3000); assert.match(out[0].text,/1985 ocorrências/);
});
test('error payload never exposes raw message, node, email, URL or secrets', () => {
 const out=prepareFailure({workflow:{id:'mail'},execution:{id:42,lastNodeExecuted:'payment.confirmed secret',error:{message:'Bearer SECRET private@example.invalid'},url:'https://evil.invalid'},email:'private@example.invalid'},'handler');
 assert.equal(out[0].event,'payment.confirmed'); assert.equal(out[0].maskedEmail,'***@***');
 assert.doesNotMatch(JSON.stringify(out),/SECRET|private|evil|Bearer/);
});
test('self loops and missing execution identity produce no message; retry shares original key', () => {
 assert.deepEqual(prepareFailure({workflow:{id:'handler'},execution:{id:42}},'handler'),[]);
 assert.deepEqual(prepareFailure({workflow:{id:'mail'}},'handler'),[]);
 const original=prepareFailure({workflow:{id:'mail'},execution:{id:42}},'handler');
 const retry=prepareFailure({workflow:{id:'mail'},execution:{id:43,retryOf:42}},'handler');
 assert.equal(original[0].alertKey,retry[0].alertKey);
});
test('Slack HTTP 200 with ok:false must be treated as failed delivery', () => {
 assert.equal(slackSucceeded({ok:false,error:'invalid_auth'}),false);
 assert.equal(slackSucceeded({ok:'true'}),false); assert.equal(slackSucceeded({ok:true}),true);
});

test('failed delivery does not consume incident; acknowledgement suppresses next poll', async () => {
 const {pendingIncidents,acknowledgeIncidents}=await import('./dev248-alerts.mjs');
 const initial={}; const first=pendingIncidents([row],initial);
 assert.equal(first.length,1); assert.equal(pendingIncidents([row],initial).length,1);
 const confirmed=acknowledgeIncidents(first,initial,123);
 assert.deepEqual(initial,{}); assert.equal(pendingIncidents([row],confirmed).length,0);
 assert.equal(confirmed[first[0].alertKey],123);
 assert.throws(()=>pendingIncidents([row],Object.fromEntries(Array.from({length:100000},(_,i)=>['old:'+i,1]))),/capacity/);
});
