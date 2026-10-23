import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildFreeLeadAnalysisRecord, dbBirthDateToPtBr } from './generate-free-lead-pdf';

describe('generate-free-lead-pdf', () => {
  it('dbBirthDateToPtBr converte DATE do Postgres', () => {
    assert.equal(dbBirthDateToPtBr('1990-05-10'), '10/05/1990');
    assert.equal(dbBirthDateToPtBr('1990-05-10T00:00:00.000Z'), '10/05/1990');
  });

  it('buildFreeLeadAnalysisRecord inclui score e triângulos', () => {
    const { record, scoreLegado, score } = buildFreeLeadAnalysisRecord({
      nomeCompleto: 'Ana Clara Silva',
      dataNascimentoPt: '15/03/1988',
      dataNascimentoDb: '1988-03-15',
      createdAt: '2026-10-18T12:00:00.000Z',
    });
    assert.equal(record.nome_completo, 'Ana Clara Silva');
    assert.equal(record.is_free, true);
    assert.ok(typeof scoreLegado === 'number');
    assert.ok(typeof score === 'number');
    assert.ok(record.triangulo_vida);
    assert.ok(Array.isArray(record.bloqueios));
  });
});
