import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleSelection, isSelected } from './selection.js';

test('DEV-235 · Lógica pura de seleção alternável', async (t) => {
  await t.test('seleciona um card quando nenhum está selecionado', () => {
    const selected = toggleSelection(null, 'candidato-1');
    assert.equal(selected, 'candidato-1');
    assert.equal(isSelected(selected, 'candidato-1'), true);
    assert.equal(isSelected(selected, 'candidato-2'), false);
  });

  await t.test('troca a seleção ao clicar em outro card', () => {
    let selected = toggleSelection(null, 'candidato-1');
    assert.equal(selected, 'candidato-1');

    selected = toggleSelection(selected, 'candidato-2');
    assert.equal(selected, 'candidato-2');
    assert.equal(isSelected(selected, 'candidato-1'), false);
    assert.equal(isSelected(selected, 'candidato-2'), true);
  });

  await t.test('desmarca (volta a null) ao clicar no card já selecionado', () => {
    let selected: string | null = 'candidato-1';
    selected = toggleSelection(selected, 'candidato-1');
    assert.equal(selected, null);
    assert.equal(isSelected(selected, 'candidato-1'), false);
  });
});
