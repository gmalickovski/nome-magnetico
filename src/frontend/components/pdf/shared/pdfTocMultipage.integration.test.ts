import React from 'react';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Document, Page, Text, renderToBuffer } from '@react-pdf/renderer';
import { PDFTableOfContents } from './PDFTableOfContents.tsx';
import { buildStressTocEntries } from './pdfTocCatalog.ts';
import { inspectNamedDestinations } from './pdfDestinationInspect.ts';

describe('PDFTableOfContents multipágina', () => {
  it('renderiza sumário >22 entradas com segunda página de sumário', async () => {
    const entries = buildStressTocEntries(45);
    for (let i = 0; i < entries.length; i++) {
      entries[i] = { ...entries[i], page: 3 + i };
    }

    const buf = await renderToBuffer(
      React.createElement(
        Document,
        null,
        React.createElement(PDFTableOfContents, {
          entries,
          subtitle: 'Teste stress sumário',
        }),
        ...entries.map((e) =>
          React.createElement(
            Page,
            { key: e.id, size: 'A4', id: e.id },
            React.createElement(Text, null, e.title),
          ),
        ),
      ) as React.ReactElement,
    );

    const dests = await inspectNamedDestinations(Buffer.from(buf));
    assert.ok(!('error' in dests), `inspect: ${'error' in dests ? dests.error : ''}`);
    assert.ok(dests['pdf-sumario'] >= 1, 'primeira página do sumário');
    assert.ok(dests['pdf-sumario-cont-2'] >= dests['pdf-sumario'], 'segunda página do sumário');
    assert.equal(dests['pdf-sumario-cont-3'], undefined, '45 entradas cabem em duas folhas sem terceira folha com uma linha');
    assert.ok(dests['pdf-stress-1'] >= dests['pdf-sumario-cont-2'], 'destino após sumário');
  });

  it('mede o espaço real com títulos longos e mantém cada entrada inteira numa folha', async () => {
    const entries = buildStressTocEntries(35).map((e, i) => ({
      ...e, title: `Entrada ${String(i + 1).padStart(2, '0')}: leitura contextual dos números e comparação completa da assinatura selecionada com o nome de nascimento, incluindo os pontos de atenção.`,
    }));
    const buffer = await renderToBuffer(React.createElement(Document, null,
      React.createElement(PDFTableOfContents, { entries, subtitle: 'Sumário com títulos extensos' }),
      ...entries.map(e => React.createElement(Page, { key: e.id, id: e.id }, React.createElement(Text, null, 'Corpo'))),
    ) as React.ReactElement);
    const dests = await inspectNamedDestinations(Buffer.from(buffer));
    assert.ok(!('error' in dests));
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const tocPages = dests['pdf-stress-1'] - 1;
    const texts: string[] = [];
    for (let p = 1; p <= tocPages; p++) {
      const content = await (await doc.getPage(p)).getTextContent();
      texts.push(content.items.map((item: any) => item.str ?? '').join('').replace(/\s/g, ''));
    }
    for (const entry of entries) assert.equal(texts.filter(t => t.includes(entry.title.replace(/\s/g, ''))).length, 1, entry.id);
    await doc.destroy();
  });
});
