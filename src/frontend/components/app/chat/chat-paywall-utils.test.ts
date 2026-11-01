import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPaywallCheckoutHref,
  pickMotorHighlights,
} from './chat-paywall-utils.ts';

describe('chat-paywall-utils', () => {
  it('buildPaywallCheckoutHref usa utm paywall_free e aceita contexto opcional', () => {
    const href = buildPaywallCheckoutHref({
      chosenSignature: 'Maria Clara Luz',
      analysisId: '550e8400-e29b-41d4-a716-446655440000',
    });
    assert.match(href, /utm_source=app_chat/);
    assert.match(href, /utm_campaign=paywall_free/);
    assert.match(href, /source=paywall_free/);
    assert.match(href, /produto=nome_social/);
    assert.match(href, /chosen_signature=Maria\+Clara\+Luz/);
    assert.match(href, /analysis_id=550e8400-e29b-41d4-a716-446655440000/);
  });

  it('pickMotorHighlights limita a 3 itens válidos', () => {
    const items = pickMotorHighlights([
      { label: 'A', value: '1' },
      { label: 'B', value: '2' },
      { label: 'C', value: '3' },
      { label: 'D', value: '4' },
      { label: '', value: 'x' },
    ]);
    assert.equal(items.length, 3);
    assert.deepEqual(items.map((i) => i.label), ['A', 'B', 'C']);
  });
});
