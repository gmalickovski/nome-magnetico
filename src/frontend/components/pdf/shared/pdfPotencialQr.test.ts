import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { buildPotencialCtaQrDataUrl } from './pdfPotencialQr';
import { buildPotencialCtaUrl } from './pdfPotencialCtaUrl';

function decodeDataUrl(dataUrl: string): string | null {
  const b64 = dataUrl.split(',')[1];
  if (!b64) return null;
  const png = PNG.sync.read(Buffer.from(b64, 'base64'));
  const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return code?.data ?? null;
}

describe('pdfPotencialQr', () => {
  it('QR gerado decodifica para a URL do CTA', async () => {
    const target = buildPotencialCtaUrl('Rosa Maria Oliveira');
    const dataUrl = await buildPotencialCtaQrDataUrl(target);
    const decoded = decodeDataUrl(dataUrl);
    assert.equal(decoded, target);
  });
});
