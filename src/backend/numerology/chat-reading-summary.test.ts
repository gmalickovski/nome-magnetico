import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildChatReadingSummary } from './chat-reading-summary';

describe('buildChatReadingSummary', () => {
  it('retorna triângulos, bloqueios e blocos kármicos serializáveis', () => {
    const summary = buildChatReadingSummary('Maria da Silva', '15/03/1990');
    assert.equal(summary.nomeExibido, 'Maria da Silva');
    assert.ok(summary.triangulos.vida);
    assert.ok(summary.triangulos.pessoal);
    assert.ok(summary.triangulos.social);
    assert.ok(summary.triangulos.destino);
    assert.ok(Array.isArray(summary.bloqueios));
    assert.ok(Array.isArray(summary.licoesCarmicas));
    assert.ok(Array.isArray(summary.tendenciasOcultas));
    assert.ok(Array.isArray(summary.debitosCarmicos));
    assert.ok(typeof summary.frequencias === 'object');
    assert.doesNotThrow(() => JSON.stringify(summary));
  });
});
