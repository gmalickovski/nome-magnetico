import { it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSavedAnalysisPanelHref } from './analysis-panel-navigation';

it('liga o card exato, inclusive nascimento sintetizado, ao painel de Minhas Análises', () => {
  for (const id of ['saved-1', 'source-2__birth', 'id with & delimiters']) {
    const url = new URL(buildSavedAnalysisPanelHref(id), 'https://fixture.invalid');
    assert.equal(url.pathname, '/app/analises');
    assert.equal(url.searchParams.get('id'), id);
    assert.equal(url.searchParams.get('painel'), '1');
    assert.equal([...url.searchParams.keys()].length, 2);
  }
});
