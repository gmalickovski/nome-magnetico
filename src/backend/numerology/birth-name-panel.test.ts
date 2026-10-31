import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { avaliarNome } from './score.ts';
import { buildBirthNamePanel, buildClientBirthNamePanel } from './birth-name-panel.ts';

describe('birth-name-panel · score inicial do chat', () => {
  it('Guilherme Malickovski Correa · 14/02/1990 → score_v3 66 (mesmo avaliarNome)', () => {
    const nome = 'Guilherme Malickovski Correa';
    const data = '14/02/1990';
    const oficial = avaliarNome(nome, data, { calcularPotencial: true });
    const panel = buildBirthNamePanel(nome, data);
    const client = buildClientBirthNamePanel(nome, data);

    assert.equal(panel.score, 66);
    assert.equal(panel.score, oficial.score_v3);
    assert.equal(client.score, 66);
    assert.equal(client.nome, nome);
    assert.equal(client.potencial, oficial.potencial);
    assert.equal(panel.missao, 5);
    assert.equal(client.missao, 5);
    assert.equal(panel.destino, 8);
    assert.equal(panel.expressao, 6);
    assert.equal(panel.motivacao, 4);
    assert.equal(panel.impressao, 2);
  });
});
