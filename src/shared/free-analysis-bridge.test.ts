import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildChatCtaHref,
  ehNotaAlta,
  ganhoEmPontos,
  notaBucket,
  textoPontos,
} from './free-analysis-bridge';

describe('ponte grátis para pago (DEV-343)', () => {
  it('ganho em pontos: diferença entre potencial e nota, nunca negativa', () => {
    assert.equal(ganhoEmPontos(26, 93), 67);
    assert.equal(ganhoEmPontos(93, 93), 0);
    assert.equal(ganhoEmPontos(80, 70), 0);
    assert.equal(ganhoEmPontos(26, null), 0);
    assert.equal(ganhoEmPontos(Number.NaN, 90), 0);
  });

  it('faixas de nota: 70 ou mais é alta', () => {
    assert.equal(notaBucket(26), 'baixa');
    assert.equal(notaBucket(40), 'media');
    assert.equal(notaBucket(69), 'media');
    assert.equal(notaBucket(70), 'alta');
    assert.equal(ehNotaAlta(69), false);
    assert.equal(ehNotaAlta(70), true);
  });

  it('singular e plural de pontos', () => {
    assert.equal(textoPontos(1), '1 ponto');
    assert.equal(textoPontos(29), '29 pontos');
  });

  it('CTA vai direto ao chat de harmonizar, com origem e sem dados pessoais', () => {
    const href = buildChatCtaHref('modal_resultado_gratis');
    assert.ok(href.startsWith('/app/analise/nome-social?caminho=dia_a_dia&'));
    assert.match(href, /from=modal_resultado_gratis/);
    assert.doesNotMatch(href, /nome=|email|data|nasc/i);
  });
});
