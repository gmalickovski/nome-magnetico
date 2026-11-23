import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NmBubble as AppNmBubble } from '../../app/chat/NmBubble.js';
import { UserBubble as AppUserBubble } from '../../app/chat/UserBubble.js';
import { ChatHarmonyScoreCard } from '../../app/chat/ChatHarmonyScoreCard.js';
import { ChatProgress } from '../../app/chat/ChatProgress.js';
import { ChatInlineOptionPills } from '../../app/chat/ChatStepInteraction.js';
import { ReadingTopicCard as AppReadingTopicCard } from '../../app/chat/ReadingTopicCard.js';
import {
  NmBubble as SharedNmBubble,
  UserBubble as SharedUserBubble,
  ChatScorePanelCard,
  ChatProgressBar,
  ChatOptionPills,
  ChatSuggestionCard,
  ChatSuggestionSectionHeader,
  ReadingTopicCard as SharedReadingTopicCard,
  getScoreTierVisual,
} from './index.js';
import type { ResultPanelData } from '../../app/chat/chat-types.js';
import type { HarmonySuggestionCardData } from '../ProductResultFrame.js';

const SAMPLE_BIRTH: ResultPanelData = {
  nome: 'Marina Pereira Costa',
  score: 58,
  expressao: 8,
  destino: 6,
  motivacao: 3,
  impressao: 5,
  missao: 5,
  bloqueios: [],
  triangulos: {
    vida: { linhas: [], arcanoRegente: null, arcanosDominantes: [], sequenciasNegativas: [] },
    pessoal: { linhas: [], arcanoRegente: null, arcanosDominantes: [], sequenciasNegativas: [] },
    social: { linhas: [], arcanoRegente: null, arcanosDominantes: [], sequenciasNegativas: [] },
    destino: { linhas: [], arcanoRegente: null, arcanosDominantes: [], sequenciasNegativas: [] },
  },
};

const SAMPLE_HARMONIZED: ResultPanelData = {
  ...SAMPLE_BIRTH,
  nome: 'Marina Côsta',
  score: 93,
  expressao: 6,
};

const SAMPLE_CARD: HarmonySuggestionCardData = {
  nome: 'Marina Côsta',
  score: 93,
  compatibilidade: 'favoravel',
  expressao: 6,
  destino: 6,
  motivacao: 2,
  impressao: 4,
  missao: 3,
  bloqueios: 0,
  vidaBloqueiosCodigos: [],
};

describe('DEV-340 · paridade DOM/classes entre chat real e peças compartilhadas', () => {
  it('NmBubble do app e shared geram exatamente o mesmo HTML', () => {
    const appHtml = renderToStaticMarkup(
      React.createElement(
        AppNmBubble,
        { eyebrow: 'PASSO 1 DE 3', wide: true },
        React.createElement('p', null, 'O que você quer fazer hoje?'),
      ),
    );
    const sharedHtml = renderToStaticMarkup(
      React.createElement(
        SharedNmBubble,
        { eyebrow: 'PASSO 1 DE 3', wide: true },
        React.createElement('p', null, 'O que você quer fazer hoje?'),
      ),
    );
    assert.equal(appHtml, sharedHtml);
    assert.match(sharedHtml, /bg-chat-bubble/);
    assert.match(sharedHtml, /text-chat-ink/);
  });

  it('UserBubble do app e shared geram exatamente o mesmo HTML', () => {
    const appHtml = renderToStaticMarkup(
      React.createElement(AppUserBubble, { content: 'Harmonizar o meu nome' }),
    );
    const sharedHtml = renderToStaticMarkup(
      React.createElement(SharedUserBubble, { content: 'Harmonizar o meu nome' }),
    );
    assert.equal(appHtml, sharedHtml);
    assert.match(sharedHtml, /bg-gold/);
    assert.match(sharedHtml, /text-dark-deeper/);
  });

  it('ChatHarmonyScoreCard do app e ChatScorePanelCard geram exatamente o mesmo HTML', () => {
    const appHtml = renderToStaticMarkup(
      React.createElement(ChatHarmonyScoreCard, {
        birthPanel: SAMPLE_BIRTH,
        harmonizedPanel: SAMPLE_HARMONIZED,
      }),
    );
    const sharedHtml = renderToStaticMarkup(
      React.createElement(ChatScorePanelCard, {
        birth: { nome: SAMPLE_BIRTH.nome, score: SAMPLE_BIRTH.score },
        harmonized: { nome: SAMPLE_HARMONIZED.nome, score: SAMPLE_HARMONIZED.score },
      }),
    );
    assert.equal(appHtml, sharedHtml);
    assert.match(sharedHtml, /Marina Côsta/);
    assert.match(sharedHtml, /93/);
    assert.match(sharedHtml, /58/);
  });

  it('ChatProgress do app e ChatProgressBar geram exatamente o mesmo HTML', () => {
    const appHtml = renderToStaticMarkup(
      React.createElement(ChatProgress, { currentStep: 3, totalSteps: 4 }),
    );
    const sharedHtml = renderToStaticMarkup(
      React.createElement(ChatProgressBar, { currentStep: 3, totalSteps: 4 }),
    );
    assert.equal(appHtml, sharedHtml);
    assert.match(sharedHtml, /75%/);
  });

  it('ChatInlineOptionPills do app e ChatOptionPills geram exatamente o mesmo HTML', () => {
    const opts = [
      { id: 'dia_a_dia', label: 'Harmonizar o meu nome' },
      { id: 'artistico', label: 'Criar um nome artístico' },
    ];
    const appHtml = renderToStaticMarkup(
      React.createElement(ChatInlineOptionPills, {
        options: opts,
        onSelect: () => {},
      }),
    );
    const sharedHtml = renderToStaticMarkup(
      React.createElement(ChatOptionPills, {
        options: opts,
        size: 'lg',
      }),
    );
    assert.equal(appHtml, sharedHtml);
    assert.match(sharedHtml, /rounded-full/);
  });

  it('ReadingTopicCard do app e shared geram exatamente o mesmo HTML', () => {
    const appHtml = renderToStaticMarkup(
      React.createElement(
        AppReadingTopicCard,
        { eyebrow: 'Caminho · Nome Social', title: 'Harmonizar o meu nome' },
        React.createElement('p', null, 'Conteúdo'),
      ),
    );
    const sharedHtml = renderToStaticMarkup(
      React.createElement(
        SharedReadingTopicCard,
        { eyebrow: 'Caminho · Nome Social', title: 'Harmonizar o meu nome' },
        React.createElement('p', null, 'Conteúdo'),
      ),
    );
    assert.equal(appHtml, sharedHtml);
  });

  it('ChatSuggestionCard usa ScoreCardRow, selo Nenhum bloqueio, compatibilidade e cores de getScoreTierVisual', () => {
    const tier = getScoreTierVisual(SAMPLE_CARD.score);
    const html = renderToStaticMarkup(
      React.createElement(ChatSuggestionCard, {
        card: SAMPLE_CARD,
        selected: true,
        principal: true,
        maiorNota: true,
        interactive: false,
      }),
    );
    assert.match(html, /Marina Côsta/);
    assert.match(html, /Nenhum bloqueio/);
    assert.match(html, /✦ Principal/);
    assert.match(html, /★ Maior nota/);
    assert.ok(html.includes(tier.label));
    assert.ok(html.includes(tier.text));
  });

  it('ChatSuggestionSectionHeader renderiza título, contagem e descrição padronizada', () => {
    const html = renderToStaticMarkup(
      React.createElement(ChatSuggestionSectionHeader, {
        titulo: 'Nomes totalmente novos',
        count: 2,
        dica: 'Nomes criados para o seu estilo.',
      }),
    );
    assert.match(html, /Nomes totalmente novos/);
    assert.match(html, /\(2\)/);
  });
});
