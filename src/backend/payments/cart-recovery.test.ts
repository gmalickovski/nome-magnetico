import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MOTIVO_CART_ABANDONED,
  resolveRecoveryMotivo,
  isValidHttpsCheckoutUrl,
  hasNoConcatenatedUtm,
  buildCartAbandonedPayload,
  FailedPaymentDeduplicator,
  resolvePaymentMethodFromIntent,
  paymentFailedDisplayFirstName,
} from './cart-recovery';

describe('cart-recovery · payment.failed firstName', () => {
  it('usa parte local do e-mail quando nome está ausente', () => {
    assert.equal(
      paymentFailedDisplayFirstName({ email: 'maria.silva@example.com', nome: null }),
      'maria.silva',
    );
    assert.equal(paymentFailedDisplayFirstName({ email: 'maria@example.com', nome: '  Ana  ' }), 'Ana');
  });
});

describe('cart-recovery · Motivos fixos do Growth', () => {
  it('mapeia exatamente o texto do Caso 1: Pix expirado ou não pago', () => {
    const texto = resolveRecoveryMotivo('pix_expired');
    assert.equal(
      texto,
      'O pagamento via Pix da sua análise de Nome Social não foi concluído.',
    );
    assert.equal(
      MOTIVO_CART_ABANDONED.pix_expired,
      'O pagamento via Pix da sua análise de Nome Social não foi concluído.',
    );
  });

  it('mapeia exatamente o texto do Caso 2: Cartão recusado', () => {
    const texto = resolveRecoveryMotivo('card_declined');
    assert.equal(
      texto,
      'O pagamento com cartão da sua análise de Nome Social não foi concluído.',
    );
    assert.equal(
      MOTIVO_CART_ABANDONED.card_declined,
      'O pagamento com cartão da sua análise de Nome Social não foi concluído.',
    );
  });

  it('mapeia exatamente o texto do Caso 3: Checkout abandonado ou expirado', () => {
    const texto = resolveRecoveryMotivo('checkout_expired');
    assert.equal(
      texto,
      'Você começou o checkout da sua análise de Nome Social e ele ficou pendente.',
    );
    assert.equal(
      MOTIVO_CART_ABANDONED.checkout_expired,
      'Você começou o checkout da sua análise de Nome Social e ele ficou pendente.',
    );
  });
});

describe('cart-recovery · Validação de checkoutUrl', () => {
  it('aceita URLs HTTPS válidas', () => {
    assert.equal(isValidHttpsCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_123'), true);
    assert.equal(isValidHttpsCheckoutUrl('https://nomemagnetico.com.br/comprar'), true);
  });

  it('rejeita URLs inválidas, relativas ou não-HTTPS', () => {
    assert.equal(isValidHttpsCheckoutUrl(''), false);
    assert.equal(isValidHttpsCheckoutUrl(null), false);
    assert.equal(isValidHttpsCheckoutUrl(undefined), false);
    assert.equal(isValidHttpsCheckoutUrl('http://checkout.stripe.com/pay'), false);
    assert.equal(isValidHttpsCheckoutUrl('/comprar'), false);
    assert.equal(isValidHttpsCheckoutUrl('javascript:alert(1)'), false);
  });

  it('detecta ausência ou presença de parâmetros UTM concatenados', () => {
    assert.equal(hasNoConcatenatedUtm('https://checkout.stripe.com/pay/cs_123'), true);
    assert.equal(hasNoConcatenatedUtm('https://checkout.stripe.com/pay/cs_123?utm_source=brevo'), false);
    assert.equal(hasNoConcatenatedUtm('https://checkout.stripe.com/pay/cs_123?utm_medium=email'), false);
    assert.equal(hasNoConcatenatedUtm('https://checkout.stripe.com/pay/cs_123?utm_campaign=nmcart'), false);
  });

  it('buildCartAbandonedPayload rejeita checkoutUrl sem HTTPS ou com UTM', () => {
    const baseInput = {
      email: 'teste@email.com',
      firstName: 'Maria',
      productType: 'nome_social',
      checkoutUrl: 'http://inseguro.com/checkout',
      userId: 'usr_123',
      paymentId: 'cs_123',
      reasonType: 'expired' as const,
      motivo: MOTIVO_CART_ABANDONED.pix_expired,
    };

    assert.equal(buildCartAbandonedPayload(baseInput), null);

    const comUtm = {
      ...baseInput,
      checkoutUrl: 'https://checkout.stripe.com/pay/cs_123?utm_source=email',
    };
    assert.equal(buildCartAbandonedPayload(comUtm), null);

    const valido = {
      ...baseInput,
      checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
      paymentMethod: 'pix' as const,
    };
    const payload = buildCartAbandonedPayload(valido);
    assert.ok(payload);
    assert.equal(payload.email, 'teste@email.com');
    assert.equal(payload.firstName, 'Maria');
    assert.equal(payload.productName, 'Nome Social');
    assert.equal(payload.checkoutUrl, 'https://checkout.stripe.com/pay/cs_123');
    assert.equal(payload.user_id, 'usr_123');
    assert.equal(payload.product_type, 'nome_social');
    assert.equal(payload.payment_id, 'cs_123');
    assert.equal(payload.reason_type, 'expired');
    assert.equal(payload.payment_method, 'pix');
    assert.equal(payload.motivo, MOTIVO_CART_ABANDONED.pix_expired);
  });

  it('mantém firstName vazio sem fallback para e-mail', () => {
    const payload = buildCartAbandonedPayload({
      email: 'maria@email.com',
      firstName: '',
      productType: 'nome_social',
      checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
      userId: 'usr_123',
      paymentId: 'cs_123',
      reasonType: 'expired',
      motivo: MOTIVO_CART_ABANDONED.checkout_expired,
    });
    assert.ok(payload);
    assert.equal(payload.firstName, '');
  });
});

describe('cart-recovery · Deduplicador de falhas de pagamento', () => {
  it('deduplica entre async_payment_failed e payment_intent.payment_failed (ordem CS -> PI)', () => {
    const dedup = new FailedPaymentDeduplicator(60000);

    // 1. Recebe async_payment_failed com CS e PI
    const primeiro = dedup.shouldProcess(['cs_session_1', 'pi_intent_1']);
    assert.equal(primeiro, true, 'primeiro evento deve ser processado');

    // 2. Recebe payment_intent.payment_failed com o mesmo PI
    const segundo = dedup.shouldProcess(['pi_intent_1']);
    assert.equal(segundo, false, 'segundo evento com mesmo PI deve ser ignorado');
  });

  it('deduplica entre payment_intent.payment_failed e async_payment_failed (ordem PI -> CS)', () => {
    const dedup = new FailedPaymentDeduplicator(60000);

    // 1. Recebe payment_intent.payment_failed primeiro
    const primeiro = dedup.shouldProcess(['pi_intent_2']);
    assert.equal(primeiro, true);

    // 2. Recebe async_payment_failed depois com CS e o mesmo PI
    const segundo = dedup.shouldProcess(['cs_session_2', 'pi_intent_2']);
    assert.equal(segundo, false);
  });

  it('processa eventos independentes com chaves distintas', () => {
    const dedup = new FailedPaymentDeduplicator(60000);

    assert.equal(dedup.shouldProcess(['cs_session_a', 'pi_intent_a']), true);
    assert.equal(dedup.shouldProcess(['cs_session_b', 'pi_intent_b']), true);
  });

  it('deduplica por user_id e product_type cobrindo recusa seguida de expiração com ids diferentes', () => {
    const dedup = new FailedPaymentDeduplicator(60000);

    const primeiraTentativa = dedup.shouldProcess(['pi_recusado_123', 'usr_456:nome_social']);
    assert.equal(primeiraTentativa, true, 'primeira recusa deve ser processada');

    const segundaTentativaExpirada = dedup.shouldProcess(['cs_expirado_999', 'usr_456:nome_social']);
    assert.equal(segundaTentativaExpirada, false, 'mesmo usuário e produto não deve duplicar');
  });
});

describe('cart-recovery · Resolução precisa de payment_method (sem falso positivo Pix)', () => {
  it('identifica cartão recusado mesmo quando payment_method_types aceita pix e card', () => {
    const pi = {
      last_payment_error: {
        payment_method: { type: 'card' },
        message: 'Your card was declined.',
      },
      payment_method_types: ['card', 'pix'],
    };
    assert.equal(resolvePaymentMethodFromIntent(pi), 'card');
  });

  it('identifica pix a partir de charge details ou error code', () => {
    const piPix = {
      charges: {
        data: [{ payment_method_details: { type: 'pix' } }],
      },
      payment_method_types: ['card', 'pix'],
    };
    assert.equal(resolvePaymentMethodFromIntent(piPix), 'pix');

    const piPixExpired = {
      last_payment_error: {
        code: 'payment_intent_payment_attempt_expired',
      },
      payment_method_types: ['card', 'pix'],
    };
    assert.equal(resolvePaymentMethodFromIntent(piPixExpired), 'pix');
  });

  it('não cai em pix quando payment_method_types é dual e não há evidência de pix', () => {
    const piSemDetalhe = {
      payment_method_types: ['card', 'pix'],
    };
    assert.equal(resolvePaymentMethodFromIntent(piSemDetalhe), 'card');
  });
});
