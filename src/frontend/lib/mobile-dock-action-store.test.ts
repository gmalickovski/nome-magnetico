import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearMobileDockAction,
  getMobileDockActionSnapshot,
  publishMobileDockAction,
} from './mobile-dock-action-store.ts';

describe('mobile-dock-action-store', () => {
  it('publica e limpa snapshot de ações', () => {
    clearMobileDockAction();
    assert.equal(getMobileDockActionSnapshot(), null);

    publishMobileDockAction({
      state: {
        layout: { screen: 'chat_questionnaire', middleSecondaries: [], showPdfCircle: false },
        summaryPanelOpen: false,
        restartExitActive: false,
        summaryBadge: false,
        pdfModel: null,
        pdfExiting: false,
      },
      handlers: {
        onBack: () => {},
        onSecondary: () => {},
        onPrimary: () => {},
      },
    });

    assert.ok(getMobileDockActionSnapshot()?.state.layout);
    clearMobileDockAction();
    assert.equal(getMobileDockActionSnapshot(), null);
  });
});
