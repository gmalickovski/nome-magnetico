import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildAccessAttributesPayload,
  type AccessAttributesPayload,
  type AccessAttributesSubscription,
  type BuildAccessAttributesInput,
} from './access-attributes-payload';

const PAYLOAD_KEYS = [
  'email',
  'nome',
  'sobrenome',
  'user_id',
  'origem',
  'product_type',
  'purchase_kind',
  'valor',
  'attributes',
  'opt_in',
] as const satisfies readonly (keyof AccessAttributesPayload)[];

const ATTRIBUTE_KEYS = [
  'ACESSO_INICIO',
  'ACESSO_FIM',
  'PRODUTO',
  'RENOVACOES',
  'STATUS_ACESSO',
] as const satisfies readonly (keyof AccessAttributesPayload['attributes'])[];

function sub(partial: AccessAttributesSubscription): AccessAttributesSubscription {
  return {
    productType: 'nome_social',
    refundedAt: null,
    purchaseKind: 'new',
    renewedFrom: null,
    ...partial,
  };
}

function build(overrides: Partial<BuildAccessAttributesInput> & Pick<BuildAccessAttributesInput, 'subscriptions' | 'origem'>): AccessAttributesPayload {
  return buildAccessAttributesPayload({
    email: 'cliente@email.com',
    nomeCompleto: 'Maria da Silva',
    userId: 'user-1',
    productType: 'nome_social',
    purchaseKind: 'new',
    amountPaidCents: 9800,
    subscriptionId: 'sub-new',
    subscriptionStartsAt: '2026-01-16T02:59:59.000Z',
    subscriptionEndsAt: '2026-02-15T02:59:59.000Z',
    now: new Date('2026-01-20T15:00:00.000Z'),
    optIn: false,
    ...overrides,
  });
}

describe('buildAccessAttributesPayload', () => {
  it('formata o dia civil de São Paulo perto da meia-noite UTC', () => {
    const beforeMidnight = build({
      origem: 'compra',
      email: '  Ana@Example.COM ',
      nomeCompleto: '  Maria   da   Silva Santos  ',
      userId: ' user-1 ',
      optIn: true,
      subscriptions: [
        sub({
          id: 'sub-new',
          startsAt: '2026-01-16T02:59:59.000Z',
          endsAt: '2026-02-15T02:59:59.000Z',
        }),
      ],
    });

    assert.deepEqual(beforeMidnight, {
      email: 'ana@example.com',
      nome: 'Maria',
      sobrenome: 'da Silva Santos',
      user_id: 'user-1',
      origem: 'compra',
      product_type: 'nome_social',
      purchase_kind: 'new',
      valor: 98,
      attributes: {
        ACESSO_INICIO: '2026-01-15',
        ACESSO_FIM: '2026-02-14',
        PRODUTO: 'nome_social',
        RENOVACOES: 0,
        STATUS_ACESSO: 'ativo',
      },
      opt_in: true,
    });
    assert.deepEqual(Object.keys(beforeMidnight), [...PAYLOAD_KEYS]);
    assert.deepEqual(Object.keys(beforeMidnight.attributes), [...ATTRIBUTE_KEYS]);

    const atMidnight = build({
      origem: 'compra',
      subscriptionStartsAt: '2026-01-16T03:00:00.000Z',
      subscriptionEndsAt: '2026-02-15T03:00:00.000Z',
      subscriptions: [
        sub({
          id: 'sub-new',
          startsAt: '2026-01-16T03:00:00.000Z',
          endsAt: '2026-02-15T03:00:00.000Z',
        }),
      ],
    });

    assert.equal(atMidnight.attributes.ACESSO_INICIO, '2026-01-16');
    assert.equal(atMidnight.attributes.ACESSO_FIM, '2026-02-15');
    assert.equal(atMidnight.attributes.STATUS_ACESSO, 'ativo');
  });

  it('separa nome e sobrenome e deixa sobrenome vazio quando há uma palavra só', () => {
    const composto = build({
      origem: 'compra',
      nomeCompleto: '  Ana   Paula  ',
      subscriptions: [sub({ id: 'sub-new', startsAt: '2026-03-01T15:00:00.000Z', endsAt: '2026-03-31T15:00:00.000Z' })],
    });
    const simples = build({
      origem: 'compra',
      nomeCompleto: 'João',
      subscriptions: [sub({ id: 'sub-new', startsAt: '2026-03-01T15:00:00.000Z', endsAt: '2026-03-31T15:00:00.000Z' })],
    });
    const vazio = build({
      origem: 'compra',
      nomeCompleto: '   ',
      subscriptions: [sub({ id: 'sub-new', startsAt: '2026-03-01T15:00:00.000Z', endsAt: '2026-03-31T15:00:00.000Z' })],
    });

    assert.equal(composto.nome, 'Ana');
    assert.equal(composto.sobrenome, 'Paula');
    assert.equal(simples.nome, 'João');
    assert.equal(simples.sobrenome, '');
    assert.equal(vazio.nome, '');
    assert.equal(vazio.sobrenome, '');
  });

  it('na renovação o início é a raiz da cadeia e o fim é o maior ends_at do produto', () => {
    const payload = build({
      origem: 'compra',
      purchaseKind: 'renewal',
      amountPaidCents: 1050,
      subscriptionId: 'sub-b',
      subscriptionStartsAt: '2026-05-31T02:30:00.000Z',
      subscriptionEndsAt: '2026-06-30T02:30:00.000Z',
      now: new Date('2026-06-01T12:00:00.000Z'),
      optIn: false,
      subscriptions: [
        sub({
          id: 'old',
          startsAt: '2025-01-01T15:00:00.000Z',
          endsAt: '2025-02-01T15:00:00.000Z',
        }),
        sub({
          id: 'sub-a',
          startsAt: '2026-05-01T02:30:00.000Z',
          endsAt: '2026-05-31T02:30:00.000Z',
        }),
        sub({
          id: 'sub-b',
          startsAt: '2026-05-31T02:30:00.000Z',
          endsAt: '2026-06-30T02:30:00.000Z',
          purchaseKind: 'renewal',
          renewedFrom: 'sub-a',
        }),
        sub({
          id: 'outro-produto',
          productType: 'nome_bebe',
          startsAt: '2026-01-01T12:00:00.000Z',
          endsAt: '2026-08-01T12:00:00.000Z',
          purchaseKind: 'renewal',
        }),
        sub({
          id: 'refunded-renewal',
          startsAt: '2026-04-01T12:00:00.000Z',
          endsAt: '2026-05-01T12:00:00.000Z',
          purchaseKind: 'renewal',
          refundedAt: '2026-04-02T12:00:00.000Z',
        }),
      ],
    });

    assert.equal(payload.origem, 'compra');
    assert.equal(payload.purchase_kind, 'renewal');
    assert.equal(payload.valor, 10.5);
    assert.equal(payload.opt_in, false);
    assert.equal(payload.attributes.ACESSO_INICIO, '2026-04-30');
    assert.equal(payload.attributes.ACESSO_FIM, '2026-06-29');
    assert.equal(payload.attributes.PRODUTO, 'nome_social');
    assert.equal(payload.attributes.RENOVACOES, 2);
    assert.equal(payload.attributes.STATUS_ACESSO, 'ativo');
  });

  it('ignora a raiz reembolsada e usa o starts_at da assinatura nova da cadeia', () => {
    const payload = build({
      origem: 'compra',
      purchaseKind: 'renewal',
      subscriptionId: 'sub-b',
      subscriptionStartsAt: '2026-05-31T02:30:00.000Z',
      subscriptionEndsAt: '2026-06-30T02:30:00.000Z',
      now: new Date('2026-06-01T12:00:00.000Z'),
      subscriptions: [
        sub({
          id: 'sub-a',
          startsAt: '2026-05-01T02:30:00.000Z',
          endsAt: '2026-05-31T02:30:00.000Z',
          refundedAt: '2026-05-02T12:00:00.000Z',
        }),
        sub({
          id: 'sub-b',
          startsAt: '2026-05-31T02:30:00.000Z',
          endsAt: '2026-06-30T02:30:00.000Z',
          purchaseKind: 'renewal',
          renewedFrom: 'sub-a',
        }),
      ],
    });

    assert.equal(payload.attributes.ACESSO_INICIO, '2026-05-30');
    assert.equal(payload.attributes.ACESSO_FIM, '2026-06-29');
    assert.equal(payload.attributes.RENOVACOES, 1);
    assert.equal(payload.attributes.STATUS_ACESSO, 'ativo');
  });

  it('no reembolso com acesso restante mantém ativo e recalcula o fim', () => {
    const payload = build({
      origem: 'reembolso',
      purchaseKind: 'renewal',
      amountPaidCents: 9800,
      subscriptionId: 'sub-b',
      subscriptionStartsAt: '2026-05-31T02:30:00.000Z',
      subscriptionEndsAt: '2026-05-10T15:00:00.000Z',
      now: new Date('2026-05-10T15:00:00.000Z'),
      optIn: true,
      subscriptions: [
        sub({
          id: 'sub-a',
          startsAt: '2026-05-01T02:30:00.000Z',
          endsAt: '2026-05-31T02:30:00.000Z',
        }),
        sub({
          id: 'sub-b',
          startsAt: '2026-05-31T02:30:00.000Z',
          endsAt: '2026-05-10T15:00:00.000Z',
          purchaseKind: 'renewal',
          renewedFrom: 'sub-a',
          refundedAt: '2026-05-10T15:00:00.000Z',
        }),
        sub({
          id: 'outro',
          productType: 'nome_bebe',
          startsAt: '2026-01-01T12:00:00.000Z',
          endsAt: '2026-12-01T12:00:00.000Z',
          purchaseKind: 'renewal',
        }),
      ],
    });

    assert.equal(payload.origem, 'reembolso');
    assert.equal(payload.purchase_kind, 'renewal');
    assert.equal(payload.valor, 98);
    assert.equal(payload.opt_in, true);
    assert.equal(payload.attributes.STATUS_ACESSO, 'ativo');
    assert.equal(payload.attributes.ACESSO_INICIO, '2026-04-30');
    assert.equal(payload.attributes.ACESSO_FIM, '2026-05-30');
    assert.equal(payload.attributes.RENOVACOES, 1);
  });

  it('no reembolso sem acesso vigente marca reembolsado', () => {
    const onlyRefunded = build({
      origem: 'reembolso',
      purchaseKind: 'new',
      amountPaidCents: null,
      subscriptionId: 'sub-new',
      subscriptionStartsAt: '2026-05-01T02:30:00.000Z',
      subscriptionEndsAt: '2026-05-10T15:00:00.000Z',
      now: new Date('2026-05-10T15:00:00.000Z'),
      subscriptions: [
        sub({
          id: 'sub-new',
          startsAt: '2026-05-01T02:30:00.000Z',
          endsAt: '2026-05-10T15:00:00.000Z',
          refundedAt: '2026-05-10T15:00:00.000Z',
        }),
      ],
    });

    assert.equal(onlyRefunded.valor, null);
    assert.equal(onlyRefunded.attributes.STATUS_ACESSO, 'reembolsado');
    assert.equal(onlyRefunded.attributes.ACESSO_INICIO, '2026-04-30');
    assert.equal(onlyRefunded.attributes.ACESSO_FIM, '2026-05-10');
    assert.equal(onlyRefunded.attributes.RENOVACOES, 0);

    const expiredPredecessor = build({
      origem: 'reembolso',
      purchaseKind: 'renewal',
      subscriptionId: 'sub-b',
      subscriptionStartsAt: '2026-05-31T02:30:00.000Z',
      subscriptionEndsAt: '2026-06-10T15:00:00.000Z',
      now: new Date('2026-06-10T15:00:00.000Z'),
      subscriptions: [
        sub({
          id: 'sub-a',
          startsAt: '2026-05-01T02:30:00.000Z',
          endsAt: '2026-05-31T02:30:00.000Z',
        }),
        sub({
          id: 'sub-b',
          startsAt: '2026-05-31T02:30:00.000Z',
          endsAt: '2026-06-10T15:00:00.000Z',
          purchaseKind: 'renewal',
          renewedFrom: 'sub-a',
          refundedAt: '2026-06-10T15:00:00.000Z',
        }),
      ],
    });

    assert.equal(expiredPredecessor.attributes.STATUS_ACESSO, 'reembolsado');
    assert.equal(expiredPredecessor.attributes.ACESSO_INICIO, '2026-04-30');
    assert.equal(expiredPredecessor.attributes.ACESSO_FIM, '2026-05-30');
    assert.equal(expiredPredecessor.attributes.RENOVACOES, 0);
  });
});
