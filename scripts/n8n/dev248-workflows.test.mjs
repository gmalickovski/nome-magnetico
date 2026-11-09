import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const load=stem=>JSON.parse(readFileSync(new URL('../../docs/snippets/'+stem+'.workflow.json',import.meta.url),'utf8'));
const monitor=load('dev248-monitor'), handler=load('dev248-error-handler');
const row={kind:'analysis_error',entity_id:'11111111-1111-4111-8111-111111111111',product_type:'nome_social',incident_at:'2026-11-09T10:00:00Z'};
function run(w,name,items,state={},upstream={}){
 const n=w.nodes.find(n=>n.name===name);
 const context={$input:{all:()=>items.map(json=>({json})),first:()=>({json:items[0]})},
  $getWorkflowStaticData:()=>state,$workflow:{id:w.id},
  $:name=>({all:()=>upstream[name].map(json=>({json}))})};
 return new Script('(function(){'+n.parameters.jsCode+'})()').runInNewContext(context,{timeout:2000});
}
test('saved monitor graph confirms history only after Slack success',()=>{
 const state={};
 const pending=run(monitor,'Filtrar não confirmados',[row],state).map(i=>i.json);
 const summary=run(monitor,'Resumo limitado',pending,state);
 assert.equal(summary.length,1); assert.match(summary[0].json.text,/Alertas operacionais/);
 assert.throws(()=>run(monitor,'Validar entrega',[{ok:false}],state,{'Filtrar não confirmados':pending}));
 assert.equal(Object.keys(state).length,0);
 run(monitor,'Validar entrega',[{ok:true}],state,{'Filtrar não confirmados':pending});
 assert.equal(run(monitor,'Filtrar não confirmados',[row],state).length,0);
});
test('saved handler strips raw trigger error and prevents self recursion',()=>{
 const payload={workflow:{id:'mail'},execution:{id:42,lastNodeExecuted:'user.analysis_complete',error:{message:'SECRET user@example.invalid'}}};
 const out=run(handler,'Sanitizar falha',[payload]);
 assert.equal(out.length,1); assert.match(out[0].json.text,/user.analysis_complete/);
 assert.doesNotMatch(JSON.stringify(out),/SECRET|user@example/);
 assert.equal(run(handler,'Sanitizar falha',[{...payload,workflow:{id:handler.id}}]).length,0);
});
test('saved graphs use restricted SQL, no Slack retries and finite timeouts',()=>{
 const db=monitor.nodes.find(n=>n.type==='n8n-nodes-base.postgres');
 assert.equal(db.credentials.postgres.id,'NmAlertsProd24801');
 assert.match(db.parameters.query,/FROM nm_ops_alerts.incidents/);
 for(const w of [monitor,handler]){
  const send=w.nodes.find(n=>n.type==='n8n-nodes-base.httpRequest');
  assert.notEqual(send.retryOnFail,true); assert.equal(send.executeOnce,true);
  assert.equal(send.parameters.options.timeout,15000);
  assert.ok(w.settings.executionTimeout<=60);
 }
});
