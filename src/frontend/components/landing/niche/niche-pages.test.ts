import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { NOME_ARTISTICO_COPY } from './nome-artistico-copy.js';
import { NOME_BEBE_COPY } from './nome-bebe-copy.js';
import { NOME_SOCIAL_COPY } from './nome-social-copy.js';

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) collectStrings(entry, out);
  }
  return out;
}

describe('DEV-339 · Páginas de nicho (Nome Social, Nome Artístico, Nome do Bebê)', () => {
  it('mantém copy provisória com [TEXTO], sem termos proibidos e com avisos corretos por nicho', () => {
    const files = ['nome-social-copy.ts', 'nome-artistico-copy.ts', 'nome-bebe-copy.ts'];
    for (const file of files) {
      const fullPath = path.join(
        process.cwd(),
        'src',
        'frontend',
        'components',
        'landing',
        'niche',
        file,
      );
      const src = readFileSync(fullPath, 'utf8');
      const markers = src.match(/\/\/ \[TEXTO\]/g) ?? [];
      assert.ok(markers.length >= 15, `esperado marcadores // [TEXTO] em ${file}`);
    }

    const copies = [NOME_SOCIAL_COPY, NOME_ARTISTICO_COPY, NOME_BEBE_COPY];
    for (const copy of copies) {
      const allText = collectStrings(copy).join(' | ');
      assert.doesNotMatch(allText, /\bastro\b/i);
      assert.doesNotMatch(allText, /incompat[íi]vel/i);
      assert.doesNotMatch(allText, /radiestes|p[eê]ndulo/i);
    }

    assert.equal(NOME_SOCIAL_COPY.ctaHref, '/app/analise/nome-social?caminho=dia_a_dia');
    assert.equal(NOME_ARTISTICO_COPY.ctaHref, '/app/analise/nome-social?caminho=artistico');
    assert.equal(NOME_BEBE_COPY.ctaHref, '/app/analise/nome-social?caminho=bebe');

    assert.equal(NOME_SOCIAL_COPY.notice, null);
    assert.ok(NOME_ARTISTICO_COPY.notice && /contrato/i.test(collectStrings(NOME_ARTISTICO_COPY.notice).join(' ')));
    assert.ok(NOME_BEBE_COPY.notice && /registro/i.test(collectStrings(NOME_BEBE_COPY.notice).join(' ')));
    assert.ok(NOME_BEBE_COPY.notice && /prazo/i.test(collectStrings(NOME_BEBE_COPY.notice).join(' ')));
  });

  it('monta as 3 rotas sem redirect em /nome-bebe e com as 9 seções em ordem no template', () => {
    const pages = ['nome-social.astro', 'nome-artistico.astro', 'nome-bebe.astro'];
    for (const page of pages) {
      const pagePath = path.join(process.cwd(), 'src', 'pages', page);
      const src = readFileSync(pagePath, 'utf8');
      assert.match(src, /NicheLandingPage/);
      assert.doesNotMatch(src, /Astro\.redirect/);
    }

    const templatePath = path.join(process.cwd(), 'src', 'components', 'NicheLandingPage.astro');
    const templateSrc = readFileSync(templatePath, 'utf8');
    const orderedTokens = [
      'id="inicio"',
      '<NicheHeroScene client:idle',
      '<NicheQuestionsSection client:visible',
      '<NicheAnalysisSection client:visible',
      '<NicheSuggestionsSection client:visible',
      '<NicheDeliverablesSection client:visible',
      '<NicheNoticeSection client:visible',
      '<PricingSection',
      '<FAQSection client:visible',
      '<NicheFinalCtaSection client:visible',
    ];

    let cursor = -1;
    for (const token of orderedTokens) {
      const idx = templateSrc.indexOf(token);
      assert.ok(idx > cursor, `esperado "${token}" após índice ${cursor} em NicheLandingPage.astro`);
      cursor = idx;
    }
  });

  it('expõe dropdown "Nome" com as 3 páginas no LandingHeader e inclui todas no sitemap', () => {
    const headerPath = path.join(
      process.cwd(),
      'src',
      'frontend',
      'components',
      'landing',
      'LandingHeader.tsx',
    );
    const headerSrc = readFileSync(headerPath, 'utf8');
    assert.match(headerSrc, /href: '\/nome-social'/);
    assert.match(headerSrc, /href: '\/nome-artistico'/);
    assert.match(headerSrc, /href: '\/nome-bebe'/);
    assert.match(headerSrc, />Nome<\/span>/);

    const sitemapPath = path.join(process.cwd(), 'src', 'pages', 'sitemap.xml.ts');
    const sitemapSrc = readFileSync(sitemapPath, 'utf8');
    assert.match(sitemapSrc, /url: '\/nome-social'/);
    assert.match(sitemapSrc, /url: '\/nome-artistico'/);
    assert.match(sitemapSrc, /url: '\/nome-bebe'/);
  });
});
