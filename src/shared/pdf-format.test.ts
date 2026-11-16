import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasDistinctHarmonizedNameForPdf,
  shouldUseFreeBirthPdf,
} from './pdf-format.ts';
import { buildPdfRequestUrl } from '../frontend/lib/pdf-download.ts';

describe('pdf-format / rota de download gratuito para nome de nascimento', () => {
  it('usa PDF gratuito quando analise é analise_gratuita ou isFree=true', () => {
    assert.equal(
      shouldUseFreeBirthPdf({
        productType: 'analise_gratuita',
        isFree: true,
        birthName: 'Maria Silva',
      }),
      true,
    );
    assert.equal(
      shouldUseFreeBirthPdf({
        productType: 'nome_social',
        isFree: true,
        birthName: 'Maria Silva',
        selectedSocialName: 'Maria S. Luz',
      }),
      true,
    );
  });

  it('usa PDF gratuito quando formato=gratuito ou modo=nascimento é solicitado explicitamente (card sintético)', () => {
    assert.equal(
      shouldUseFreeBirthPdf({
        productType: 'nome_social',
        isFree: false,
        birthName: 'Maria Silva',
        selectedSocialName: 'Maria S. Luz',
        harmonizedName: 'Maria S. Luz',
        requestedFormat: 'gratuito',
      }),
      true,
    );
    assert.equal(
      shouldUseFreeBirthPdf({
        productType: 'nome_social',
        isFree: false,
        birthName: 'Maria Silva',
        selectedSocialName: 'Maria S. Luz',
        requestedMode: 'nascimento',
      }),
      true,
    );
  });

  it('usa PDF gratuito para nome_social sem harmonização distinta do nascimento', () => {
    assert.equal(
      shouldUseFreeBirthPdf({
        productType: 'nome_social',
        isFree: false,
        birthName: 'Maria Silva',
        selectedSocialName: null,
        harmonizedName: null,
      }),
      true,
    );
    assert.equal(
      shouldUseFreeBirthPdf({
        productType: 'nome_social',
        isFree: false,
        birthName: 'Maria  Silva',
        selectedSocialName: 'maria silva',
        harmonizedName: 'Maria Silva',
      }),
      true,
    );
  });

  it('usa PDF completo para nome_social com harmonização distinta e outros produtos', () => {
    assert.equal(
      hasDistinctHarmonizedNameForPdf('Maria Silva', 'Maria S. Silva', null),
      true,
    );
    assert.equal(
      shouldUseFreeBirthPdf({
        productType: 'nome_social',
        isFree: false,
        birthName: 'Maria Silva',
        selectedSocialName: 'Maria S. Silva',
      }),
      false,
    );
    assert.equal(
      shouldUseFreeBirthPdf({
        productType: 'nome_bebe',
        isFree: false,
        birthName: 'Bebê Silva',
        requestedFormat: 'gratuito',
      }),
      false,
    );
    assert.equal(
      shouldUseFreeBirthPdf({
        productType: 'nome_empresa',
        isFree: false,
        birthName: 'Empresa Alpha',
        requestedFormat: 'gratuito',
      }),
      false,
    );
  });

  it('buildPdfRequestUrl adiciona formato=gratuito apenas quando forceFreePdf=true', () => {
    const freeUrl = buildPdfRequestUrl('abc-123', undefined, true);
    assert.match(freeUrl, /^\/api\/generate-pdf\?id=abc-123&formato=gratuito&t=\d+$/);

    const paidUrl = buildPdfRequestUrl('abc-123', undefined, false);
    assert.match(paidUrl, /^\/api\/generate-pdf\?id=abc-123&t=\d+$/);
  });
});
