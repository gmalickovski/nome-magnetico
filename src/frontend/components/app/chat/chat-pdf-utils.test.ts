import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNomeSocialCheckoutHref,
  CHAT_PDF_PREP_TIME_LABEL,
  CHAT_PDF_TYPICAL_TOTAL_MS,
  scoreBucket,
  truncateDisplayName,
} from './chat-pdf-utils.ts';

describe('chat-pdf-utils', () => {
  it('truncateDisplayName adiciona ellipsis após 24 caracteres', () => {
    const long = 'A'.repeat(30);
    assert.equal(truncateDisplayName(long).length, 24);
    assert.match(truncateDisplayName(long), /…$/);
  });

  it('scoreBucket mapeia faixas', () => {
    assert.equal(scoreBucket(95), '90_100');
    assert.equal(scoreBucket(72), '70_89');
    assert.equal(scoreBucket(10), '0_19');
  });

  it('buildNomeSocialCheckoutHref identifica o card sem alterar a campanha de entrada', () => {
    const { searchParams } = new URL(buildNomeSocialCheckoutHref(), 'https://example.test');
    assert.deepEqual(Object.fromEntries(searchParams), { produto: 'nome_social', source: 'card_pdf' });
  });

  it('CHAT_PDF_PREP_TIME_LABEL comunica prazo realista para PDF completo', () => {
    assert.equal(CHAT_PDF_PREP_TIME_LABEL, 'de 1 a 3 minutos');
    assert.ok(CHAT_PDF_TYPICAL_TOTAL_MS <= 180_000);
  });
});
