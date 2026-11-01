import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChatDockLayout,
  buildResultadoDockLayout,
  resolveChatDockScreen,
} from './mobile-dock-screen.ts';

const chatBase = {
  birthConfirmed: true,
  canShowSummary: true,
  profileCollectionComplete: false,
  hasSuggestionsMessage: false,
  canRestart: true,
  canRegenerate: true,
  suggestionSelected: false,
};

describe('mobile-dock-screen', () => {
  it('antes da certidão: dock de questionário (Voltar), não null', () => {
    assert.equal(
      resolveChatDockScreen({ ...chatBase, birthConfirmed: false, canShowSummary: false }),
      'chat_questionnaire'
    );
  });

  it('questionário: Recomeçar no centro, sem PDF', () => {
    assert.equal(resolveChatDockScreen(chatBase), 'chat_questionnaire');
    const layout = buildChatDockLayout('chat_questionnaire', chatBase);
    assert.equal(layout.showPdfCircle, false);
    assert.deepEqual(
      layout.middleSecondaries.map((s) => s.id),
      ['restart']
    );
  });

  it('omite Recomeçar na dock com Resumo fullscreen aberto', () => {
    const layout = buildChatDockLayout('chat_questionnaire', {
      ...chatBase,
      summaryPanelOpen: true,
    });
    assert.deepEqual(layout.middleSecondaries.map((s) => s.id), []);
  });

  it('sugestões: Recomeçar no centro, sem estrela Outras opções; PDF só com seleção', () => {
    const input = {
      ...chatBase,
      profileCollectionComplete: true,
      hasSuggestionsMessage: true,
    };
    assert.equal(resolveChatDockScreen(input), 'chat_suggestions');
    const withoutPick = buildChatDockLayout('chat_suggestions', input);
    assert.equal(withoutPick.showPdfCircle, false);
    assert.deepEqual(
      withoutPick.middleSecondaries.map((s) => s.id),
      ['restart']
    );
    assert.ok(!withoutPick.middleSecondaries.some((s) => s.id === 'other_options'));

    const withPick = buildChatDockLayout('chat_suggestions', {
      ...input,
      suggestionSelected: true,
    });
    assert.equal(withPick.showPdfCircle, true);
  });

  it('resultado pago: Compartilhar, Refazer e Baixar PDF', () => {
    const layout = buildResultadoDockLayout({
      canShare: true,
      canRedo: true,
      canDownloadPdf: true,
      isFree: false,
    });
    assert.equal(layout.primary.id, 'download_pdf');
    assert.deepEqual(
      layout.secondaries.map((s) => s.id),
      ['share', 'redo_analysis']
    );
  });

  it('paywall gratuito: Resumo + PDF grátis + Desbloquear', () => {
    const screen = resolveChatDockScreen({
      ...chatBase,
      birthConfirmed: true,
      canShowSummary: true,
      profileCollectionComplete: false,
      freePaywallActive: true,
    });
    assert.equal(screen, 'chat_free_paywall');
    const layout = buildChatDockLayout('chat_free_paywall', {
      ...chatBase,
      birthConfirmed: true,
      canShowSummary: true,
      profileCollectionComplete: false,
      freePaywallActive: true,
    });
    assert.equal(layout.primary?.id, 'unlock_nome_social');
    assert.equal(layout.primary?.label, 'Desbloquear');
    assert.deepEqual(
      layout.middleSecondaries.map((s) => s.id),
      ['free_pdf']
    );
  });

  it('resultado gratuito: primária Desbloquear', () => {
    const layout = buildResultadoDockLayout({
      canShare: true,
      canRedo: true,
      canDownloadPdf: false,
      isFree: true,
    });
    assert.equal(layout.primary.id, 'unlock_nome_social');
  });
});
