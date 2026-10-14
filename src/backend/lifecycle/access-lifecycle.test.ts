import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renewalUtmCampaign, RENEWAL_ETAPAS, type RenewalEtapa } from '../payments/renewal';
import {
  acessoStatus,
  addCalendarDays,
  buildAccessLifecyclePayload,
  buildRenewUrl,
  daysLeftInSaoPaulo,
  decideLifecycle,
  hasLaterSameProductSubscription,
  lifecycleQueryWindows,
  lifecycleVariant,
  maskEmail,
  matchingEtapas,
  passesStageActivityRule,
  saoPauloDayBounds,
  saoPauloISODate,
  shouldActuallySend,
  shouldSkipRenewed,
  type LifecycleSubscriptionRef,
} from './access-lifecycle';

const DAY = 24 * 60 * 60 * 1000;

function ref(partial: LifecycleSubscriptionRef): LifecycleSubscriptionRef {
  return partial;
}

describe('dia civil em America/Sao_Paulo', () => {
  it('não vira o dia entre 21h e 03h UTC', () => {
    const evening = new Date('2026-01-15T21:00:00.000Z');
    const afterUtcMidnight = new Date('2026-01-16T00:30:00.000Z');
    const stillPrevious = new Date('2026-01-16T02:59:59.000Z');
    const spMidnight = new Date('2026-01-16T03:00:00.000Z');

    assert.equal(saoPauloISODate(evening), '2026-01-15');
    assert.equal(saoPauloISODate(afterUtcMidnight), '2026-01-15');
    assert.equal(saoPauloISODate(stillPrevious), '2026-01-15');
    assert.equal(saoPauloISODate(spMidnight), '2026-01-16');

    const bounds = saoPauloDayBounds('2026-01-15');
    assert.equal(bounds.start.toISOString(), '2026-01-15T03:00:00.000Z');
    assert.equal(bounds.end.toISOString(), '2026-01-16T03:00:00.000Z');
    assert.ok(afterUtcMidnight >= bounds.start && afterUtcMidnight < bounds.end);
    assert.ok(stillPrevious < bounds.end);
    assert.ok(spMidnight >= bounds.end);
  });

  it('marca d0 pelo dia de ends_at em SP, inclusive quando o UTC já virou', () => {
    const endsAt = new Date('2026-01-16T02:00:00.000Z');
    const startsAt = new Date(endsAt.getTime() - 30 * DAY);
    assert.equal(saoPauloISODate(endsAt), '2026-01-15');

    const onEvening = matchingEtapas({
      now: new Date('2026-01-15T21:00:00.000Z'),
      startsAt,
      endsAt,
    });
    const afterUtcMidnight = matchingEtapas({
      now: new Date('2026-01-16T00:30:00.000Z'),
      startsAt,
      endsAt,
    });
    const nextSpDay = matchingEtapas({
      now: new Date('2026-01-16T03:00:00.000Z'),
      startsAt,
      endsAt,
    });

    assert.deepEqual(onEvening, ['d0']);
    assert.deepEqual(afterUtcMidnight, ['d0']);
    assert.deepEqual(nextSpDay, []);
    assert.equal(daysLeftInSaoPaulo(new Date('2026-01-16T00:30:00.000Z'), endsAt), 0);
    assert.equal(daysLeftInSaoPaulo(new Date('2026-01-16T03:00:00.000Z'), endsAt), -1);
    assert.equal(acessoStatus(0), 'expirado');
    assert.equal(acessoStatus(-7), 'expirado');
    assert.equal(acessoStatus(2), 'ativo');
  });

  it('marca d+1 no dia seguinte ao starts_at em SP, não no dia UTC', () => {
    const startsAt = new Date('2026-05-01T02:30:00.000Z');
    const endsAt = new Date(startsAt.getTime() + 30 * DAY);
    assert.equal(saoPauloISODate(startsAt), '2026-04-30');

    assert.deepEqual(
      matchingEtapas({ now: new Date('2026-05-01T21:00:00.000Z'), startsAt, endsAt }),
      ['d+1'],
    );
    assert.deepEqual(
      matchingEtapas({ now: new Date('2026-05-02T00:30:00.000Z'), startsAt, endsAt }),
      ['d+1'],
    );
    assert.deepEqual(
      matchingEtapas({ now: new Date('2026-05-02T03:00:00.000Z'), startsAt, endsAt }),
      [],
    );

    const startedAfternoon = new Date('2026-05-01T15:00:00.000Z');
    const endsLater = new Date(startedAfternoon.getTime() + 30 * DAY);
    assert.deepEqual(
      matchingEtapas({ now: new Date('2026-05-02T02:00:00.000Z'), startsAt: startedAfternoon, endsAt: endsLater }),
      [],
    );
    assert.deepEqual(
      matchingEtapas({ now: new Date('2026-05-02T03:00:00.000Z'), startsAt: startedAfternoon, endsAt: endsLater }),
      ['d+1'],
    );
  });

  it('calcula d-7, d-2, d+7 e d+15 pelo calendário de SP', () => {
    const startsAt = new Date('2026-03-01T15:00:00.000Z');
    const endsAt = new Date('2026-03-31T15:00:00.000Z');
    assert.equal(saoPauloISODate(startsAt), '2026-03-01');
    assert.equal(saoPauloISODate(endsAt), '2026-03-31');

    assert.deepEqual(matchingEtapas({ now: new Date('2026-03-16T15:00:00.000Z'), startsAt, endsAt }), ['d+15']);
    assert.deepEqual(matchingEtapas({ now: new Date('2026-03-24T15:00:00.000Z'), startsAt, endsAt }), ['d-7']);
    assert.deepEqual(matchingEtapas({ now: new Date('2026-03-29T15:00:00.000Z'), startsAt, endsAt }), ['d-2']);
    assert.deepEqual(matchingEtapas({ now: new Date('2026-04-07T15:00:00.000Z'), startsAt, endsAt }), ['d+7']);
    assert.equal(daysLeftInSaoPaulo(new Date('2026-04-07T15:00:00.000Z'), endsAt), -7);
    assert.equal(addCalendarDays('2026-03-31', -7), '2026-03-24');
    assert.equal(addCalendarDays('2026-03-01', 15), '2026-03-16');
  });

  it('d-7 continua no dia SP quando o UTC já entrou no dia seguinte', () => {
    const endsAt = new Date('2026-05-10T02:00:00.000Z');
    const startsAt = new Date(endsAt.getTime() - 30 * DAY);
    assert.equal(saoPauloISODate(endsAt), '2026-05-09');

    assert.deepEqual(
      matchingEtapas({ now: new Date('2026-05-02T21:00:00.000Z'), startsAt, endsAt }),
      ['d-7'],
    );
    assert.deepEqual(
      matchingEtapas({ now: new Date('2026-05-03T00:30:00.000Z'), startsAt, endsAt }),
      ['d-7'],
    );
    assert.deepEqual(
      matchingEtapas({ now: new Date('2026-05-03T03:00:00.000Z'), startsAt, endsAt }),
      [],
    );
  });

  it('a janela de busca de d0 é o dia civil de SP, não a tabela inteira', () => {
    const late = lifecycleQueryWindows(new Date('2026-01-16T00:30:00.000Z')).find((window) => window.etapa === 'd0');
    assert.ok(late);
    assert.equal(late.column, 'ends_at');
    assert.equal(late.start.toISOString(), '2026-01-15T03:00:00.000Z');
    assert.equal(late.end.toISOString(), '2026-01-16T03:00:00.000Z');

    const next = lifecycleQueryWindows(new Date('2026-01-16T03:00:00.000Z')).find((window) => window.etapa === 'd0');
    assert.equal(next?.start.toISOString(), '2026-01-16T03:00:00.000Z');
    assert.equal(next?.end.toISOString(), '2026-01-17T03:00:00.000Z');

    const dPlus1 = lifecycleQueryWindows(new Date('2026-01-16T00:30:00.000Z')).find((window) => window.etapa === 'd+1');
    assert.equal(dPlus1?.column, 'starts_at');
    assert.equal(dPlus1?.start.toISOString(), '2026-01-14T03:00:00.000Z');
    assert.equal(dPlus1?.end.toISOString(), '2026-01-15T03:00:00.000Z');
  });

  it('d+1 e d+15 exigem acesso ainda ativo', () => {
    const now = new Date('2026-06-02T15:00:00.000Z');
    const activeEnd = new Date('2026-06-20T15:00:00.000Z');
    const ended = new Date('2026-06-02T14:00:00.000Z');
    assert.equal(passesStageActivityRule('d+1', activeEnd, now), true);
    assert.equal(passesStageActivityRule('d+15', activeEnd, now), true);
    assert.equal(passesStageActivityRule('d+1', ended, now), false);
    assert.equal(passesStageActivityRule('d+15', now, now), false);
    assert.equal(passesStageActivityRule('d0', ended, now), true);
    assert.equal(passesStageActivityRule('d+7', ended, now), true);
  });
});

describe('filtro de quem já renovou', () => {
  const current = ref({
    id: 'sub-atual',
    userId: 'user-1',
    productType: 'nome_social',
    endsAt: '2026-10-20T03:00:00.000Z',
    refundedAt: null,
  });

  it('pula d-7, d-2, d0 e d+7 quando há outra assinatura do mesmo produto com ends_at maior', () => {
    const later = ref({
      id: 'sub-nova',
      userId: 'user-1',
      productType: 'nome_social',
      endsAt: '2026-11-19T03:00:00.000Z',
      refundedAt: null,
    });
    assert.equal(hasLaterSameProductSubscription(current, [later]), true);
    assert.equal(shouldSkipRenewed('d-7', true), true);
    assert.equal(shouldSkipRenewed('d-2', true), true);
    assert.equal(shouldSkipRenewed('d0', true), true);
    assert.equal(shouldSkipRenewed('d+7', true), true);
    assert.equal(shouldSkipRenewed('d+1', true), false);
    assert.equal(shouldSkipRenewed('d+15', true), false);
    assert.equal(shouldSkipRenewed('d-2', false), false);
    assert.equal(decideLifecycle({
      etapa: 'd-2',
      renewed: true,
      hasAnalysis: true,
      optIn: true,
      email: 'a@b.co',
    }).kind, 'skip_renewed');
    assert.equal(decideLifecycle({
      etapa: 'd+1',
      renewed: true,
      hasAnalysis: false,
      optIn: false,
      email: 'a@b.co',
    }).kind, 'send');
  });

  it('ignora outro produto, reembolso, o próprio id e ends_at igual', () => {
    assert.equal(hasLaterSameProductSubscription(current, [
      ref({ id: 'bebe', userId: 'user-1', productType: 'nome_bebe', endsAt: '2026-12-01T00:00:00.000Z' }),
    ]), false);
    assert.equal(hasLaterSameProductSubscription(current, [
      ref({
        id: 'reembolsada',
        userId: 'user-1',
        productType: 'nome_social',
        endsAt: '2026-12-01T00:00:00.000Z',
        refundedAt: '2026-11-02T00:00:00.000Z',
      }),
    ]), false);
    assert.equal(hasLaterSameProductSubscription(current, [
      ref({ id: 'sub-atual', userId: 'user-1', productType: 'nome_social', endsAt: '2026-12-01T00:00:00.000Z' }),
    ]), false);
    assert.equal(hasLaterSameProductSubscription(current, [
      ref({ id: 'outra-pessoa', userId: 'user-2', productType: 'nome_social', endsAt: '2026-12-01T00:00:00.000Z' }),
    ]), false);
    assert.equal(hasLaterSameProductSubscription(current, [
      ref({ id: 'empate', userId: 'user-1', productType: 'nome_social', endsAt: current.endsAt }),
    ]), false);
    assert.equal(hasLaterSameProductSubscription(current, [
      ref({ id: 'um-ms', userId: 'user-1', productType: 'nome_social', endsAt: '2026-10-20T03:00:00.001Z' }),
    ]), true);
  });

  it('d+7 sem opt-in não envia; d+15 escolhe ativacao ou dica', () => {
    assert.equal(decideLifecycle({
      etapa: 'd+7',
      renewed: false,
      hasAnalysis: true,
      optIn: false,
      email: 'a@b.co',
    }).kind, 'skip_no_optin');
    assert.equal(lifecycleVariant('d+15', false), 'ativacao');
    assert.equal(lifecycleVariant('d+15', true), 'dica');
    assert.equal(lifecycleVariant('d-2', false), null);
    const send = decideLifecycle({
      etapa: 'd+15',
      renewed: false,
      hasAnalysis: false,
      optIn: false,
      email: 'a@b.co',
    });
    assert.equal(send.kind, 'send');
    if (send.kind === 'send') assert.equal(send.variant, 'ativacao');
  });
});

describe('máscara de e-mail', () => {
  it('mostra só a primeira letra e o domínio', () => {
    assert.equal(maskEmail('guilherme@dominio.com'), 'g***@dominio.com');
    assert.equal(maskEmail('g@dominio.com'), 'g***@dominio.com');
    assert.equal(maskEmail('  Ana.Souza@NomeMagnetico.com '), 'A***@NomeMagnetico.com');
    assert.equal(maskEmail('sem-arroba'), '***');
    assert.equal(maskEmail('@dominio.com'), '***');
    assert.equal(maskEmail('a@'), '***');
    assert.equal(maskEmail(''), '***');
  });
});

describe('renewUrl', () => {
  it('monta /app/renovar com etapa encodada e a campanha nmrenov', () => {
    for (const etapa of RENEWAL_ETAPAS) {
      const url = new URL(buildRenewUrl('https://www.nomemagnetico.com.br/', etapa));
      assert.equal(`${url.origin}${url.pathname}`, 'https://www.nomemagnetico.com.br/app/renovar');
      assert.equal(url.searchParams.get('etapa'), etapa);
      assert.equal(url.searchParams.get('utm_source'), 'brevo');
      assert.equal(url.searchParams.get('utm_medium'), 'email');
      assert.equal(url.searchParams.get('utm_campaign'), renewalUtmCampaign(etapa));
    }

    assert.equal(
      buildRenewUrl('https://www.nomemagnetico.com.br', 'd+7'),
      'https://www.nomemagnetico.com.br/app/renovar?etapa=d%2B7&utm_source=brevo&utm_medium=email&utm_campaign=nmrenovdp7',
    );
    assert.match(buildRenewUrl('https://www.nomemagnetico.com.br', 'd+1' as RenewalEtapa), /etapa=d%2B1/);
    assert.match(buildRenewUrl('https://www.nomemagnetico.com.br', 'd+15'), /etapa=d%2B15/);
    assert.doesNotMatch(buildRenewUrl('https://www.nomemagnetico.com.br', 'd+7'), /etapa=d\+7/);
  });

  it('entra no payload com acessoFim e status do dia civil', () => {
    const payload = buildAccessLifecyclePayload({
      etapa: 'd-2',
      variant: null,
      email: 'ana@dominio.com',
      firstName: 'Ana',
      productType: 'nome_social',
      productName: 'Nome Social',
      startsAt: '2026-05-01T15:00:00.000Z',
      endsAt: '2026-05-31T18:00:00.000Z',
      now: new Date('2026-05-29T15:00:00.000Z'),
      isTrialOrGift: true,
      appUrl: 'https://www.nomemagnetico.com.br',
      subscriptionId: 'sub-1',
    });
    assert.equal(payload.daysLeft, 2);
    assert.equal(payload.acessoFim, '2026-05-31');
    assert.equal(payload.attributes.STATUS_ACESSO, 'ativo');
    assert.equal(payload.attributes.ACESSO_FIM, '2026-05-31');
    assert.equal(payload.isTrialOrGift, true);
    assert.equal(payload.renewUrl, buildRenewUrl('https://www.nomemagnetico.com.br', 'd-2'));

    const expired = buildAccessLifecyclePayload({
      ...payload,
      etapa: 'd0',
      startsAt: payload.startsAt,
      endsAt: '2026-05-31T18:00:00.000Z',
      now: new Date('2026-05-31T12:00:00.000Z'),
      isTrialOrGift: false,
      appUrl: 'https://www.nomemagnetico.com.br',
      subscriptionId: 'sub-1',
      email: payload.email,
      firstName: 'Ana',
      productType: 'nome_social',
      productName: 'Nome Social',
      variant: null,
    });
    assert.equal(expired.daysLeft, 0);
    assert.equal(expired.attributes.STATUS_ACESSO, 'expirado');
    assert.match(expired.renewUrl, /etapa=d0/);
    assert.match(expired.renewUrl, /utm_campaign=nmrenovd0/);
  });
});

describe('dry-run por padrão', () => {
  it('só libera o envio com a flag true e sem dry_run=1', () => {
    assert.equal(shouldActuallySend({ sendEnabled: undefined, dryRunParam: null }), false);
    assert.equal(shouldActuallySend({ sendEnabled: 'false', dryRunParam: null }), false);
    assert.equal(shouldActuallySend({ sendEnabled: 'TRUE', dryRunParam: null }), false);
    assert.equal(shouldActuallySend({ sendEnabled: 'true', dryRunParam: null }), true);
    assert.equal(shouldActuallySend({ sendEnabled: 'true', dryRunParam: '1' }), false);
    assert.equal(shouldActuallySend({ sendEnabled: 'true', dryRunParam: '0' }), true);
  });
});
