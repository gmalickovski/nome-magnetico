import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatBRLFromCents } from './format-brl-cents';

describe('formatBRLFromCents', () => {
  it('formata centavos de teste Stripe (2990 → R$ 29,90)', () => {
    assert.equal(formatBRLFromCents(2990), 'R$ 29,90');
  });

  it('formata preço real em centavos (9800 → R$ 98,00)', () => {
    assert.equal(formatBRLFromCents(9800), 'R$ 98,00');
  });

  it('formata zero', () => {
    assert.equal(formatBRLFromCents(0), 'R$ 0,00');
  });

  it('rejeita valores não finitos', () => {
    assert.throws(() => formatBRLFromCents(Number.NaN), RangeError);
  });
});
