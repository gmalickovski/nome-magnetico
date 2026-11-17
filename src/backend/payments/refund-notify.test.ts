import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { APP_REFUND_SOURCE, buildDashboardRefundPayload, isAppInitiatedRefund } from './refund-notify.ts';

describe('DEV-163 · aviso de reembolso pelo Dashboard do Stripe', () => {
  it('reconhece reembolso iniciado pelo app (não duplica o e-mail)', () => {
    assert.equal(isAppInitiatedRefund({ refunds: { data: [{ id: 're_1', metadata: { source: APP_REFUND_SOURCE } }] } }), true);
    assert.equal(isAppInitiatedRefund({ refunds: { data: [{ id: 're_2', metadata: {} }] } }), false);
    assert.equal(isAppInitiatedRefund({ refunds: { data: [{ id: 're_3' }] } }), false);
    assert.equal(isAppInitiatedRefund({}), false);
  });

  it('monta o mesmo payload de payment.refunded do fluxo do app', () => {
    const p = buildDashboardRefundPayload({
      charge: { amount_refunded: 9800 },
      profile: { email: 'ana@exemplo.com', nome: 'Ana' },
      userId: 'u1',
      productType: 'nome_social',
      productName: 'Nome Social',
      amountPaidCents: 9800,
      skipAdminSlack: false,
    });
    assert.deepEqual(Object.keys(p).sort(), ['amount', 'amount_formatted', 'email', 'firstName', 'productName', 'productType', 'skipAdminSlack', 'userId']);
    assert.equal(p.firstName, 'Ana');
    assert.equal(p.amount, 9800);
    assert.match(p.amount_formatted, /98/);
  });

  it('sem nome usa a parte local do e-mail e, sem valor no Stripe, o valor pago', () => {
    const p = buildDashboardRefundPayload({
      charge: {},
      profile: { email: 'joao@exemplo.com', nome: null },
      userId: 'u2',
      productType: 'nome_social',
      productName: 'Nome Social',
      amountPaidCents: 9800,
      skipAdminSlack: true,
    });
    assert.equal(p.firstName, 'joao');
    assert.equal(p.amount, 9800);
    assert.equal(p.skipAdminSlack, true);
  });
});
