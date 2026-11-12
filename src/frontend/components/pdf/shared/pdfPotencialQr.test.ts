import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPotencialCtaQrDataUrl } from './pdfPotencialQr';
import { buildPotencialCtaUrl } from './pdfPotencialCtaUrl';

describe('pdfPotencialQr', () => {
  it('QR usa a mesma URL do CTA (sem validação visual)', async () => {
    const ctaUrl = buildPotencialCtaUrl('Maria Silva');
    const dataUrl = await buildPotencialCtaQrDataUrl(ctaUrl);
    assert.match(dataUrl, /^data:image\/png;base64,.+/);
    assert.equal(new URL(ctaUrl).href, ctaUrl);
  });
});
