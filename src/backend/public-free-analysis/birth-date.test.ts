import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseIsoBirthDate } from './birth-date';

const fixedNow = new Date('2026-10-16T12:00:00Z');

describe('parseIsoBirthDate', () => {
  it('rejeita vazio, formato errado, data inválida e futura', () => {
    assert.deepEqual(parseIsoBirthDate('', fixedNow), { ok: false });
    assert.deepEqual(parseIsoBirthDate('14/02/1990', fixedNow), { ok: false });
    assert.deepEqual(parseIsoBirthDate('1990-02-31', fixedNow), { ok: false });
    assert.deepEqual(parseIsoBirthDate('2030-01-01', fixedNow), { ok: false });
  });

  it('aceita data válida YYYY-MM-DD', () => {
    assert.deepEqual(parseIsoBirthDate('1990-02-14', fixedNow), {
      ok: true,
      isoDate: '1990-02-14',
    });
  });
});
