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

  it('buildNomeSocialCheckoutHref inclui UTMs do chat', () => {
    const href = buildNomeSocialCheckoutHref();
    assert.match(href, /utm_source=app_chat/);
    assert.match(href, /utm_campaign=card_pdf/);
    assert.match(href, /produto=nome_social/);
  });

  it('CHAT_PDF_PREP_TIME_LABEL comunica teto pós-fix', () => {
    assert.equal(CHAT_PDF_PREP_TIME_LABEL, 'até 1 minuto');
    assert.ok(CHAT_PDF_TYPICAL_TOTAL_MS <= 60_000);
  });
});
