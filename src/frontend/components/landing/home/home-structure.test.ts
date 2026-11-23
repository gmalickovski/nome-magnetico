import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { resolveReducedMotionState } from '../mockups/mockup-timeline-core.js';
import { HOME_COPY, HOME_PATH_URLS } from './home-copy.js';
import { HOME_HERO_STEPS } from './home-hero-steps.js';

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) collectStrings(entry, out);
  }
  return out;
}

describe('DEV-338 · Nova Home: copy [TEXTO], links e linha do tempo do Hero', () => {
  it('marca textos provisórios com [TEXTO] e evita termos proibidos de marca/método', () => {
    const copyPath = path.join(
      process.cwd(),
      'src',
      'frontend',
      'components',
      'landing',
      'home',
      'home-copy.ts',
    );
    const source = readFileSync(copyPath, 'utf8');
    const markers = source.match(/\/\/ \[TEXTO\]/g) ?? [];
    assert.ok(markers.length >= 20, 'esperado marcadores // [TEXTO] nas constantes de copy');

    const texts = collectStrings(HOME_COPY).join(' | ');
    assert.doesNotMatch(texts, /\bastro\b/i);
    assert.doesNotMatch(texts, /incompat[íi]vel/i);
    assert.doesNotMatch(texts, /radiestes|p[eê]ndulo/i);
  });

  it('direciona os 3 caminhos do Hero para o destino correto antes das páginas de nicho', () => {
    assert.equal(HOME_PATH_URLS.social, '/nome-social');
    assert.equal(HOME_PATH_URLS.artistico, '/app/analise/nome-social?caminho=artistico');
    assert.equal(HOME_PATH_URLS.bebe, '/app/analise/nome-social?caminho=bebe');
    assert.equal(HOME_PATH_URLS.analiseGratuita, '#analise-gratuita');

    const hrefs = HOME_COPY.hero.buttons.map((b) => b.href);
    assert.deepEqual(hrefs, [
      '/nome-social',
      '/app/analise/nome-social?caminho=artistico',
      '/app/analise/nome-social?caminho=bebe',
    ]);
  });

  it('linha do tempo do Hero é monotônica e fecha na estrela em reduced-motion', () => {
    for (let i = 1; i < HOME_HERO_STEPS.length; i += 1) {
      assert.ok(
        HOME_HERO_STEPS[i]!.at > HOME_HERO_STEPS[i - 1]!.at,
        'passos de HOME_HERO_STEPS devem avançar monotonicamente',
      );
    }
    assert.equal(HOME_HERO_STEPS[0]!.action, 'path_shown');
    assert.equal(HOME_HERO_STEPS[HOME_HERO_STEPS.length - 1]!.action, 'star_finale');

    const reduced = resolveReducedMotionState(HOME_HERO_STEPS);
    assert.equal(reduced.currentAction, 'star_finale');
    assert.equal(reduced.stepIndex, HOME_HERO_STEPS.length - 1);
  });
});

describe('DEV-338 · Ordem das 10 seções em src/pages/index.astro', () => {
  it('mantém a ordem especificada, remove Votação da Home e prioriza LCP no Hero', () => {
    const indexPath = path.join(process.cwd(), 'src', 'pages', 'index.astro');
    const src = readFileSync(indexPath, 'utf8');

    const orderedTokens = [
      'id="inicio"',
      '<HomeHeroScene client:idle',
      '<HomeAudiencesSection client:visible',
      '<HomeHowItWorksSection client:visible',
      '<HomeAnalysisSection client:visible',
      '<HomeQualityRuleSection client:visible',
      '<HomeDeliverablesSection client:visible',
      '<HomeFreeAnalysisSection client:visible',
      '<SignatureUseCasesSection client:visible',
      '<PricingSection',
      '<FAQSection',
    ];

    let cursor = -1;
    for (const token of orderedTokens) {
      const idx = src.indexOf(token);
      assert.ok(idx > cursor, `esperado encontrar "${token}" após índice ${cursor} em index.astro`);
      cursor = idx;
    }

    assert.doesNotMatch(src, /ProductVotingSection/);
    assert.doesNotMatch(src, /id="inicio"[^>]*opacity-0/);
  });

  it('inclui exemplo de Palco, Shows e Redes nos Usos do Nome', () => {
    const useCasesPath = path.join(
      process.cwd(),
      'src',
      'frontend',
      'components',
      'landing',
      'SignatureUseCasesSection.tsx',
    );
    const src = readFileSync(useCasesPath, 'utf8');
    assert.match(src, /StageSpotlightMockup/);
    assert.match(src, /useCasesStage/);
  });
});
