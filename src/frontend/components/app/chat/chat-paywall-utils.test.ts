import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPaywallCheckoutHref,
  pickMotorHighlights,
} from './chat-paywall-utils.ts';

describe('chat-paywall-utils', () => {
  it('buildPaywallCheckoutHref usa utm paywall_free', () => {
    const href = buildPaywallCheckoutHref();
    assert.match(href, /utm_source=app_chat/);
    assert.match(href, /utm_campaign=paywall_free/);
    assert.match(href, /produto=nome_social/);
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
