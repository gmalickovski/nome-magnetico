import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAppNavDockItems, resolveAppNavActive } from './app-mobile-nav.ts';

describe('app-mobile-nav', () => {
  it('início ativo só em /app raiz', () => {
    const d = resolveAppNavActive('/app');
    assert.equal(d.inicio, true);
    assert.equal(d.analises, false);

    const chat = resolveAppNavActive('/app/analise/nome-social');
    assert.equal(chat.inicio, false);
  });

  it('analises inclui resultado', () => {
    const r = resolveAppNavActive('/app/resultado/abc');
    assert.equal(r.analises, true);
    assert.equal(r.inicio, false);
  });

  it('ordem e itens: Início, Minhas análises, Glossário, Suporte', () => {
    const items = buildAppNavDockItems({
      pathname: '/app/suporte',
      showAnalisesNav: true,
    });
    assert.deepEqual(
      items.map((i) => i.id),
      ['inicio', 'analises', 'glossario', 'suporte']
    );
    assert.equal(items.find((i) => i.id === 'suporte')?.active, true);
    assert.equal(items.some((i) => i.id === 'analista' as string), false);
    assert.equal(items.some((i) => i.id === 'blog' as string), false);
  });

  it('minhas análises bloqueada sem acesso', () => {
    const items = buildAppNavDockItems({
      pathname: '/app',
      showAnalisesNav: false,
    });
    const analises = items.find((i) => i.id === 'analises');
    assert.equal(analises?.disabled, true);
    assert.equal(analises?.active, false);
  });
});
