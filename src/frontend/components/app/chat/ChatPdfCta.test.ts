import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

describe('ChatPdfCta / useChatPdfCta', () => {
  it('usa ensureAnalysisId, lock contra clique duplo e onPdfSuccess', () => {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ChatPdfCta.tsx');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /ensureAnalysisId/);
    assert.match(src, /pdfRunLockRef/);
    assert.match(src, /pdfAbortRef/);
    assert.match(src, /ChatPdfPreparingOverlay/);
    assert.match(src, /setOverlayPhase\('preparing'\)/);
    assert.match(src, /input\.onPdfSuccess\?\.\(\)/);
  });

  it('usa rótulos enxutos Gerar Análise e Baixar Análise no header desktop sem fixed bottom', () => {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ChatPdfCta.tsx');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /'Gerar Análise'/);
    assert.match(src, /'Baixar Análise'/);
    assert.doesNotMatch(src, /fixed bottom-6/);
  });
});
