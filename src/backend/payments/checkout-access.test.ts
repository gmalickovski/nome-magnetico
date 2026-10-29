import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  checkoutAlreadyActiveMessage,
  productAnalysisAppPath,
  shouldBlockCheckoutForActiveProduct,
} from './checkout-access';

describe('checkout-access', () => {
  it('bloqueia compra nova quando já há produto ativo', () => {
    assert.equal(shouldBlockCheckoutForActiveProduct(false, true), true);
    assert.equal(shouldBlockCheckoutForActiveProduct(true, true), false);
    assert.equal(shouldBlockCheckoutForActiveProduct(false, false), false);
  });

  it('mensagem e caminho para nome_social', () => {
    assert.match(checkoutAlreadyActiveMessage('nome_social'), /Nome Social/);
    assert.equal(productAnalysisAppPath('nome_social'), '/app/analise/nome-social');
  });
});
