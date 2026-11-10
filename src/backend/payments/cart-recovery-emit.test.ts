import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { MOTIVO_CART_ABANDONED } from './cart-recovery';

let hasActive = false;
let claimResult = true;
const notifyCalls: { event: string; payload: Record<string, unknown> }[] = [];

mock.module('../db/subscriptions', {
  namedExports: {
    hasActiveSubscription: async () => hasActive,
  },
});

mock.module('../db/cart-recovery-sends', {
  namedExports: {
    claimCartRecoverySend: async () => claimResult,
  },
});

mock.module('../pricing/service', {
  namedExports: {
    getEffectivePriceCore: async () => ({
      final_cents: 9700,
      base_cents: 9700,
      min_cents: 0,
      discountSource: 'none',
    }),
  },
});

mock.module('../notifications/notify', {
  namedExports: {
    notify: async (event: string, payload: Record<string, unknown>) => {
      notifyCalls.push({ event, payload });
      return true;
    },
  },
});

const { emitCartAbandonedIfEligible, isRecoveryCheckout } = await import('./cart-recovery-emit');

describe('cart-recovery-emit · loop guard metadata', () => {
  it('identifica sessão de recuperação', () => {
    assert.equal(isRecoveryCheckout({ recovery: '1' }), true);
    assert.equal(isRecoveryCheckout({ recovery: '0' }), false);
    assert.equal(isRecoveryCheckout({}), false);
    assert.equal(isRecoveryCheckout(null), false);
  });
});

describe('cart-recovery-emit · emissão cart.abandoned', () => {
  beforeEach(() => {
    hasActive = false;
    claimResult = true;
    notifyCalls.length = 0;
  });

  const baseProfile = { email: 'user@example.com', nome: null as string | null };
  const resolveUrl = async () => 'https://checkout.stripe.com/pay/cs_test_recovery';

  it('emite cart.abandoned para nome_social com firstName vazio', async () => {
    const result = await emitCartAbandonedIfEligible({
      userId: 'user-1',
      productType: 'nome_social',
      profile: baseProfile,
      paymentId: 'cs_abc',
      reasonType: 'expired',
      paymentMethod: 'pix',
      motivo: MOTIVO_CART_ABANDONED.pix_expired,
      sessionMetadata: { final_cents: '9700' },
      amountTotalCents: 9700,
      resolveRecoveryCheckoutUrl: resolveUrl,
    });

    assert.equal(result, 'emitted');
    assert.equal(notifyCalls.length, 1);
    assert.equal(notifyCalls[0]?.event, 'cart.abandoned');
    assert.equal(notifyCalls[0]?.payload.firstName, '');
    assert.equal(notifyCalls[0]?.payload.user_id, 'user-1');
    assert.equal(notifyCalls[0]?.payload.product_type, 'nome_social');
  });

  it('não emite se já possui assinatura ativa', async () => {
    hasActive = true;
    const result = await emitCartAbandonedIfEligible({
      userId: 'user-1',
      productType: 'nome_social',
      profile: baseProfile,
      paymentId: 'cs_abc',
      reasonType: 'expired',
      motivo: MOTIVO_CART_ABANDONED.checkout_expired,
      sessionMetadata: { final_cents: '9700' },
      resolveRecoveryCheckoutUrl: resolveUrl,
    });

    assert.equal(result, 'skipped');
    assert.equal(notifyCalls.length, 0);
  });

  it('não emite se dedup persistente já reservou (duplicate)', async () => {
    claimResult = false;
    const result = await emitCartAbandonedIfEligible({
      userId: 'user-1',
      productType: 'nome_social',
      profile: baseProfile,
      paymentId: 'cs_abc',
      reasonType: 'expired',
      motivo: MOTIVO_CART_ABANDONED.checkout_expired,
      sessionMetadata: { final_cents: '9700' },
      resolveRecoveryCheckoutUrl: resolveUrl,
    });

    assert.equal(result, 'skipped');
    assert.equal(notifyCalls.length, 0);
  });

  it('não emite para produto fora do escopo (nome_bebe)', async () => {
    const result = await emitCartAbandonedIfEligible({
      userId: 'user-1',
      productType: 'nome_bebe',
      profile: baseProfile,
      paymentId: 'cs_abc',
      reasonType: 'expired',
      motivo: MOTIVO_CART_ABANDONED.checkout_expired,
      sessionMetadata: { final_cents: '9700' },
      resolveRecoveryCheckoutUrl: resolveUrl,
    });

    assert.equal(result, 'skipped');
    assert.equal(notifyCalls.length, 0);
  });

  it('fail closed quando claim falha no banco', async () => {
    claimResult = false;
    await emitCartAbandonedIfEligible({
      userId: 'user-1',
      productType: 'nome_social',
      profile: { email: 'user@example.com', nome: 'Ana' },
      paymentId: 'pi_declined',
      reasonType: 'declined',
      paymentMethod: 'card',
      motivo: MOTIVO_CART_ABANDONED.card_declined,
      sessionMetadata: { final_cents: '9700' },
      resolveRecoveryCheckoutUrl: resolveUrl,
    });
    assert.equal(notifyCalls.length, 0);
  });
});
