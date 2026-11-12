import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHECKLIST_ITEMS,
  countChecklistDone,
  parseChecklistState,
} from './app-dashboard-checklist';

describe('app-dashboard-checklist', () => {
  it('parseChecklistState devolve padrão para JSON inválido', () => {
    assert.equal(parseChecklistState(null).assinatura, false);
    assert.equal(parseChecklistState('{invalid').pdf, false);
  });

  it('countChecklistDone conta itens marcados', () => {
    const state = parseChecklistState(JSON.stringify({ assinatura: true, pdf: true }));
    assert.equal(countChecklistDone(state), 2);
    assert.equal(CHECKLIST_ITEMS.length, 4);
  });
});
