import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildGratuitoTocEntries, buildPaidTocEntries } from './pdfTocCatalog.ts';

const ENTRIES_PER_PAGE = 22;

describe('pdfTocCatalog', () => {
  it('multipágina quando entradas sintéticas excedem 22', () => {
    const entries = Array.from({ length: 25 }, (_, i) => ({
      id: `pdf-test-${i}`,
      title: `Item ${i}`,
      level: 0 as const,
    }));
    const pages = Math.ceil(entries.length / ENTRIES_PER_PAGE);
    assert.equal(pages, 2);
  });

  it('gratuito inclui ids raiz da revisão Growth 05/11', () => {
    const ids = buildGratuitoTocEntries().map((e) => e.id);
    for (const id of ['pdf-essencia', 'pdf-mapa', 'pdf-score', 'pdf-nome-social']) {
      assert.ok(ids.includes(id), `faltando ${id}`);
    }
  });

  it('pago inclui ids raiz e subassuntos principais', () => {
    const ids = buildPaidTocEntries(true).map((e) => e.id);
    for (const id of [
      'pdf-ranking',
      'pdf-essencia',
      'pdf-harmonizacao',
      'pdf-harmonizacao-comparativa',
      'pdf-guia',
      'pdf-score',
      'pdf-treino',
      'pdf-essencia-expressao',
      'pdf-essencia-triangulo-vida',
      'pdf-essencia-debitos',
      'pdf-harmonizacao-corpo',
      'pdf-arquetipo',
    ]) {
      assert.ok(ids.includes(id), `faltando ${id}`);
    }
  });
});

it('DEV-299 capítulos pai começam em Page independente mesmo com espaço anterior', () => {
  const source = readFileSync(new URL('../NomeSocialPDF.tsx', import.meta.url), 'utf8');
  for (const id of ['pdf-essencia', 'pdf-harmonizacao', 'pdf-nome-harmonizado', 'pdf-anexos']) {
    assert.match(source, new RegExp('<Page[^>]*>\\s*<PDFSectionAnchor\\s+id="' + id + '"'), id);
  }
  const entries = buildPaidTocEntries(true, { hasConclusion: true });
  assert.equal(new Set(entries.map(e => e.id)).size, entries.length);
  assert.ok(entries.some(e => e.level === 3));
  assert.ok(!buildPaidTocEntries(false).some(e => e.id === 'pdf-ranking' || e.id === 'pdf-conclusao'));
});
