import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_COLLECT_STATE } from './decide-live-bridge.ts';
import { buildChatPdfAnalyzePayload } from './chat-pdf-persist.ts';

describe('buildChatPdfAnalyzePayload', () => {
  it('marca nome escolhido e envia nome social principal', () => {
    const body = buildChatPdfAnalyzePayload({
      birthName: 'Maria Silva',
      birthDate: '01/01/1990',
      selectedSocialName: 'Guilherme Málickovski',
      collect: INITIAL_COLLECT_STATE,
    });
    assert.equal(body.product_type, 'nome_social');
    assert.equal(body.nome_completo, 'Maria Silva');
    assert.equal(body.nome_social_principal, 'Guilherme Málickovski');
    assert.equal(body.nome_ja_escolhido, true);
  });
});
