import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPotencialAssinaturaPdfGratuito } from '../numerology/products/nome-social-potencial-pdf.ts';
import { avaliarNome } from '../numerology/score.ts';
import { buildFreeAnalysisPreview } from './preview.ts';

const salvo = process.env.SCORE_VERSION;
before(() => {
  process.env.SCORE_VERSION = 'v3';
});
after(() => {
  if (salvo === undefined) delete process.env.SCORE_VERSION;
  else process.env.SCORE_VERSION = salvo;
});

const CASOS: Array<[string, string]> = [
  ['Ana Paula Ferreira Lima', '23/07/1988'],
  ['Pedro Souza Rocha', '01/01/1990'],
  ['Camila Dias Nunes', '18/03/1992'],
  ['Guilherme Malickovski Correa', '14/02/1990'],
  ['Beatriz Costa Mendes', '05/06/1993'],
  ['Bruno Carvalho Ribeiro', '12/12/1985'],
];

function preview(nome: string, data: string) {
  const av = avaliarNome(nome, data, { calcularPotencial: true });
  return buildFreeAnalysisPreview({
    firstName: nome.split(' ')[0]!,
    nomeCompleto: nome,
    dataNascimentoPt: data,
    score: av.score_v3,
    nivelCodigo: av.nivel.codigo,
    nivelRotulo: av.nivel.rotulo,
    marcaDaDataPresente: av.marcaDaData.length > 0,
  });
}

describe('DEV-314 · prévia da análise grátis', () => {
  it('a nota máxima do pop-up é exatamente a do CTA do PDF (mesma função)', () => {
    for (const [nome, data] of CASOS) {
      const pdf = calcularPotencialAssinaturaPdfGratuito(nome, data);
      const p = preview(nome, data);
      if (p.potencialMax !== null) {
        assert.equal(p.potencialMax, pdf.potencialMax, `${nome}`);
        assert.ok(p.potencialMax > p.score, `${nome}: máxima deve ser maior que a atual`);
      }
    }
  });

  it('nunca inventa número: sem ganho possível, potencialMax é null', () => {
    for (const [nome, data] of CASOS) {
      const p = preview(nome, data);
      assert.ok(p.potencialMax === null || (Number.isFinite(p.potencialMax) && p.potencialMax <= 100));
    }
    // nome minúsculo/curto: sem cálculo, sem número
    const curto = buildFreeAnalysisPreview({
      firstName: 'A', nomeCompleto: 'A', dataNascimentoPt: '01/01/1990',
      score: 50, nivelCodigo: 'N3', nivelRotulo: 'Equilíbrio Parcial', marcaDaDataPresente: false,
    });
    assert.equal(curto.potencialMax, null);
  });

  it('se a nota atual já for igual ou maior que a máxima, não há ganho', () => {
    const p = buildFreeAnalysisPreview({
      firstName: 'Ana', nomeCompleto: 'Ana Paula Ferreira Lima', dataNascimentoPt: '23/07/1988',
      score: 100, nivelCodigo: 'N5', nivelRotulo: 'Harmonioso', marcaDaDataPresente: false,
    });
    assert.equal(p.potencialMax, null);
  });
});
