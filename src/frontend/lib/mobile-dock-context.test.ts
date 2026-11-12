import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {resolveMobileDockContext, shouldRenderActionMobileDock, shouldRenderGlobalMobileNavDock} from './mobile-dock-context.ts';

describe('mobile-dock-context',()=>{
 it('mantém navegação global em todas as rotas da área do usuário',()=>{
  for(const route of ['/app','/app/analises','/app/suporte','/app/analise/nome-social','/app/analise/nome-social/','/app/resultado/x','/app/admin-analise']){
   assert.equal(shouldRenderGlobalMobileNavDock(route),true,route);
  }
  assert.equal(shouldRenderGlobalMobileNavDock('/blog'),false);
  assert.equal(shouldRenderGlobalMobileNavDock('/application'),false);
 });
 it('adiciona ações apenas nas rotas do chat e resultado',()=>{
  for(const route of ['/app/analise/nome-social','/app/resultado/x']){
   assert.equal(resolveMobileDockContext(route),'action');
   assert.equal(shouldRenderActionMobileDock(route),true);
  }
  for(const route of ['/app','/app/analises','/app/suporte','/app/admin-analise']){
   assert.equal(resolveMobileDockContext(route),'app_nav');
   assert.equal(shouldRenderActionMobileDock(route),false);
  }
 });
});
