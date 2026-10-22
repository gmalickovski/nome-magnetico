/**
 * Garante que o grafo harmonization → score → products/nome-social resolve em runtime
 * (regressão: require dinâmico em score.ts não empacotava nome-social no chunk de produção).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { avaliarCompatibilidade } from './harmonization.ts';
import { calcularPotencialV3 } from './score.ts';
import { listarNomesCandidatosGerador } from './products/nome-social.ts';

describe('harmonization · bundle graph nome-social', () => {
  it('score importa listarNomesCandidatosGerador sem require em runtime', () => {
    const candidatos = listarNomesCandidatosGerador('Maria Silva Santos');
    assert.ok(candidatos.length > 0);
    assert.ok(candidatos.every(n => typeof n === 'string' && n.length >= 3));
  });

  it('harmonization + calcularPotencialV3 resolve products/nome-social', () => {
    const nome = 'Guilherme Malickovski Correa';
    const data = '14/02/1990';
    const compat = avaliarCompatibilidade(5, 7);
    assert.ok(['favoravel', 'neutro', 'desfavoravel'].includes(compat));
    const potencial = calcularPotencialV3(nome, data);
    assert.equal(typeof potencial, 'number');
    assert.ok(potencial >= 0 && potencial <= 100);
  });
});
