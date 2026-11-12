import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildChatDockLayout } from './mobile-dock-screen.ts';
import {
  collectDockContextualActions,
  maxVisibleContextualActions,
  splitDockContextualActions,
} from './dock-contextual-actions.ts';

describe('dock-contextual-actions', () => {
  it('limita ações visíveis por largura', () => {
    assert.equal(maxVisibleContextualActions(320), 1);
    assert.equal(maxVisibleContextualActions(390), 2);
  });

  it('envia overflow para MoreHorizontal acima do limite', () => {
    const layout = buildChatDockLayout('chat_suggestions', {
      birthConfirmed: true,
      canShowSummary: true,
      profileCollectionComplete: true,
      hasSuggestionsMessage: true,
      canRestart: true,
      canRegenerate: true,
      suggestionSelected: true,
      summaryPanelOpen: false,
    });
    const all = collectDockContextualActions(layout, {
      reading: { visible: true, badge: false },
      pdfModel: {
        visible: true,
        phase: 'ready',
        isFree: false,
        emailConfirmed: true,
        displayName: 'X',
      },
    });
    const narrow = splitDockContextualActions(all, 320);
    assert.equal(narrow.visible.length, 1);
    assert.ok(narrow.overflow.length >= 1);
    const wide = splitDockContextualActions(all, 390);
    assert.equal(wide.visible.length, 2);
  });
});
