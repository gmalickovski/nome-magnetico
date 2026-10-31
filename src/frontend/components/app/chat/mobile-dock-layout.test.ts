import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DOCK_BAR_WIDTH_TRANSITION_MS,
  DOCK_RESTART_EXIT_MS,
  dockShellWidthStyle,
  MOBILE_DOCK_BAR_CLASS,
  MOBILE_DOCK_ROOT_CLASS,
} from './mobile-dock-layout.ts';

describe('mobile-dock-layout', () => {
  it('shell usa max-content antes da medição e px depois', () => {
    assert.equal(dockShellWidthStyle(null, false).width, 'max-content');
    assert.equal(dockShellWidthStyle(220, false).width, '220px');
  });

  it('transição de largura 240ms com easing da dock', () => {
    const t = dockShellWidthStyle(180, false).transition;
    assert.ok(t?.includes(String(DOCK_BAR_WIDTH_TRANSITION_MS)));
    assert.ok(t?.includes('cubic-bezier(0.2, 0.8, 0.2, 1)'));
    assert.equal(dockShellWidthStyle(180, true).transition, undefined);
  });

  it('saída do Recomeçar alinhada ao encolhimento da dock', () => {
    assert.equal(DOCK_RESTART_EXIT_MS, 180);
    assert.ok(DOCK_RESTART_EXIT_MS <= DOCK_BAR_WIDTH_TRANSITION_MS);
  });

  it('barra e root não usam largura total (inline-flex / w-max)', () => {
    assert.match(MOBILE_DOCK_BAR_CLASS, /inline-flex/);
    assert.match(MOBILE_DOCK_BAR_CLASS, /w-max/);
    assert.match(MOBILE_DOCK_ROOT_CLASS, /w-max/);
    assert.match(MOBILE_DOCK_ROOT_CLASS, /left-1\/2/);
    assert.match(MOBILE_DOCK_ROOT_CLASS, /-translate-x-1\/2/);
  });
});
