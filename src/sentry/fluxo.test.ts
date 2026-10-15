import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fluxoForPath } from './fluxo';

describe('fluxoForPath', () => {
  it('mapeia os caminhos críticos', () => {
    assert.equal(fluxoForPath('/api/create-checkout'), 'checkout');
    assert.equal(fluxoForPath('/api/stripe-webhook'), 'stripe_webhook');
    assert.equal(fluxoForPath('/api/internal/notify-expiring'), 'notify_expiring');
    assert.equal(fluxoForPath('/api/save-lead'), 'leads');
    assert.equal(fluxoForPath('/obrigado'), 'leads');
    assert.equal(fluxoForPath('/api/analyze'), 'resultado_gratis');
    assert.equal(fluxoForPath('/api/analyze-live'), 'resultado_gratis');
    assert.equal(fluxoForPath('/app/resultado'), 'resultado_gratis');
    assert.equal(fluxoForPath('/app/resultado/abc-123'), 'resultado_gratis');
    assert.equal(fluxoForPath('/api/support/contact'), 'suporte_contato');
  });

  it('aceita barra final e ignora o resto do site', () => {
    assert.equal(fluxoForPath('/api/create-checkout/'), 'checkout');
    assert.equal(fluxoForPath('/app/resultado/'), 'resultado_gratis');
    assert.equal(fluxoForPath('/api/health'), undefined);
    assert.equal(fluxoForPath('/api/create-checkout-session'), undefined);
    assert.equal(fluxoForPath('/app/resultados'), undefined);
    assert.equal(fluxoForPath('/api/analyz'), undefined);
    assert.equal(fluxoForPath('/obrigado/extra'), undefined);
  });
});
