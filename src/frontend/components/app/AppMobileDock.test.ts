import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APP_CLIENT_NAV_LABELS } from './app-client-nav-shared.ts';

mock.module('../../lib/auth-fetch.js', {
  namedExports: {
    fetchWithAuth: async () => {
      throw new Error('Unexpected network in dock render test');
    },
  },
});
const { default: AppMobileDock } = await import('./AppMobileDock.tsx');
const { MobileChatDock } = await import('./chat/MobileChatDock.tsx');
import { buildResultadoDockLayout } from './chat/mobile-dock-screen.ts';

const noop = () => {};

const CLIENT_NAV_LABELS = [
  APP_CLIENT_NAV_LABELS.inicio,
  APP_CLIENT_NAV_LABELS.analises,
  APP_CLIENT_NAV_LABELS.glossario,
  APP_CLIENT_NAV_LABELS.suporte,
];

describe('AppMobileDock', () => {
  it('mantém páginas globais e um único root também durante análise e resultado', () => {
    for (const pathname of ['/app', '/app/analise/nome-social', '/app/resultado/x']) {
      const html = renderToStaticMarkup(
        React.createElement(AppMobileDock, { pathname, showAnalisesNav: true })
      );
      assert.equal((html.match(/data-nm-mobile-dock="single"/g) ?? []).length, 1);
      for (const label of CLIENT_NAV_LABELS) {
        assert.ok(html.includes('aria-label="' + label + '"'), label);
      }
      assert.doesNotMatch(html, /aria-label="Blog"/);
      assert.doesNotMatch(html, /aria-label="Área do Analista"/);
    }
  });
  it('ações incorporadas não criam outro shell nem controle lateral de resumo', () => {
    const layout = buildResultadoDockLayout({
      canShare: false,
      canRedo: false,
      canDownloadPdf: true,
      isFree: false,
    });
    const html = renderToStaticMarkup(
      React.createElement(MobileChatDock, {
        omitRoot: true,
        layout,
        summaryPanelOpen: false,
        summaryBadge: false,
        onSecondary: noop,
        onPrimary: noop,
      })
    );
    assert.doesNotMatch(html, /mobile-chat-dock-shell|mobile-chat-dock-root|Painel de análise|Painel de leitura/);
    assert.match(html, /aria-label="Baixar a análise em PDF"/);
    assert.doesNotMatch(html, /aria-label="Mais ações"/);
    assert.doesNotMatch(html, /aria-label="Voltar"/);
    assert.doesNotMatch(html, /MobileSummaryToggle|aria-controls="mobile-reading-summary"/);
  });
  it('várias ações contextuais usam faixa rolável e CTA fixo', () => {
    const layout = buildResultadoDockLayout({
      canShare: true,
      canRedo: true,
      canDownloadPdf: true,
      isFree: false,
    });
    const html = renderToStaticMarkup(
      React.createElement(MobileChatDock, {
        omitRoot: true,
        layout,
        summaryPanelOpen: false,
        summaryBadge: false,
        onSecondary: noop,
        onPrimary: noop,
      })
    );
    assert.match(html, /nm-dock-context-scroll/);
    assert.match(html, /nm-dock-context-fixed/);
    assert.match(html, /aria-label="Baixar a análise em PDF"/);
    assert.match(html, /aria-label="Refazer análise"/);
    assert.match(html, /data-dock-scroll-item/);
    assert.doesNotMatch(html, /mobile-chat-dock-shell|mobile-chat-dock-root/);
  });
  it('exibe ação Abrir painel de análise na dock quando showReadingAction', () => {
    const layout = buildResultadoDockLayout({
      canShare: false,
      canRedo: false,
      canDownloadPdf: true,
      isFree: false,
    });
    const html = renderToStaticMarkup(
      React.createElement(MobileChatDock, {
        omitRoot: true,
        layout,
        summaryPanelOpen: false,
        summaryBadge: true,
        showReadingAction: true,
        onSecondary: noop,
        onPrimary: noop,
      })
    );
    assert.match(html, /aria-label="Abrir painel de análise"/);
    assert.match(html, /data-nm-reading-trigger/);
  });
  it('não referencia controle lateral MobileSummaryToggle no layout', () => {
    const src = readFileSync(new URL('./AppMobileDock.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(src, /MobileSummaryToggle/);
    assert.match(src, /showReadingAction/);
    assert.doesNotMatch(src, /DockContextOverflow/);
  });
  it('mantém medição intrínseca na innerRef para expandir ao receber ações contextuais', () => {
    const dockSrc = readFileSync(new URL('./AppMobileDock.tsx', import.meta.url), 'utf8');
    const chatDockSrc = readFileSync(new URL('./chat/MobileChatDock.tsx', import.meta.url), 'utf8');
    assert.match(dockSrc, /ref=\{innerRef\} className=\{`\$\{barClassName\} items-center`\}/);
    assert.doesNotMatch(dockSrc, /ref=\{innerRef\}[^>\n]*w-full/);
    assert.match(dockSrc, /nm-mobile-dock-context min-w-0 shrink overflow-hidden/);
    assert.match(chatDockSrc, /omitRoot \? 'inline-flex min-w-0 shrink'/);
  });
  it('bottom sheet mobile abre em translateY(0), suporta drag contínuo e animação cobre até 1023px', () => {
    const sheetSrc = readFileSync(new URL('./chat/MobileReadingBottomSheet.tsx', import.meta.url), 'utf8');
    const cssSrc = readFileSync(new URL('../../../styles/global.css', import.meta.url), 'utf8');
    assert.match(sheetSrc, /onPointerMove=\{onHandlePointerMove\}/);
    assert.match(sheetSrc, /onPointerCancel=\{onHandlePointerCancel\}/);
    assert.match(cssSrc, /@media \(max-width: 1023px\)/);
    assert.match(cssSrc, /@keyframes nm-reading-sheet-in[\s\S]*?translateY\(0\)/);
    assert.match(cssSrc, /@keyframes nm-reading-sheet-out[\s\S]*?translateY\(0\)/);
  });
  it('chat mobile expande dock sem trava 5.75rem, move CTA Gerar análise para pílula no rodapé do painel e mantém badge enquanto houver seleção', () => {
    const chatSrc = readFileSync(new URL('./chat/NomeSocialChat.tsx', import.meta.url), 'utf8');
    const sheetSrc = readFileSync(new URL('./chat/MobileReadingBottomSheet.tsx', import.meta.url), 'utf8');
    const cssSrc = readFileSync(new URL('../../../styles/global.css', import.meta.url), 'utf8');
    const stripSrc = readFileSync(new URL('./chat/DockContextScrollStrip.tsx', import.meta.url), 'utf8');

    assert.match(cssSrc, /--nm-dock-context-scroll-max:\s*100%/);
    assert.doesNotMatch(cssSrc, /min\(5\.75rem/);
    assert.doesNotMatch(stripSrc, /endSentinelRef.*pr-5/);

    assert.match(chatSrc, /mobileSelectionBadge\s*=\s*Boolean\(activeSuggestionId\)/);
    assert.match(chatSrc, /<MobileDockActionBridge[\s\S]*?summaryBadge=\{mobileSelectionBadge\}[\s\S]*?pdfModel=\{null\}/);
    assert.match(chatSrc, /openSheetAfterCardTapRef\.current\s*=\s*id/);

    assert.match(sheetSrc, /Gerar análise/);
    assert.doesNotMatch(sheetSrc, /ChatPdfDockCircle/);
  });
});
