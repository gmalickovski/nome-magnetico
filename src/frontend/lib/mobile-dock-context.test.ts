import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveMobileDockContext,
  shouldRenderActionMobileDock,
  shouldRenderGlobalMobileNavDock,
} from './mobile-dock-context.ts';

describe('mobile-dock-context', () => {
  it('chat harmonização: só dock de ações (sem nav global)', () => {
    for (const path of ['/app/analise/nome-social', '/app/analise/nome-social/']) {
      assert.equal(resolveMobileDockContext(path), 'action', path);
      assert.equal(shouldRenderGlobalMobileNavDock(path), false, path);
      assert.equal(shouldRenderActionMobileDock(path), true, path);
    }
  });

  it('resultado: só dock de ações', () => {
    assert.equal(resolveMobileDockContext('/app/resultado/abc'), 'action');
    assert.equal(shouldRenderGlobalMobileNavDock('/app/resultado/abc'), false);
  });

  it('demais /app: só nav global', () => {
    assert.equal(resolveMobileDockContext('/app'), 'app_nav');
    assert.equal(resolveMobileDockContext('/app/analises'), 'app_nav');
    assert.equal(shouldRenderGlobalMobileNavDock('/app/suporte'), true);
    assert.equal(shouldRenderActionMobileDock('/app/suporte'), false);
  });

  it('mutuamente exclusivo em qualquer rota /app', () => {
    const routes = [
      '/app',
      '/app/analises',
      '/app/suporte',
      '/app/analise/nome-social',
      '/app/resultado/x',
      '/app/admin-analise',
    ];
    for (const route of routes) {
      const global = shouldRenderGlobalMobileNavDock(route);
      const action = shouldRenderActionMobileDock(route);
      assert.equal(
        global !== action,
        true,
        `rota ${route} deve ter exatamente um tipo de dock (global=${global}, action=${action})`
      );
    }
  });
});
