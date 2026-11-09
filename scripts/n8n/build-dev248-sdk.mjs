import { readFileSync, writeFileSync } from 'node:fs';
const literal=value=>{
 if(typeof value==='string'&&value.startsWith('='))return 'expr('+JSON.stringify(value.slice(1))+')';
 if(Array.isArray(value))return '['+value.map(literal).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.entries(value).map(([k,v])=>JSON.stringify(k)+':'+literal(v)).join(',')+'}';
 return JSON.stringify(value);
};
for(const stem of ['dev248-monitor','dev248-error-handler']){
 const root=new URL('../../docs/snippets/',import.meta.url);
 const w=JSON.parse(readFileSync(new URL(stem+'.workflow.json',root),'utf8'));
 const ids=new Map(w.nodes.map((n,i)=>[n.name,'n'+i]));
 let sdk="import {workflow,node,trigger,expr} from '@n8n/workflow-sdk';\n";
 for(const n of w.nodes){
  const config={name:n.name,parameters:n.parameters,...(n.onError?{onError:n.onError}:{}),...(n.credentials?{credentials:n.credentials}:{}),...(n.retryOnFail!==undefined?{retryOnFail:n.retryOnFail}:{}),...(n.executeOnce?{executeOnce:true}:{})};
  const sample={kind:'analysis_error',entity_id:'11111111-1111-4111-8111-111111111111',product_type:'nome_social',incident_at:'2026-11-09T10:00:00Z',alertKey:'analysis_error:11111111-1111-4111-8111-111111111111',channel:'C0CBEFW2X6K',text:'Synthetic',ok:true,workflow:{id:'mail'},execution:{id:42,lastNodeExecuted:'payment.confirmed'}};
  sdk+='const '+ids.get(n.name)+'='+(/Trigger$/.test(n.type)?'trigger':'node')+'({type:'+JSON.stringify(n.type)+',version:'+n.typeVersion+',config:'+literal(config)+',output:[{json:'+JSON.stringify(sample)+'}]});\n';
 }
 let head=w.nodes.find(n=>/Trigger$/.test(n.type)).name;
 const chain=[head];
 while(w.connections[head]?.main?.[0]?.length){
  head=w.connections[head].main[0][0].node;
  if(chain.includes(head))throw Error('Unexpected cycle');
  chain.push(head);
 }
 sdk+='export default workflow('+JSON.stringify(w.id)+','+JSON.stringify(stem)+').add('+ids.get(chain[0])+')'+chain.slice(1).map(n=>'.to('+ids.get(n)+')').join('')+';\n';
 for(const [source, outputs] of Object.entries(w.connections)){for(const target of outputs.main?.[1]??[]){sdk=sdk.trimEnd().replace(/;$/, '')+'.add('+ids.get(source)+'.onError('+ids.get(target.node)+'));';}}
 writeFileSync(new URL(stem+'.sdk.txt',root),sdk);
}
