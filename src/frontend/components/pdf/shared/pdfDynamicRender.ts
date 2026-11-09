import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import type { ProductPDFProps } from './PDFTypes.ts';
import { inspectNamedDestinations } from './pdfDestinationInspect.ts';
import { gratuitoTocAnchorIds, paidTocAnchorIds } from './pdfTocCatalog.ts';

/** Ids usados no two-pass (superset: pago com ranking). */
export const PDF_TOC_ANCHOR_IDS = {
  gratuito: gratuitoTocAnchorIds(),
  nome_social: paidTocAnchorIds(true),
} as const;

type PdfComponent = React.ComponentType<ProductPDFProps>;

function buildPageNumbers(
  pass1Dests: Record<string, number>,
  anchorIds: readonly string[],
  tocPages: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of anchorIds) {
    const p = pass1Dests[id];
    if (typeof p === 'number') out[id] = p + tocPages;
  }
  return out;
}

function countTocPages(dests: Record<string, number>): number {
  let max = 1;
  for (const [id, page] of Object.entries(dests)) {
    if (id === 'pdf-sumario' || id.startsWith('pdf-sumario-cont-')) {
      max = Math.max(max, page);
    }
  }
  const first = dests['pdf-sumario'];
  if (typeof first === 'number' && max >= first) {
    return max - first + 1;
  }
  return 1;
}

/** Render com sumário após capa: números de página derivados da paginação final (two-pass). */
export async function renderProductPdfBuffer(
  Component: PdfComponent,
  props: Omit<ProductPDFProps, 'pdfRender'>,
  anchorIds: readonly string[],
): Promise<Buffer> {
  const pass1 = await renderToBuffer(
    React.createElement(Component, {
      ...props,
      pdfRender: { omitTableOfContents: true },
    }) as React.ReactElement,
  );
  const pass1Dests = await inspectNamedDestinations(Buffer.from(pass1));
  if ('error' in pass1Dests) {
    throw new Error(`pdf pass1 destinos: ${pass1Dests.error}`);
  }

  let tocPages = 1;
  let lastBuf = pass1;

  for (let attempt = 0; attempt < 6; attempt++) {
    const tocPageNumbers = buildPageNumbers(pass1Dests, anchorIds, tocPages);
    const pass2 = await renderToBuffer(
      React.createElement(Component, {
        ...props,
        pdfRender: { omitTableOfContents: false, tocPageNumbers },
      }) as React.ReactElement,
    );
    lastBuf = pass2;
    const pass2Dests = await inspectNamedDestinations(Buffer.from(pass2));
    if ('error' in pass2Dests) {
      throw new Error(`pdf pass2 destinos: ${pass2Dests.error}`);
    }
    const inferred = countTocPages(pass2Dests);
    if (inferred === tocPages) return pass2;
    tocPages = inferred;
  }

  return lastBuf;
}
