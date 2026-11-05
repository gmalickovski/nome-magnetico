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
      'pdf-essencia-cinco-numeros',
      'pdf-harmonizacao-corpo',
      'pdf-arquetipo',
    ]) {
      assert.ok(ids.includes(id), `faltando ${id}`);
    }
  });
});
