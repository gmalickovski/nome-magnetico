import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolvePaidCheckoutMethod } from './checkout-payment-method';

describe('resolvePaidCheckoutMethod · DEV-356', () => {
  it('Pix pago já no checkout.session.completed vem como pix pelo PaymentIntent', async () => {
    const calls: string[] = [];
    const method = await resolvePaidCheckoutMethod(
      { payment_intent: 'pi_test_pix', payment_method_types: ['card', 'pix'] },
      async (id) => {
        calls.push(id);
        return { payment_method: { type: 'pix' } };
      },
    );
    assert.equal(method, 'pix');
    assert.deepEqual(calls, ['pi_test_pix']);
  });

  it('cartão pago numa sessão que aceita Pix continua card', async () => {
    const method = await resolvePaidCheckoutMethod(
      { payment_intent: { id: 'pi_test_card' }, payment_method_types: ['card', 'pix'] },
      async () => ({ payment_method: { type: 'card' } }),
    );
    assert.equal(method, 'card');
  });

  it('sessão só de cartão não consulta o Stripe', async () => {
    const method = await resolvePaidCheckoutMethod(
      { payment_intent: 'pi_test_card', payment_method_types: ['card'] },
      async () => {
        throw new Error('não deveria consultar');
      },
    );
    assert.equal(method, 'card');
  });

  it('falha na consulta mantém card sem lançar', async () => {
    const method = await resolvePaidCheckoutMethod(
      { payment_intent: 'pi_test_x', payment_method_types: ['card', 'pix'] },
      async () => {
        throw new Error('stripe indisponível');
      },
    );
    assert.equal(method, 'card');
  });
});
