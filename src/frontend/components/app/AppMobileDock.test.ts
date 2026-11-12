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
const { MobileSummaryToggle } = await import('./chat/MobileSummaryToggle.tsx');
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
  it('ações incorporadas não criam outro shell nem incluem controle do resumo', () => {
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
    assert.doesNotMatch(html, /mobile-chat-dock-shell|mobile-chat-dock-root|Painel de leitura/);
    assert.match(html, /aria-label="Baixar PDF"/);
    assert.doesNotMatch(html, />Baixar PDF</);
    assert.match(html, /aria-label="Compartilhar"/);
    assert.doesNotMatch(html, /aria-label="Voltar"/);
  });
  it('controle lateral expõe expansão, alvo e feedback acessível', () => {
    for (const open of [true, false]) {
      const html = renderToStaticMarkup(
        React.createElement(MobileSummaryToggle, { open, badge: true, onToggle: noop })
      );
      assert.match(html, /aria-controls="mobile-reading-summary"/);
      assert.ok(html.includes('aria-expanded="' + open + '"'));
      assert.match(html, /h-12 w-11/);
    }
    const src = readFileSync(new URL('./AppMobileDock.tsx', import.meta.url), 'utf8');
    assert.ok(src.indexOf('</MobileDockRoot>') < src.indexOf('<MobileSummaryToggle'));
    assert.match(src, /creationRoute && action/);
  });
});
