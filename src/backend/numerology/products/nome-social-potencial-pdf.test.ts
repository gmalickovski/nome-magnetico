import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analisarNomesSocial } from './nome-social';
import { calcularPotencialV3 } from '../score';
import {
  calcularPotencialAssinaturaPdfGratuito,
  notaEstritamenteMaiorQueBase,
  potencialMaximoGeradorParidade,
  potencialV3Existente,
} from './nome-social-potencial-pdf';

describe('nome-social-potencial-pdf (DEV-275)', () => {
  const data = '14/02/1990';

  it('compara notas sem arredondar para cima', () => {
    assert.equal(notaEstritamenteMaiorQueBase(66.5, 66.4), true);
    assert.equal(notaEstritamenteMaiorQueBase(66.4, 66.4), false);
    assert.equal(notaEstritamenteMaiorQueBase(66.3, 66.4), false);
  });

  it('paridade: potencial do gerador bate com o máximo elegível da análise paga padrão', () => {
    const nome = 'Guilherme Malickovski Correa';
    const pdf = calcularPotencialAssinaturaPdfGratuito(nome, data);
    assert.equal(pdf.calculado, true);

    const pago = analisarNomesSocial([], nome, data);
    const elegiveis = pago.nomesCandidatos.filter(
      (c) => c.semSequenciaVida && c.score > pdf.notaBase,
    );
    const maxPago = elegiveis.length > 0 ? Math.max(...elegiveis.map((c) => c.score)) : null;

    const maxGerador = potencialMaximoGeradorParidade(nome, data);
    assert.equal(pdf.potencialMax, maxGerador);

    if (maxPago != null) {
      assert.equal(maxPago, maxGerador);
    } else {
      assert.equal(maxGerador, null);
    }
  });

  it('caso 3: sem assinatura elegível acima da base', () => {
    const pdf = calcularPotencialAssinaturaPdfGratuito('Rosa Maria Oliveira', '10/05/1975');
    assert.equal(pdf.calculado, true);
    assert.equal(pdf.potencialMax, null);
  });

  it('potencial V3 (modal) vs máximo elegível do PDF: exemplos numéricos', () => {
    const guilherme = calcularPotencialAssinaturaPdfGratuito(
      'Guilherme Malickovski Correa',
      '14/02/1990',
    );
    const v3Gui = potencialV3Existente('Guilherme Malickovski Correa', '14/02/1990');
    assert.equal(guilherme.notaBase, 64);
    assert.equal(v3Gui, 93);
    assert.equal(guilherme.potencialMax, 93);

    const ana = calcularPotencialAssinaturaPdfGratuito('Ana Clara Silva', '15/03/1988');
    assert.equal(calcularPotencialV3('Ana Clara Silva', '15/03/1988'), 84);
    assert.equal(ana.potencialMax, 84);

    const rosa = calcularPotencialAssinaturaPdfGratuito('Rosa Maria Oliveira', '10/05/1975');
    assert.equal(calcularPotencialV3('Rosa Maria Oliveira', '10/05/1975'), 93);
    assert.equal(rosa.notaBase, 93);
    assert.equal(rosa.potencialMax, null);
  });

  it('sem potencial calculado quando motor v3 desligado', () => {
    const prev = process.env.SCORE_VERSION;
    process.env.SCORE_VERSION = 'v1';
    try {
      const pdf = calcularPotencialAssinaturaPdfGratuito('Rosa Maria Oliveira', '10/05/1975');
      assert.equal(pdf.calculado, false);
      assert.equal(pdf.potencialMax, null);
    } finally {
      if (prev === undefined) delete process.env.SCORE_VERSION;
      else process.env.SCORE_VERSION = prev;
    }
  });
});
