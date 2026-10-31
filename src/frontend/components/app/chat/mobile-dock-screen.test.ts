import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMobileDockActions,
  resolveMobileDockScreen,
} from './mobile-dock-screen.ts';

const base = {
  birthConfirmed: true,
  profileCollectionComplete: false,
  hasSuggestionsMessage: false,
  activeSuggestionId: null,
  canShowSummary: true,
  canRestart: true,
  canRegenerate: true,
  canPdf: true,
  canShare: true,
};

describe('mobile-dock-screen', () => {
  it('resolveMobileDockScreen retorna null sem certidão ou resumo', () => {
    assert.equal(resolveMobileDockScreen({ ...base, birthConfirmed: false }), null);
    assert.equal(resolveMobileDockScreen({ ...base, canShowSummary: false }), null);
  });

  it('questionário: Resumo e Recomeçar', () => {
    assert.equal(resolveMobileDockScreen(base), 'questionnaire');
    const actions = buildMobileDockActions('questionnaire', base);
    assert.deepEqual(
      actions.map((a) => a.id),
      ['summary', 'restart']
    );
  });

  it('sugestões: Resumo, Gerar outras e PDF quando disponível', () => {
    const screen = resolveMobileDockScreen({
      ...base,
      profileCollectionComplete: true,
      hasSuggestionsMessage: true,
    });
    assert.equal(screen, 'suggestions');
    const actions = buildMobileDockActions('suggestions', {
      ...base,
      profileCollectionComplete: true,
      hasSuggestionsMessage: true,
    });
    assert.deepEqual(
      actions.map((a) => a.id),
      ['summary', 'regenerate', 'pdf']
    );
  });

  it('resultado: Resumo, PDF e Compartilhar', () => {
    const screen = resolveMobileDockScreen({
      ...base,
      profileCollectionComplete: true,
      hasSuggestionsMessage: true,
      activeSuggestionId: 's1',
    });
    assert.equal(screen, 'result');
    const actions = buildMobileDockActions('result', {
      ...base,
      profileCollectionComplete: true,
      activeSuggestionId: 's1',
    });
    assert.deepEqual(
      actions.map((a) => a.id),
      ['summary', 'pdf', 'share']
    );
  });

  it('omite PDF quando canPdf é false', () => {
    const actions = buildMobileDockActions('suggestions', {
      ...base,
      profileCollectionComplete: true,
      canPdf: false,
    });
    assert.deepEqual(
      actions.map((a) => a.id),
      ['summary', 'regenerate']
    );
  });
});
