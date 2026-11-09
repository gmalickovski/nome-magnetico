import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { Document, Page, Text, renderToBuffer } from '@react-pdf/renderer';
import { inspectNamedDestinations, pdfInspectPrefersPdfJsOnly } from './pdfDestinationInspect.ts';

describe('pdfDestinationInspect', () => {
  it('resolve destinos via pdfjs sem fallback Python quando NM_PDF_INSPECT_PDFJS_ONLY=1', async () => {
    const prev = process.env.NM_PDF_INSPECT_PDFJS_ONLY;
    process.env.NM_PDF_INSPECT_PDFJS_ONLY = '1';
    try {
      assert.equal(pdfInspectPrefersPdfJsOnly(), true);
      const buf = await renderToBuffer(
        React.createElement(
          Document,
          null,
          React.createElement(
            Page,
            { size: 'A4', id: 'pdf-test-anchor' },
            React.createElement(Text, null, 'Teste pdfjs'),
          ),
        ) as React.ReactElement,
      );
      const dests = await inspectNamedDestinations(Buffer.from(buf));
      assert.ok(!('error' in dests), `esperado pdfjs: ${'error' in dests ? dests.error : ''}`);
      assert.equal(dests['pdf-test-anchor'], 1);
    } finally {
      if (prev === undefined) delete process.env.NM_PDF_INSPECT_PDFJS_ONLY;
      else process.env.NM_PDF_INSPECT_PDFJS_ONLY = prev;
    }
  });
});
