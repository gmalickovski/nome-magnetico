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
  hasAnalysisId: true,
  suggestionSelected: false,
};

describe('mobile-dock-screen', () => {
  it('questionário: Resumo e Recomeçar, sem primária', () => {
    assert.equal(resolveChatDockScreen(chatBase), 'chat_questionnaire');
    const layout = buildChatDockLayout('chat_questionnaire', chatBase);
    assert.equal(layout.primary, null);
    assert.deepEqual(
      layout.secondaries.map((s) => s.id),
      ['summary', 'restart']
    );
  });

  it('sugestões: Outras opções e primária Gerar PDF desabilitada sem escolha', () => {
    const input = {
      ...chatBase,
      profileCollectionComplete: true,
      hasSuggestionsMessage: true,
    };
    assert.equal(resolveChatDockScreen(input), 'chat_suggestions');
    const layout = buildChatDockLayout('chat_suggestions', input);
    assert.ok(layout.primary);
    assert.equal(layout.primary?.id, 'generate_pdf');
    assert.equal(layout.primary?.disabled, true);
    assert.equal(layout.primary?.disabledLabel, 'Escolha um nome');
    assert.deepEqual(
      layout.secondaries.map((s) => s.id),
      ['summary', 'other_options']
    );
  });

  it('sugestões: primária ativa com card escolhido', () => {
    const layout = buildChatDockLayout('chat_suggestions', {
      ...chatBase,
      profileCollectionComplete: true,
      hasSuggestionsMessage: true,
      suggestionSelected: true,
    });
    assert.equal(layout.primary?.disabled, false);
  });

  it('sugestões: omite primária sem analysisId', () => {
    const layout = buildChatDockLayout('chat_suggestions', {
      ...chatBase,
      profileCollectionComplete: true,
      hasSuggestionsMessage: true,
      hasAnalysisId: false,
    });
    assert.equal(layout.primary, null);
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
