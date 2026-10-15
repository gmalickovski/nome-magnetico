import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ACCESS_PERIOD_MS,
  computeRenewalWindow,
  parsePurchaseKind,
  parseRenewalEtapa,
  renewalProductType,
  renewalUtmCampaign,
  type RenewalEtapa,
  type RenewalSubscriptionSnapshot,
} from './renewal';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-01T15:00:00.000Z');

const CAMPAIGNS: Record<RenewalEtapa, string> = {
  'd-7': 'nmrenovd7',
  'd-2': 'nmrenovd2',
  d0: 'nmrenovd0',
  'd+7': 'nmrenovdp7',
  'd+1': 'nmrenovdp1',
  'd+15': 'nmrenovdp15',
};

function sub(partial: RenewalSubscriptionSnapshot): RenewalSubscriptionSnapshot {
  return partial;
}

describe('renewalUtmCampaign', () => {
  it('mapeia cada etapa para nmrenov sem sinais', () => {
    (Object.keys(CAMPAIGNS) as RenewalEtapa[]).forEach((etapa) => {
      assert.equal(parseRenewalEtapa(etapa), etapa);
      assert.equal(renewalUtmCampaign(etapa), CAMPAIGNS[etapa]);
    });
  });

  it('aceita caixa diferente e o + que o query string vira espaço', () => {
    assert.equal(parseRenewalEtapa('  D-7 '), 'd-7');
    assert.equal(parseRenewalEtapa('d 7'), 'd+7');
    assert.equal(parseRenewalEtapa('d 15'), 'd+15');
    assert.equal(parseRenewalEtapa('d+7'), 'd+7');
    assert.equal(renewalUtmCampaign(parseRenewalEtapa('d 7') as RenewalEtapa), 'nmrenovdp7');
    assert.equal(renewalUtmCampaign(parseRenewalEtapa('D+15') as RenewalEtapa), 'nmrenovdp15');
  });

  it('recusa etapa fora da lista', () => {
    assert.equal(parseRenewalEtapa('d-1'), null);
    assert.equal(parseRenewalEtapa('d7'), null);
    assert.equal(parseRenewalEtapa('dp7'), null);
    assert.equal(parseRenewalEtapa('nmrenovd7'), null);
    assert.equal(parseRenewalEtapa('d7pos'), null);
    assert.equal(parseRenewalEtapa(''), null);
    assert.equal(parseRenewalEtapa(null), null);
  });
});

describe('renewalProductType', () => {
  it('repete o produto da assinatura e cai para nome_social', () => {
    assert.equal(renewalProductType('nome_social'), 'nome_social');
    assert.equal(renewalProductType('nome_bebe'), 'nome_bebe');
    assert.equal(renewalProductType('nome_empresa'), 'nome_empresa');
    assert.equal(renewalProductType(null), 'nome_social');
    assert.equal(renewalProductType('analise_gratuita'), 'nome_social');
  });
});

describe('parsePurchaseKind', () => {
  it('só reconhece renewal; o resto é compra nova', () => {
    assert.equal(parsePurchaseKind('renewal'), 'renewal');
    assert.equal(parsePurchaseKind(' renewal '), 'renewal');
    assert.equal(parsePurchaseKind('new'), 'new');
    assert.equal(parsePurchaseKind('RENEWAL'), 'new');
    assert.equal(parsePurchaseKind(undefined), 'new');
  });
});

describe('computeRenewalWindow', () => {
  it('soma 30 dias ao ends_at vigente, inclusive em compra nova', () => {
    const ends = new Date(NOW.getTime() + 9 * DAY + 3 * 60 * 60 * 1000);
    const window = computeRenewalWindow({
      now: NOW,
      purchaseKind: 'new',
      subscriptions: [
        sub({
          id: 'sub-ativa',
          endsAt: ends,
          createdAt: '2026-09-01T00:00:00.000Z',
        }),
      ],
    });

    assert.equal(window.purchaseKind, 'new');
    assert.equal(window.renewedFrom, 'sub-ativa');
    assert.equal(window.startsAt.toISOString(), ends.toISOString());
    assert.equal(window.endsAt.getTime(), ends.getTime() + ACCESS_PERIOD_MS);
    assert.equal(window.endsAt.getTime() - NOW.getTime(), ends.getTime() - NOW.getTime() + ACCESS_PERIOD_MS);
    assert.equal(ACCESS_PERIOD_MS, 30 * DAY);
  });

  it('renovação com acesso vigente estende a linha de maior ends_at', () => {
    const early = new Date(NOW.getTime() + 2 * DAY);
    const late = new Date(NOW.getTime() + 12 * DAY);
    const window = computeRenewalWindow({
      now: NOW,
      purchaseKind: 'renewal',
      subscriptions: [
        sub({ id: 'early', endsAt: early, createdAt: '2026-09-01T00:00:00.000Z' }),
        sub({ id: 'late', endsAt: late, createdAt: '2026-09-02T00:00:00.000Z' }),
      ],
    });

    assert.equal(window.purchaseKind, 'renewal');
    assert.equal(window.renewedFrom, 'late');
    assert.equal(window.startsAt.toISOString(), late.toISOString());
    assert.equal(window.endsAt.getTime(), late.getTime() + ACCESS_PERIOD_MS);
  });

  it('ignora reembolsada mesmo com ends_at mais distante', () => {
    const realEnds = new Date(NOW.getTime() + 5 * DAY);
    const window = computeRenewalWindow({
      now: NOW,
      purchaseKind: 'renewal',
      subscriptions: [
        sub({
          id: 'reembolsada',
          endsAt: new Date(NOW.getTime() + 40 * DAY),
          createdAt: '2026-09-20T00:00:00.000Z',
          refundedAt: '2026-09-21T00:00:00.000Z',
        }),
        sub({
          id: 'vigente',
          endsAt: realEnds,
          createdAt: '2026-09-01T00:00:00.000Z',
        }),
      ],
    });

    assert.equal(window.renewedFrom, 'vigente');
    assert.equal(window.startsAt.toISOString(), realEnds.toISOString());
  });

  it('renovação sem acesso vigente aponta a assinatura mais recente e começa agora', () => {
    const window = computeRenewalWindow({
      now: NOW,
      purchaseKind: 'renewal',
      subscriptions: [
        sub({
          id: 'older',
          endsAt: '2026-08-01T00:00:00.000Z',
          createdAt: '2026-07-01T00:00:00.000Z',
        }),
        sub({
          id: 'newer',
          endsAt: '2026-09-01T00:00:00.000Z',
          createdAt: '2026-08-15T00:00:00.000Z',
        }),
      ],
    });

    assert.equal(window.startsAt.toISOString(), NOW.toISOString());
    assert.equal(window.endsAt.getTime(), NOW.getTime() + ACCESS_PERIOD_MS);
    assert.equal(window.renewedFrom, 'newer');
  });

  it('ends_at igual a now não está vigente; renewal ainda grava renewed_from', () => {
    const window = computeRenewalWindow({
      now: NOW,
      purchaseKind: 'renewal',
      subscriptions: [
        sub({
          id: 'expira-agora',
          endsAt: NOW.toISOString(),
          createdAt: '2026-09-01T00:00:00.000Z',
        }),
      ],
    });

    assert.equal(window.startsAt.toISOString(), NOW.toISOString());
    assert.equal(window.renewedFrom, 'expira-agora');
  });

  it('compra nova sem acesso vigente não preenche renewed_from', () => {
    const window = computeRenewalWindow({
      now: NOW,
      purchaseKind: 'new',
      subscriptions: [
        sub({
          id: 'expirada',
          endsAt: '2026-09-01T00:00:00.000Z',
          createdAt: '2026-08-01T00:00:00.000Z',
        }),
      ],
    });

    assert.equal(window.purchaseKind, 'new');
    assert.equal(window.renewedFrom, null);
    assert.equal(window.startsAt.toISOString(), NOW.toISOString());
    assert.equal(window.endsAt.getTime(), NOW.getTime() + ACCESS_PERIOD_MS);
  });

  it('renovação sem histórico começa agora e renewed_from fica nulo', () => {
    const window = computeRenewalWindow({
      now: NOW,
      purchaseKind: 'renewal',
      subscriptions: [],
    });

    assert.equal(window.renewedFrom, null);
    assert.equal(window.startsAt.toISOString(), NOW.toISOString());
    assert.equal(window.endsAt.getTime() - window.startsAt.getTime(), ACCESS_PERIOD_MS);
  });

  it('com acesso vigente, renewed_from é essa linha e não a mais recente já expirada', () => {
    const late = new Date(NOW.getTime() + 12 * DAY);
    const window = computeRenewalWindow({
      now: NOW,
      purchaseKind: 'renewal',
      subscriptions: [
        sub({
          id: 'ativa-antiga',
          endsAt: late,
          createdAt: '2026-08-01T00:00:00.000Z',
        }),
        sub({
          id: 'expirada-recente',
          endsAt: '2026-09-01T00:00:00.000Z',
          createdAt: '2026-09-15T00:00:00.000Z',
        }),
      ],
    });

    assert.equal(window.renewedFrom, 'ativa-antiga');
    assert.equal(window.startsAt.toISOString(), late.toISOString());
  });

  it('empate de ends_at usa a assinatura criada por último', () => {
    const ends = new Date(NOW.getTime() + 4 * DAY);
    const window = computeRenewalWindow({
      now: NOW,
      purchaseKind: 'renewal',
      subscriptions: [
        sub({ id: 'nova', endsAt: ends, createdAt: '2026-09-10T00:00:00.000Z' }),
        sub({ id: 'antiga', endsAt: ends, createdAt: '2026-09-01T00:00:00.000Z' }),
      ],
    });

    assert.equal(window.renewedFrom, 'nova');
    assert.equal(window.startsAt.toISOString(), ends.toISOString());
  });

  it('não altera o Date de now recebido', () => {
    const now = new Date(NOW.getTime());
    computeRenewalWindow({ now, purchaseKind: 'new', subscriptions: [] });
    assert.equal(now.toISOString(), NOW.toISOString());
  });
});
