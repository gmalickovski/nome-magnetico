import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPotencialPdfCopyComCta,
  buildPotencialPdfCopySemCta,
  copyPotencialPdfSemTravessao,
} from './pdfPotencialMaximoCopy';
import { buildPotencialCtaUrl } from './pdfPotencialCtaUrl';

describe('pdfPotencialMaximoCopy (Marketing DEV-275)', () => {
  it('caso com CTA: copy completa sem travessão e sem contagem de opções', () => {
    const copy = buildPotencialPdfCopyComCta(64, 93);
    assert.equal(copy.destaque, 'A nota máxima que o seu nome pode alcançar: 93');
    assert.equal(copy.apoio, 'Hoje, a nota do seu nome de nascimento é 64.');
    assert.equal(copy.ganho, 'São 29 pontos a mais do que a nota de hoje.');
    assert.equal(copy.botao, 'Ver meu nome sem bloqueios');
    assert.match(copy.aviso, /Só mostramos opções com nota acima de 64\./);
    assert.doesNotMatch(copy.destaque + copy.apoio + copy.texto + copy.aviso, /Encontramos \d+ opções/);
    for (const part of Object.values(copy)) {
      assert.equal(copyPotencialPdfSemTravessao(part), true);
    }
  });

  it('nota 70 ou mais: ajuste fino, sem prometer elevação grande, com outros caminhos', () => {
    const copy = buildPotencialPdfCopyComCta(76, 91);
    assert.match(copy.ganho, /Seu nome já está bem\. Um ajuste fino pode levá-lo 15 pontos mais perto do máximo\./);
    assert.equal(copy.botao, 'Ver o ajuste fino do meu nome');
    assert.match(copy.texto, /nome artístico ou escolher o nome do bebê/);
    for (const part of Object.values(copy)) {
      assert.equal(copyPotencialPdfSemTravessao(part), true);
    }
  });

  it('caso sem CTA: sem botão na copy', () => {
    const copy = buildPotencialPdfCopySemCta(93);
    assert.equal(copy.destaque, 'O seu nome já está na nota máxima que encontramos: 93');
    assert.match(copy.texto, /não indicamos a análise completa/);
    assert.doesNotMatch(copy.destaque + copy.texto, /Encontramos \d+ opções/);
    assert.equal(copyPotencialPdfSemTravessao(copy.texto), true);
  });

  it('URL do botão mantém UTMs do Marketing', () => {
    const url = buildPotencialCtaUrl('Maria Silva');
    assert.match(url, /utm_source=pdf/);
    assert.match(url, /utm_medium=free/);
    assert.match(url, /utm_campaign=nmpotencial/);
  });

  it('URL do botão vai ao chat e não leva o nome da pessoa (DEV-343)', () => {
    const url = buildPotencialCtaUrl('Maria Silva');
    assert.match(url, /\/app\/analise\/nome-social\?caminho=dia_a_dia&/);
    assert.doesNotMatch(url, /Maria|Silva|nome=/);
  });
});
