/**
 * Gera PDFs fictícios (caso 1 e caso 3) e PNG da última página para DEV-275.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { Document, renderToBuffer } from '@react-pdf/renderer';
import { buildFreeLeadAnalysisRecord, renderFreeLeadPdfBase64 } from '../src/backend/public-free-analysis/generate-free-lead-pdf.ts';
import { PDFPotencialMaximoCtaPage } from '../src/frontend/components/pdf/shared/PDFPotencialMaximoCta.tsx';
import { buildPotencialCtaQrDataUrl } from '../src/frontend/components/pdf/shared/pdfPotencialQr.ts';
import { buildPotencialCtaUrl } from '../src/frontend/components/pdf/shared/pdfPotencialCtaUrl.ts';
import { calcularPotencialAssinaturaPdfGratuito, notaEstritamenteMaiorQueBase } from '../src/backend/numerology/products/nome-social-potencial-pdf.ts';

const OUT = '/opt/cursor/artifacts';

async function renderLastPagePdf(
  notaBase: number,
  potencialMax: number,
  variant: 'com_cta' | 'sem_cta',
  nome: string,
  pdfPath: string,
  pngPath: string,
) {
  const ctaUrl = buildPotencialCtaUrl(nome);
  const qr = variant === 'com_cta' ? await buildPotencialCtaQrDataUrl(ctaUrl) : undefined;
  const buf = await renderToBuffer(
    React.createElement(
      Document,
      null,
      React.createElement(PDFPotencialMaximoCtaPage, {
        notaBase,
        potencialMax,
        variant,
        ctaUrl,
        qrDataUrl: qr,
      }),
    ),
  );
  await fs.writeFile(pdfPath, buf);
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  try {
    await execFileAsync('pdftoppm', ['-png', '-singlefile', '-f', '1', '-l', '1', pdfPath, pngPath.replace(/\.png$/, '')]);
  } catch {
  await fs.copyFile(pdfPath, pngPath.replace(/\.png$/, '-page.pdf'));
  }
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const caso1Nome = 'Guilherme Malickovski Correa';
  const caso1Data = '14/02/1990';
  const caso1 = buildFreeLeadAnalysisRecord({
    nomeCompleto: caso1Nome,
    dataNascimentoPt: caso1Data,
    dataNascimentoDb: '1990-02-14',
    createdAt: new Date().toISOString(),
  });
  const caso1PdfB64 = await renderFreeLeadPdfBase64(caso1.record, 'Guilherme');
  await fs.writeFile(
    path.join(OUT, 'dev275-pdf-gratis-caso1-potencial-maior.pdf'),
    Buffer.from(caso1PdfB64, 'base64'),
  );

  const caso3Nome = 'Rosa Maria Oliveira';
  const caso3Data = '10/05/1975';
  const caso3Pot = calcularPotencialAssinaturaPdfGratuito(caso3Nome, caso3Data);
  const caso3 = buildFreeLeadAnalysisRecord({
    nomeCompleto: caso3Nome,
    dataNascimentoPt: caso3Data,
    dataNascimentoDb: '1975-05-10',
    createdAt: new Date().toISOString(),
  });
  const caso3PdfB64 = await renderFreeLeadPdfBase64(caso3.record, 'Rosa');
  await fs.writeFile(
    path.join(OUT, 'dev275-pdf-gratis-caso3-sem-cta.pdf'),
    Buffer.from(caso3PdfB64, 'base64'),
  );

  const pot1 = calcularPotencialAssinaturaPdfGratuito(caso1Nome, caso1Data);
  const max1 = pot1.potencialMax ?? pot1.notaBase;
  await renderLastPagePdf(
    pot1.notaBase,
    max1,
    notaEstritamenteMaiorQueBase(max1, pot1.notaBase) ? 'com_cta' : 'sem_cta',
    caso1Nome,
    path.join(OUT, 'dev275-ultima-pagina-caso1.pdf'),
    path.join(OUT, 'dev275-ultima-pagina-caso1.png'),
  );

  await renderLastPagePdf(
    caso3Pot.notaBase,
    caso3Pot.potencialMax ?? caso3Pot.notaBase,
    'sem_cta',
    caso3Nome,
    path.join(OUT, 'dev275-ultima-pagina-caso3.pdf'),
    path.join(OUT, 'dev275-ultima-pagina-caso3.png'),
  );

  console.log('Artifacts written to', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
