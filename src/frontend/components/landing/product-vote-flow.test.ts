import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VOTE_INTRO_COPY,
  VOTE_UNKNOWN_RESULT,
  failureFromNetwork,
  failureFromResponse,
  submitVote,
} from './product-vote-flow.ts';

/** DEV-316 · fluxo do voto. Sem rede e sem votar de verdade. */

const resposta = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('DEV-316 · copy', () => {
  it('usa o texto pedido, sem travessão', () => {
    assert.equal(VOTE_INTRO_COPY, 'Escolha uma opção e confirme seu voto. Não precisa de cadastro.');
    assert.doesNotMatch(VOTE_INTRO_COPY + VOTE_UNKNOWN_RESULT, /[—–]/);
  });
});

describe('DEV-316 · envio do voto', () => {
  it('sucesso: um POST sem cookies, só com a opção, e o evento depois da confirmação', async () => {
    const chamadas: Array<{ url: string; init: RequestInit }> = [];
    const ordem: string[] = [];
    const r = await submitVote('nome_bebe', {
      fetchImpl: (async (url: string, init: RequestInit) => {
        chamadas.push({ url, init });
        ordem.push('fetch');
        return resposta(200, { ok: true });
      }) as unknown as typeof fetch,
      onSuccessEvent: (o) => ordem.push(`evento:${o}`),
    });
    assert.deepEqual(r, { ok: true });
    assert.equal(chamadas.length, 1);
    assert.equal(chamadas[0]!.url, '/api/product-vote');
    assert.equal(chamadas[0]!.init.credentials, 'omit');
    assert.deepEqual(JSON.parse(String(chamadas[0]!.init.body)), { option: 'nome_bebe' });
    assert.deepEqual(ordem, ['fetch', 'evento:nome_bebe']);
  });

  it('erro da API: sem evento, falha "rejected" com a mensagem da API', async () => {
    let evento = 0;
    const r = await submitVote('outro', {
      fetchImpl: (async () => resposta(400, { error: 'Opção de voto inválida.' })) as unknown as typeof fetch,
      onSuccessEvent: () => { evento++; },
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.failure.kind, 'rejected');
      assert.equal(r.failure.message, 'Opção de voto inválida.');
    }
    assert.equal(evento, 0);
  });

  it('resposta perdida (rede): resultado desconhecido, sem evento e sem prometer retry seguro', async () => {
    let evento = 0;
    const r = await submitVote('nome_empresa', {
      fetchImpl: (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch,
      onSuccessEvent: () => { evento++; },
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.failure.kind, 'unknown');
      assert.match(r.failure.message, /mais de uma vez/);
    }
    assert.equal(evento, 0);
    assert.equal(failureFromNetwork().kind, 'unknown');
  });

  it('falha do analytics não desfaz o voto confirmado', async () => {
    const r = await submitVote('outro', {
      fetchImpl: (async () => resposta(200, { ok: true })) as unknown as typeof fetch,
      onSuccessEvent: () => { throw new Error('posthog caiu'); },
    });
    assert.deepEqual(r, { ok: true });
  });

  it('limite de votos (429) devolve mensagem clara', () => {
    const f = failureFromResponse(429, {});
    assert.equal(f.kind, 'rejected');
    assert.match(f.message, /mais tarde/);
    assert.match(failureFromResponse(500, null).message, /Tente de novo/);
  });
});
