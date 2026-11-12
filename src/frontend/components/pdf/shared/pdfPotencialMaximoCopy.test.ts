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
    assert.equal(copy.botao, 'Ver minhas opções de assinatura');
    assert.match(copy.aviso, /Só mostramos opções com nota acima de 64\./);
    assert.doesNotMatch(copy.destaque + copy.apoio + copy.texto + copy.aviso, /Encontramos \d+ opções/);
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
});
