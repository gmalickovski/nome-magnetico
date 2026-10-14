import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFreeAnalysisMarketingPayload,
  type FreeAnalysisMarketingPayload,
} from './free-analysis-payload';

const PAYLOAD_KEYS = [
  'email',
  'nome',
  'sobrenome',
  'analise_data',
  'analise_id',
  'score',
  'origem',
  'opt_in',
  'opt_in_data',
  'utm_source',
  'utm_medium',
  'utm_campaign',
] as const satisfies readonly (keyof FreeAnalysisMarketingPayload)[];

describe('buildFreeAnalysisMarketingPayload', () => {
  it('monta o contrato exato do evento de marketing da análise grátis', () => {
    const payload = buildFreeAnalysisMarketingPayload({
      email: '  Ana@Example.COM ',
      nomeCompleto: '  Maria   da   Silva Santos  ',
      concluidaEm: '2026-10-15T02:30:00.000Z',
      analiseId: '  7c1a9b2e-4d55-4a1e-9c0a-111111111111  ',
      score: 72,
      optIn: true,
      optInEm: '2026-10-14T18:04:05.000Z',
      utmSource: ' instagram ',
      utmMedium: 'cpc',
      utmCampaign: 'analise-gratis',
    });

    assert.deepEqual(payload, {
      email: 'ana@example.com',
      nome: 'Maria',
      sobrenome: 'da Silva Santos',
      analise_data: '2026-10-14',
      analise_id: '7c1a9b2e-4d55-4a1e-9c0a-111111111111',
      score: 72,
      origem: 'analise_gratis',
      opt_in: true,
      opt_in_data: '2026-10-14T18:04:05.000Z',
      utm_source: 'instagram',
      utm_medium: 'cpc',
      utm_campaign: 'analise-gratis',
    });
    assert.deepEqual(Object.keys(payload), [...PAYLOAD_KEYS]);
  });

  it('não envia data de consentimento quando o opt-in está desmarcado', () => {
    const payload = buildFreeAnalysisMarketingPayload({
      email: 'cliente@email.com',
      nomeCompleto: 'João',
      concluidaEm: new Date('2026-10-14T15:00:00.000Z'),
      analiseId: 'abc',
      score: 40,
      optIn: false,
      optInEm: '2026-10-14T18:04:05.000Z',
      utmSource: '   ',
      utmMedium: null,
      utmCampaign: undefined,
    });

    assert.equal(payload.nome, 'João');
    assert.equal(payload.sobrenome, '');
    assert.equal(payload.analise_data, '2026-10-14');
    assert.equal(payload.opt_in, false);
    assert.equal(payload.opt_in_data, null);
    assert.equal(payload.utm_source, null);
    assert.equal(payload.utm_medium, null);
    assert.equal(payload.utm_campaign, null);
    assert.equal(payload.origem, 'analise_gratis');
  });

  it('mantém score numérico e zera valor inválido sem lançar', () => {
    const payload = buildFreeAnalysisMarketingPayload({
      email: 'cliente@email.com',
      nomeCompleto: '',
      concluidaEm: 'data-invalida',
      analiseId: 'abc',
      score: Number.NaN,
      optIn: true,
      optInEm: 'nao-e-data',
    });

    assert.equal(payload.score, 0);
    assert.equal(typeof payload.score, 'number');
    assert.equal(payload.nome, '');
    assert.equal(payload.sobrenome, '');
    assert.match(payload.analise_data, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(payload.opt_in, true);
    assert.equal(payload.opt_in_data, null);
  });
});
