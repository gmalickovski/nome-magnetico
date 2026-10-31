import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildNextQuestion, buildSobrenomePillOptions } from './decide-live-bridge.ts';

describe('buildSobrenomePillOptions', () => {
  it('gera chip por sobrenome detectado', () => {
    const opts = buildSobrenomePillOptions(['Malickovski', 'Correa']);
    assert.ok(opts.some((o) => o.label.includes('Malickovski')));
    assert.ok(opts.some((o) => o.label.includes('Correa')));
    assert.ok(opts.some((o) => o.label.includes(' e ')));
  });
});

describe('buildNextQuestion · sobrenomes', () => {
  it('inclui options a partir de sobrenomesDetectados', () => {
    const q = buildNextQuestion({
      next_step: 'sobrenomes',
      remaining: 5,
      promptSugestao: 'Quais sobrenomes manter?',
      sobrenomesDetectados: ['Malickovski', 'Correa'],
    });
    assert.equal(q?.id, 'sobrenomes');
    assert.equal(q?.tipo, 'texto');
    assert.ok(q?.options && q.options.length >= 2);
  });
});
