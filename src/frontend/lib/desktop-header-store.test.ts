import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearDesktopHeader,
  getDesktopHeaderSnapshot,
  publishDesktopHeader,
  subscribeDesktopHeader,
} from './desktop-header-store.ts';

describe('desktop-header-store DEV-282', () => {
  it('publica progresso, notifica inscritos e limpa snapshot', () => {
    clearDesktopHeader();
    const initial = getDesktopHeaderSnapshot();
    assert.equal(initial.progress, null);
    assert.equal(initial.actions, null);

    let notifyCount = 0;
    const unsubscribe = subscribeDesktopHeader(() => {
      notifyCount++;
    });

    publishDesktopHeader({
      progress: { currentStep: 2, totalSteps: 8 },
      actions: null,
    });

    assert.equal(notifyCount, 1);
    const snap = getDesktopHeaderSnapshot();
    assert.deepEqual(snap.progress, { currentStep: 2, totalSteps: 8 });

    clearDesktopHeader();
    assert.equal(notifyCount, 2);
    assert.equal(getDesktopHeaderSnapshot().progress, null);

    unsubscribe();
    publishDesktopHeader({
      progress: { currentStep: 3, totalSteps: 8 },
      actions: null,
    });
    // Notificador não é mais chamado após unsubscribe
    assert.equal(notifyCount, 2);
    clearDesktopHeader();
  });
});
