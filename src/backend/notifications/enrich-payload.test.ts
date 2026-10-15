import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { enrichNotificationPayload } from './enrich-payload';

describe('enrichNotificationPayload', () => {
  it('adiciona amount_formatted quando amount está em centavos', () => {
    const out = enrichNotificationPayload({
      email: 'a@b.com',
      amount: 2990,
      productName: 'Nome Social',
    });

    assert.equal(out.amount, 2990);
    assert.equal(out.amount_formatted, 'R$ 29,90');
  });

  it('não altera amount_formatted já definido', () => {
    const out = enrichNotificationPayload({
      amount: 9800,
      amount_formatted: 'R$ 99,00 (override)',
    });

    assert.equal(out.amount_formatted, 'R$ 99,00 (override)');
  });

  it('ignora payload sem amount numérico', () => {
    const payload = { email: 'a@b.com', productName: 'Nome Social' };
    assert.equal(enrichNotificationPayload(payload), payload);
  });
});
