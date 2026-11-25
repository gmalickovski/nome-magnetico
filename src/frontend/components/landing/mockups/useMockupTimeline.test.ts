import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextDelayMs,
  getTimelineCycleDurationMs,
  normalizeTimelineSteps,
  resolveReducedMotionState,
  resolveTimelineAt,
  type TimelineStep,
} from './mockup-timeline-core.js';
import { CHAT_SCRIPTS } from './chat-scripts.js';

const SAMPLE_STEPS: TimelineStep<string>[] = [
  { at: 1200, action: 'tap' },
  { at: 0, action: 'typing' },
  { at: 600, action: 'shown' },
  { at: 1800, action: 'answered' },
];

describe('DEV-336 · motor de timeline dos mockups', () => {
  it('ordena passos sem mutar o array original', () => {
    const original = [...SAMPLE_STEPS];
    const normalized = normalizeTimelineSteps(SAMPLE_STEPS);

    assert.deepEqual(SAMPLE_STEPS, original);
    assert.deepEqual(
      normalized.map((s) => s.action),
      ['typing', 'shown', 'tap', 'answered'],
    );
  });

  it('aplica pausa de fim de ciclo (1,5–2 s padrão 1800 ms)', () => {
    const total = getTimelineCycleDurationMs(SAMPLE_STEPS);
    assert.equal(total, 1800 + 1800);

    const withMinDuration = getTimelineCycleDurationMs(SAMPLE_STEPS, 2500, 1500);
    assert.equal(withMinDuration, 4000);
  });

  it('resolve corretamente os passos disparados ao longo do tempo', () => {
    const start = resolveTimelineAt(SAMPLE_STEPS, 0);
    assert.equal(start.stepIndex, 0);
    assert.equal(start.currentAction, 'typing');
    assert.deepEqual(start.triggeredActions, ['typing']);

    const mid = resolveTimelineAt(SAMPLE_STEPS, 1300);
    assert.equal(mid.stepIndex, 2);
    assert.equal(mid.currentAction, 'tap');
    assert.deepEqual(mid.triggeredActions, ['typing', 'shown', 'tap']);

    const endPause = resolveTimelineAt(SAMPLE_STEPS, 2600);
    assert.equal(endPause.stepIndex, 3);
    assert.equal(endPause.currentAction, 'answered');
    assert.deepEqual(endPause.triggeredActions, ['typing', 'shown', 'tap', 'answered']);
  });

  it('retorna imediatamente o estado final para prefers-reduced-motion', () => {
    const reduced = resolveReducedMotionState(SAMPLE_STEPS);
    assert.equal(reduced.stepIndex, 3);
    assert.equal(reduced.currentAction, 'answered');
    assert.deepEqual(reduced.triggeredActions, ['typing', 'shown', 'tap', 'answered']);
  });

  it('calcula atraso exato até o próximo passo e reinício do loop', () => {
    const total = getTimelineCycleDurationMs(SAMPLE_STEPS, undefined, 1800);

    assert.equal(getNextDelayMs(SAMPLE_STEPS, 0, total, true), 600);
    assert.equal(getNextDelayMs(SAMPLE_STEPS, 600, total, true), 600);
    assert.equal(getNextDelayMs(SAMPLE_STEPS, 1800, total, true), 1800);
    assert.equal(getNextDelayMs(SAMPLE_STEPS, 3600, total, true), 0);
    assert.equal(getNextDelayMs(SAMPLE_STEPS, 1800, total, false), null);
  });
});

describe('DEV-336 / DEV-340 · roteiros de exemplo do ChatScene', () => {
  it('cobre os 3 caminhos com nomes de exemplo sem bloqueios e nota >= 80', () => {
    for (const key of ['social', 'artistico', 'bebe'] as const) {
      const script = CHAT_SCRIPTS[key];
      assert.equal(script.exchanges.length, 3);
      assert.ok(script.suggestions.length >= 2, `${key} deve ter sugestões de exemplo`);
      for (const s of script.suggestions) {
        assert.ok(s.card.score >= 80, `${key} (${s.card.nome}) deve ter nota >= 80`);
        assert.equal(s.card.bloqueios, 0, `${key} (${s.card.nome}) deve ter 0 bloqueios`);
      }
    }
  });
});
