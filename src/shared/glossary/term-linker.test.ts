import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CANONICAL_GLOSSARY_TERMS } from './canonical-terms.ts';
import { linkGlossaryTermsInHtml, segmentTextWithGlossaryTerms } from './term-linker.ts';

describe('term-linker', () => {
  it('linka apenas a 1ª ocorrência de cada termo no bloco com longest-match-first', () => {
    const text =
      'O Bloqueio 444 aparece no Triângulo da Vida. Depois o Bloqueio 444 também trava o Triângulo da Vida.';
    const segments = segmentTextWithGlossaryTerms(text, CANONICAL_GLOSSARY_TERMS);

    const linkedTerms = segments.filter((s) => s.type === 'term');
    assert.equal(linkedTerms.length, 2);
    assert.equal(linkedTerms[0].type === 'term' ? linkedTerms[0].term.slug : '', 'bloqueio-444');
    assert.equal(linkedTerms[1].type === 'term' ? linkedTerms[1].term.slug : '', 'triangulo-da-vida');
  });

  it('respeita fronteiras Unicode e ignora falsos positivos em minúscula para aliases exatos', () => {
    const text = 'Uma expressão cotidiana não é Número de Expressão nem Expressão no mapa.';
    const segments = segmentTextWithGlossaryTerms(text, CANONICAL_GLOSSARY_TERMS);

    const linked = segments.filter((s) => s.type === 'term');
    assert.equal(linked.length, 1);
    assert.equal(linked[0].value, 'Número de Expressão');
  });

  it('no HTML ignora headings, links, código e botões mantendo apenas a 1ª ocorrência', () => {
    const html = [
      '<h2>Triângulo da Vida e Bloqueio 444</h2>',
      '<p>Veja <a href="/glossario/triangulo-da-vida">Triângulo da Vida</a> e <code>Bloqueio 444</code>.</p>',
      '<p>No seu mapa, o Triângulo da Vida revela um Bloqueio 444 claro e outro Bloqueio 444 repetido.</p>',
    ].join('');

    const out = linkGlossaryTermsInHtml(html, CANONICAL_GLOSSARY_TERMS, {
      baseHref: '/app/glossario',
    });

    assert.ok(out.includes('<h2>Triângulo da Vida e Bloqueio 444</h2>'));
    assert.ok(out.includes('<a href="/glossario/triangulo-da-vida">Triângulo da Vida</a>'));
    assert.ok(out.includes('<code>Bloqueio 444</code>'));

    const matches444 = out.match(/data-glossary-slug="bloqueio-444"/g) ?? [];
    assert.equal(matches444.length, 1);
    assert.ok(out.includes('href="/app/glossario/bloqueio-444"'));
  });
});
