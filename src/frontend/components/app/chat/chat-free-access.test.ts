import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isCheckoutSuccessReturn,
  pollProductAccessActive,
  resolveChatPhaseFromSession,
} from './chat-free-access.ts';

describe('resolveChatPhaseFromSession', () => {
  it('nunca restaura subscriber só do localStorage', () => {
    assert.equal(
      resolveChatPhaseFromSession(false, 'subscriber', true),
      'free_paywall'
    );
  });

  it('libera subscriber só com acesso do servidor', () => {
    assert.equal(
      resolveChatPhaseFromSession(true, 'free_paywall', true),
      'subscriber'
    );
  });
});

describe('isCheckoutSuccessReturn', () => {
  it('detecta checkout=success para nome_social', () => {
    assert.equal(
      isCheckoutSuccessReturn(new URLSearchParams('checkout=success&produto=nome_social')),
      true
    );
  });

  it('não trata checkout=cancel como sucesso', () => {
    assert.equal(isCheckoutSuccessReturn(new URLSearchParams('checkout=cancel')), false);
  });
});

describe('pollProductAccessActive', () => {
  it('para na primeira confirmação do servidor', async () => {
    let calls = 0;
    const ok = await pollProductAccessActive(async () => {
      calls++;
      return calls >= 2;
    }, [100], { sleep: async () => {} });
    assert.equal(ok, true);
    assert.equal(calls, 2);
  });

  it('retorna false se o servidor nunca confirmar', async () => {
    const ok = await pollProductAccessActive(async () => false, [1, 1], {
      sleep: async () => {},
    });
    assert.equal(ok, false);
  });
});
