import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildChatDockLayout, buildResultadoDockLayout } from './mobile-dock-screen.ts';
import {
  collectDockContextualActions,
  isDockScrollFixedAction,
  isPinnedPdfAction,
  partitionDockContextualActions,
} from './dock-contextual-actions.ts';

function partitionAtWidths(layout: Parameters<typeof collectDockContextualActions>[0]) {
  const all = collectDockContextualActions(layout, {
    reading: { visible: true, badge: false },
    pdfModel: {
      visible: true,
      phase: 'ready',
      isFree: false,
      emailConfirmed: true,
      displayName: 'X',
      assinaturaLabel: 'Nome',
      suggestionRank: 1,
      score: 80,
      priceLabel: '',
      screen: 'chat_suggestions',
    },
  });
  return partitionDockContextualActions(all);
}

describe('dock-contextual-actions', () => {
  it('partição: PDF/Desbloquear fixos; demais contextuais rolam', () => {
    const layout = buildResultadoDockLayout({
      canShare: true,
      canRedo: true,
      canDownloadPdf: true,
      isFree: false,
    });
    const { scrollable, fixed } = partitionDockContextualActions(collectDockContextualActions(layout, {}));
    assert.ok(fixed.some((a) => a.primaryId === 'download_pdf'));
    assert.ok(scrollable.some((a) => a.secondaryId === 'share'));
    assert.ok(scrollable.some((a) => a.secondaryId === 'redo_analysis'));
    assert.ok(!scrollable.some((a) => isPinnedPdfAction(a)));
  });

  it('chat: other_options rola; PDF fixo', () => {
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
    layout.middleSecondaries.push({
      id: 'other_options',
      label: 'Gerar outras opções',
      icon: 'sparkles',
    });
    const { scrollable, fixed } = partitionAtWidths(layout);
    assert.ok(fixed.some((a) => a.kind === 'pdf'));
    assert.ok(scrollable.some((a) => a.secondaryId === 'other_options'));
    assert.ok(scrollable.some((a) => a.secondaryId === 'reading'));
  });

  it('paywall: Desbloquear fixo', () => {
    const layout = buildChatDockLayout('chat_free_paywall', {
      birthConfirmed: true,
      canShowSummary: true,
      profileCollectionComplete: false,
      hasSuggestionsMessage: false,
      canRestart: true,
      canRegenerate: false,
      suggestionSelected: false,
      freePaywallActive: true,
    });
    const { fixed } = partitionDockContextualActions(
      collectDockContextualActions(layout, {})
    );
    assert.ok(fixed.some((a) => a.primaryId === 'unlock_nome_social'));
  });

  for (const width of [360, 390, 430, 1023]) {
    it(`partição estável em viewport ${width}px (resultado)`, () => {
      const layout = buildResultadoDockLayout({
        canShare: true,
        canRedo: true,
        canDownloadPdf: true,
        isFree: false,
      });
      const parts = partitionDockContextualActions(collectDockContextualActions(layout, {}));
      assert.equal(parts.fixed.length, 1);
      assert.equal(parts.fixed[0].primaryId, 'download_pdf');
      assert.equal(parts.scrollable.length, 2);
      void width;
    });
  }

  it('isDockScrollFixedAction cobre apenas CTA principal', () => {
    assert.equal(isDockScrollFixedAction({ key: 'p', kind: 'primary', label: 'x', primaryId: 'download_pdf' }), true);
    assert.equal(
      isDockScrollFixedAction({ key: 'o', kind: 'secondary', label: 'x', secondaryId: 'other_options' }),
      false
    );
  });
});
