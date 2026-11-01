import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isChatResumeReturn,
  isCheckoutSuccessReturn,
  pollChatResumePaid,
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

describe('pollChatResumePaid · DEV-261', () => {
  it('detecta resume=1 somente junto de checkout=success', () => {
    assert.equal(
      isChatResumeReturn(new URLSearchParams('checkout=success&produto=nome_social&resume=1')),
      true
    );
    assert.equal(isChatResumeReturn(new URLSearchParams('resume=1')), false);
  });

  it('com resume=1 na URL mas paid: false no servidor, nunca libera chatPhase nem choice', async () => {
    let calls = 0;
    const result = await pollChatResumePaid(
      async () => {
        calls++;
        return { paid: false };
      },
      [1, 1],
      { sleep: async () => {} }
    );

    assert.equal(result.paid, false);
    assert.equal(result.choice, undefined);
    assert.equal(calls, 3);
    assert.equal(
      resolveChatPhaseFromSession(result.paid, 'subscriber', true),
      'free_paywall'
    );
  });

  it('retorna paid: true e choice assim que o servidor confirma', async () => {
    let calls = 0;
    const result = await pollChatResumePaid(
      async () => {
        calls++;
        if (calls < 2) return { paid: false };
        return {
          paid: true,
          choice: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            analysis_id: null,
            chosen_signature: 'Maria Clara Luz',
            source: 'card_pdf',
            pdf_generated: false,
          },
        };
      },
      [10, 20],
      { sleep: async () => {} }
    );

    assert.equal(result.paid, true);
    assert.equal(result.choice?.chosen_signature, 'Maria Clara Luz');
    assert.equal(calls, 2);
  });
});
