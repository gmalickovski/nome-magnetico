import React from 'react';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Document, Page, Text, renderToBuffer } from '@react-pdf/renderer';
import { PDFTableOfContents } from './PDFTableOfContents.tsx';
import { buildStressTocEntries } from './pdfTocCatalog.ts';
import { inspectNamedDestinations } from './pdfDestinationInspect.ts';

describe('PDFTableOfContents multipágina', () => {
  it('renderiza sumário >22 entradas com segunda página de sumário', async () => {
    const entries = buildStressTocEntries(25);
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
    assert.ok(dests['pdf-stress-1'] >= dests['pdf-sumario-cont-2'], 'destino após sumário');
  });
});
