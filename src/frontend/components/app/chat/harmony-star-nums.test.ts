import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildBirthNamePanel } from '../../../../backend/numerology/birth-name-panel.ts';
import { harmonyStarNumsFromPanel } from '../../landing/ProductResultFrame.js';

describe('harmonyStarNumsFromPanel', () => {
  it('Guilherme Malickovski Correa · 14/02/1990 — Missão cabalística, não potencial 95', () => {
    const panel = buildBirthNamePanel('Guilherme Malickovski Correa', '14/02/1990');
    assert.equal(panel.potencial, 95);
    assert.equal(panel.missao, 5);

    const nums = harmonyStarNumsFromPanel({
      destino: panel.destino,
      expressao: panel.expressao,
      motivacao: panel.motivacao,
      missao: panel.missao,
      impressao: panel.impressao,
    });

    assert.deepEqual(nums, [8, 6, 4, 5, 2]);
    assert.notEqual(nums[3], panel.potencial);
  });
});
