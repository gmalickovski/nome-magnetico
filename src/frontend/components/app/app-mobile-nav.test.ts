import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAppNavDockItems, resolveAppNavActive } from './app-mobile-nav.ts';

describe('app-mobile-nav', () => {
  it('dashboard ativo só em /app raiz', () => {
    const d = resolveAppNavActive('/app');
    assert.equal(d.dashboard, true);
    assert.equal(d.analises, false);

    const chat = resolveAppNavActive('/app/analise/nome-social');
    assert.equal(chat.dashboard, false);
  });

  it('analises inclui resultado', () => {
    const r = resolveAppNavActive('/app/resultado/abc');
    assert.equal(r.analises, true);
    assert.equal(r.dashboard, false);
  });

  it('ordem e itens espelham sidebar desktop', () => {
    const items = buildAppNavDockItems({
      pathname: '/app/suporte',
      showAnalisesNav: true,
      isAdmin: true,
    });
    assert.deepEqual(
      items.map((i) => i.id),
      ['dashboard', 'analises', 'suporte', 'blog', 'analista']
    );
    assert.equal(items.find((i) => i.id === 'suporte')?.active, true);
  });

  it('minhas análises bloqueada sem acesso', () => {
    const items = buildAppNavDockItems({
      pathname: '/app',
      showAnalisesNav: false,
      isAdmin: false,
    });
    const analises = items.find((i) => i.id === 'analises');
    assert.equal(analises?.disabled, true);
    assert.equal(analises?.active, false);
  });
});
