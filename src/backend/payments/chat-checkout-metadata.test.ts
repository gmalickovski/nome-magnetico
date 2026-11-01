import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseChatCheckoutMetadata } from './chat-checkout-metadata.ts';

describe('parseChatCheckoutMetadata · DEV-261', () => {
  it('retorna null quando metadata está vazio ou sem campos do chat', () => {
    assert.equal(parseChatCheckoutMetadata(null), null);
    assert.equal(parseChatCheckoutMetadata(undefined), null);
    assert.equal(parseChatCheckoutMetadata({ user_id: 'u1', product_type: 'nome_social' }), null);
  });

  it('extrai chosen_signature (trim e truncado em 80 chars), analysis_id UUID e source válido', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const longSignature = `  ${'A'.repeat(100)}  `;
    const parsed = parseChatCheckoutMetadata({
      chosen_signature: longSignature,
      analysis_id: validUuid,
      source: 'card_pdf',
    });

    assert.ok(parsed);
    assert.equal(parsed.chosenSignature?.length, 80);
    assert.equal(parsed.analysisId, validUuid);
    assert.equal(parsed.source, 'card_pdf');
  });

  it('descarta analysis_id inválido e source desconhecido sem quebrar chosen_signature', () => {
    const parsed = parseChatCheckoutMetadata({
      chosen_signature: 'Guilherme M.',
      analysis_id: 'not-a-uuid',
      source: 'outro_canal',
    });

    assert.deepEqual(parsed, {
      chosenSignature: 'Guilherme M.',
      analysisId: null,
      source: null,
    });
  });

  it('retorna null quando todos os campos do chat são inválidos', () => {
    const parsed = parseChatCheckoutMetadata({
      chosen_signature: '   ',
      analysis_id: 'invalid-uuid',
      source: 'invalid_source',
    });
    assert.equal(parsed, null);
  });
});
