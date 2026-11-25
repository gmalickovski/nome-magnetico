import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ChatLifeTriangleSvg,
  buildLifeTriangleBloqueioPositions,
} from '../../shared/chat-ui/ChatLifeTriangleSvg.js';
import {
  normalizeTimelineSteps,
  resolveReducedMotionState,
  resolveTimelineAt,
} from './mockup-timeline-core.js';
import { PdfMockupPageSheet } from './PdfMockupPages.js';
import {
  DASHBOARD_SCENE_STEPS,
  PDF_FLIP_STEPS,
  RESULT_SCRIPTS,
  SCORE_COUNTER_STEPS,
  STAR_SCENE_STEPS,
  SUGGESTION_CARDS_STEPS,
  TRIANGLE_SCENE_STEPS,
} from './result-scripts.js';
import type { MockupTheme } from './types.js';

function reduceDigit(n: number): number {
  let v = n;
  while (v > 9) {
    v = String(v)
      .split('')
      .reduce((acc, ch) => acc + Number(ch), 0);
  }
  return v;
}

describe('DEV-337 · roteiros de resultado e coerência cabalística', () => {
  const themes: MockupTheme[] = ['social', 'artistico', 'bebe'];

  it('cada tema tem nome de nascimento com bloqueio, nome novo sem bloqueios e nota >= 85', () => {
    for (const theme of themes) {
      const data = RESULT_SCRIPTS[theme];
      assert.ok(data.birth.bloqueiosCodigos.length > 0, `${theme} birth precisa de bloqueio`);
      assert.equal(data.harmonized.bloqueiosCodigos.length, 0);
      assert.ok(data.harmonized.nota > data.birth.nota);
      assert.ok(data.harmonized.nota >= 85);

      const birthPositions = buildLifeTriangleBloqueioPositions(data.birth.linhas);
      assert.ok(birthPositions.size >= 3, `${theme} matriz birth deve conter bloqueio`);
      const harmPositions = buildLifeTriangleBloqueioPositions(data.harmonized.linhas);
      assert.equal(harmPositions.size, 0, `${theme} matriz harmonized deve ser limpa`);
    }
  });

  it('todas as matrizes de triângulo obedecem às somas adjacentes até o Arcano Regente', () => {
    for (const theme of themes) {
      const data = RESULT_SCRIPTS[theme];
      for (const sample of [data.birth, data.harmonized]) {
        const letterCount = sample.nome.replace(/\s+/g, '').length;
        assert.equal(sample.linhas[0]?.length, letterCount);
        assert.equal(sample.linhas.length, letterCount);

        for (let r = 0; r < sample.linhas.length - 1; r++) {
          const row = sample.linhas[r]!;
          const next = sample.linhas[r + 1]!;
          assert.equal(next.length, row.length - 1);
          for (let c = 0; c < next.length; c++) {
            assert.equal(next[c], reduceDigit(row[c]! + row[c + 1]!));
          }
        }

        const apex = sample.linhas[sample.linhas.length - 1]!;
        assert.equal(apex.length, 1);
        assert.equal(apex[0], sample.regente);
      }
    }
  });

  it('sugestões nos 3 temas têm zero bloqueios, nota >= 85 e cobrem variantes Artístico e Bebê', () => {
    for (const theme of themes) {
      for (const item of RESULT_SCRIPTS[theme].suggestions) {
        assert.equal(item.card.bloqueios, 0);
        assert.deepEqual(item.card.vidaBloqueiosCodigos ?? [], []);
        assert.ok(item.card.score >= 85);
      }
    }

    assert.ok(RESULT_SCRIPTS.artistico.suggestions.some((s) => s.secao === 'proximo'));
    assert.ok(RESULT_SCRIPTS.artistico.suggestions.some((s) => s.secao === 'novo'));
    assert.ok((RESULT_SCRIPTS.bebe.babyGoodDays?.length ?? 0) >= 5);
  });

  it('timelines das 6 cenas são ordenadas e terminam no estado final sob reduced-motion', () => {
    const allSteps = [
      STAR_SCENE_STEPS,
      TRIANGLE_SCENE_STEPS,
      SCORE_COUNTER_STEPS,
      SUGGESTION_CARDS_STEPS,
      PDF_FLIP_STEPS,
      DASHBOARD_SCENE_STEPS,
    ];

    for (const raw of allSteps) {
      const normalized = normalizeTimelineSteps(raw);
      assert.equal(normalized[0]!.at, 0);
      const start = resolveTimelineAt(normalized, 0);
      assert.equal(start.stepIndex, 0);
      const reduced = resolveReducedMotionState(normalized);
      assert.equal(reduced.stepIndex, normalized.length - 1);
      assert.equal(reduced.currentAction, normalized[normalized.length - 1]!.action);
    }
  });

  it('ChatLifeTriangleSvg controla linhas visíveis, bloqueios em vermelho e ponta em roxo', () => {
    const linhas = [
      [1, 1, 1, 2],
      [2, 2, 3],
      [4, 5],
      [9],
    ];
    const hiddenRowsHtml = renderToStaticMarkup(
      React.createElement(ChatLifeTriangleSvg, {
        nome: 'ABBA',
        linhas,
        visibleRows: 1,
        highlightBlocks: false,
        highlightApex: false,
      }),
    );
    assert.match(hiddenRowsHtml, /opacity:0/);
    assert.doesNotMatch(hiddenRowsHtml, /#FF6B6B/);
    assert.doesNotMatch(hiddenRowsHtml, /#c084fc/);

    const litHtml = renderToStaticMarkup(
      React.createElement(ChatLifeTriangleSvg, {
        nome: 'ABBA',
        linhas,
        highlightBlocks: true,
        highlightApex: true,
      }),
    );
    assert.match(litHtml, /#FF6B6B/);
    assert.match(litHtml, /#c084fc/);
  });

  it('PdfMockupPageSheet renderiza as 4 páginas nos temas social, artístico e bebê', () => {
    const pages: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
    for (const theme of themes) {
      for (const pageNumber of pages) {
        const html = renderToStaticMarkup(
          React.createElement(PdfMockupPageSheet, { theme, pageNumber }),
        );
        assert.match(html, /NOME MAGNÉTICO/);
        if (theme === 'bebe') {
          assert.match(html, /#FFF6F4/);
        }
      }
    }
  });
});
