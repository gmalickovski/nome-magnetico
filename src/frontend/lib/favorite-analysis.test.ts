import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  favoriteAnalysisStorageKey,
  isFreeAnalysisRecord,
  orderSlidesWithFavorite,
} from './favorite-analysis.js';

describe('favorite-analysis helpers', () => {
  it('identifica análises gratuitas que não podem ser favoritadas como principal', () => {
    assert.equal(isFreeAnalysisRecord({ isFree: true, productType: 'nome_social' }), true);
    assert.equal(isFreeAnalysisRecord({ is_free: true }), true);
    assert.equal(isFreeAnalysisRecord({ product_type: 'analise_gratuita' }), true);
    assert.equal(isFreeAnalysisRecord({ productType: 'analise_gratuita' }), true);
    assert.equal(isFreeAnalysisRecord({ isFree: false, productType: 'nome_social' }), false);
    assert.equal(isFreeAnalysisRecord({ is_free: false, product_type: 'nome_empresa' }), false);
  });

  it('ordena o slide favoritado na primeira posição preservando a ordem dos demais', () => {
    const slides = [
      { id: 'a', nome: 'Maria Flor', score: 96, isFree: false },
      { id: 'b', nome: 'Maria Clara', score: 91, isFree: false },
      { id: 'c', nome: 'Maria Helena', score: 88, isFree: false },
    ];

    const reordered = orderSlidesWithFavorite(slides, 'c');
    assert.deepEqual(
      reordered.map((s) => s.id),
      ['c', 'a', 'b'],
    );
  });

  it('nunca promove uma análise gratuita para a primeira posição ao ordenar favorito', () => {
    const slides = [
      { id: 'paid-1', isFree: false },
      { id: 'free-1', isFree: true },
    ];
    const result = orderSlidesWithFavorite(slides, 'free-1');
    assert.deepEqual(
      result.map((s) => s.id),
      ['paid-1', 'free-1'],
    );
  });

  it('gera chave de storage por usuário', () => {
    assert.equal(favoriteAnalysisStorageKey('user-123'), 'nm:favorite-analysis:v1:user-123');
  });
});
