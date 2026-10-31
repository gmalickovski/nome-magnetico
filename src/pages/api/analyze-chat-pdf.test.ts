import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSelectedSocialSummary } from './analyze.ts';

const analyzeSrc = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'analyze.ts'),
  'utf8'
);

describe('analyze chat PDF (sem LLM)', () => {
  it('reutiliza análise recente quando nome_ja_escolhido + nome_social_principal', () => {
    assert.match(analyzeSrc, /isChatPdfChosenSocial/);
    assert.match(analyzeSrc, /findRecentNomeSocialAnalysisForPdf/);
    assert.match(analyzeSrc, /reused:\s*true/);
  });

  it('ramo nome escolhido chama buildSelectedSocialSummary antes de generateSocialAnalysis', () => {
    const idxChosen = analyzeSrc.indexOf('if (nome_social_principal || nome_ja_escolhido)');
    const idxSocialAi = analyzeSrc.indexOf('await withTimeout(generateSocialAnalysis');
    assert.ok(idxChosen >= 0 && idxSocialAi > idxChosen);
    const chosenBranch = analyzeSrc.slice(idxChosen, idxSocialAi);
    assert.match(chosenBranch, /buildSelectedSocialSummary/);
  });

  it('buildSelectedSocialSummary monta texto determinístico', () => {
    const text = buildSelectedSocialSummary({
      nomeNascimento: 'Maria Silva',
      nomeSocial: 'Ana Silva',
      score: 88,
      bloqueios: 0,
      compatibilidade: 'total',
    });
    assert.match(text, /Ana Silva/);
    assert.match(text, /Maria Silva/);
    assert.match(text, /88/);
  });
});
