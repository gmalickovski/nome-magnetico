import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFreeAnalysisBrevoPayload,
  formatAnaliseData,
  hasFreeAnalysisMarketingConsent,
} from './sync-free-analysis';

const input = {
  email: '  Ana@Email.com ',
  nome: ' Ana Silva ',
  analiseData: '2026-10-14',
  score: 72,
  analiseId: 'abc-123',
};

describe('buildFreeAnalysisBrevoPayload', () => {
  it('monta o upsert idempotente com atributos e listId', () => {
    const payload = buildFreeAnalysisBrevoPayload(input, 15);

    assert.deepEqual(payload, {
      email: 'ana@email.com',
      updateEnabled: true,
      attributes: {
        NOME: 'Ana Silva',
        ANALISE_DATA: '2026-10-14',
        SCORE: 72,
        ANALISE_ID: 'abc-123',
      },
      listIds: [15],
    });
    assert.equal(typeof payload?.attributes.SCORE, 'number');
  });

  it('formata Date em YYYY-MM-DD no fuso de São Paulo', () => {
    assert.equal(formatAnaliseData(new Date('2026-10-14T02:30:00.000Z')), '2026-10-13');

    const payload = buildFreeAnalysisBrevoPayload(
      { ...input, analiseData: new Date('2026-10-14T15:00:00.000Z') },
      15,
    );

    assert.equal(payload?.attributes.ANALISE_DATA, '2026-10-14');
  });

  it('omite SCORE quando o valor é nulo e mantém o zero', () => {
    const semScore = buildFreeAnalysisBrevoPayload({ ...input, score: null }, 15);
    assert.equal(semScore?.attributes.SCORE, undefined);
    assert.equal('SCORE' in (semScore?.attributes ?? {}), false);

    const zero = buildFreeAnalysisBrevoPayload({ ...input, score: 0 }, 15);
    assert.equal(zero?.attributes.SCORE, 0);
  });

  it('recusa e-mail, data, id ou listId inválidos', () => {
    assert.equal(buildFreeAnalysisBrevoPayload({ ...input, email: 'sem-arroba' }, 15), null);
    assert.equal(buildFreeAnalysisBrevoPayload({ ...input, analiseData: '14/10/2026' }, 15), null);
    assert.equal(buildFreeAnalysisBrevoPayload({ ...input, analiseId: '  ' }, 15), null);
    assert.equal(buildFreeAnalysisBrevoPayload(input, 0), null);
    assert.equal(buildFreeAnalysisBrevoPayload(input, 1.5), null);
  });
});

describe('hasFreeAnalysisMarketingConsent', () => {
  it('só aceita o booleano true', () => {
    assert.equal(hasFreeAnalysisMarketingConsent(true), true);
    assert.equal(hasFreeAnalysisMarketingConsent(false), false);
    assert.equal(hasFreeAnalysisMarketingConsent(undefined), false);
    assert.equal(hasFreeAnalysisMarketingConsent('true'), false);
    assert.equal(hasFreeAnalysisMarketingConsent(1), false);
  });
});
