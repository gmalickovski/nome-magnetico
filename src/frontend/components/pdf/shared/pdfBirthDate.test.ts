import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcularTodosTriangulos, detectarBloqueios } from '../../../../backend/numerology/triangle';
import { normalizeBirthDateForNumerology } from './pdfBirthDate';

const NOME = 'Alexandra Mendes Vale';

describe('pdfBirthDate · equivalência PT vs ISO na fronteira PDF', () => {
  it('ISO DB normaliza para PT e reproduz regentes 8/6/2/9 e bloqueio 333', () => {
    const pt = '07/03/1992';
    const iso = '1992-03-07';
    assert.equal(normalizeBirthDateForNumerology(iso), pt);

    const triPt = calcularTodosTriangulos(NOME, pt);
    const triNorm = calcularTodosTriangulos(NOME, normalizeBirthDateForNumerology(iso));
    assert.deepEqual(
      {
        vida: triNorm.vida.arcanoRegente,
        pessoal: triNorm.pessoal.arcanoRegente,
        social: triNorm.social.arcanoRegente,
        destino: triNorm.destino.arcanoRegente,
      },
      {
        vida: triPt.vida.arcanoRegente,
        pessoal: triPt.pessoal.arcanoRegente,
        social: triPt.social.arcanoRegente,
        destino: triPt.destino.arcanoRegente,
      },
    );
    assert.equal(detectarBloqueios(triNorm)[0]?.codigo, detectarBloqueios(triPt)[0]?.codigo);
    const codigos = detectarBloqueios(triNorm).map((b) => b.codigo).sort();
    assert.deepEqual(codigos, ['333', '555', '888', '999']);
    assert.deepEqual(
      {
        vida: triNorm.vida.arcanoRegente,
        pessoal: triNorm.pessoal.arcanoRegente,
        social: triNorm.social.arcanoRegente,
        destino: triNorm.destino.arcanoRegente,
      },
      { vida: 8, pessoal: 6, social: 2, destino: 9 },
    );
  });
});
