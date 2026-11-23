import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readLinkedCoupon, withLinkedCoupon } from './checkout-coupon-link';

test('reconhece cupom e alias, com precedência do parâmetro em português', () => {
  assert.equal(readLinkedCoupon(new URLSearchParams('cupom=+c-01+&coupon=c-02')), 'C-01');
  assert.equal(readLinkedCoupon(new URLSearchParams('cupom=+&coupon=c-02')), 'C-02');
  assert.equal(readLinkedCoupon(new URLSearchParams('code=TRIAL')), '');
});

test('preserva o cupom como dado no retorno da autenticação', () => {
  const path = '/comprar?produto=nome_social&checkout=1';
  const params = new URLSearchParams({ coupon: 'c&checkout=2' });
  const returnPath = withLinkedCoupon(path, params);
  const url = new URL(returnPath, 'https://example.com');

  assert.equal(url.searchParams.get('checkout'), '1');
  assert.equal(url.searchParams.get('cupom'), 'C&CHECKOUT=2');
  assert.equal(withLinkedCoupon(path, new URLSearchParams()), path);
});
