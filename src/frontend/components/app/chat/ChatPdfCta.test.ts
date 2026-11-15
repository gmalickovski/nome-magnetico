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
    assert.match(src, /input\.onPdfSuccess\?\.\(/);
  });

  it('usa rótulos enxutos Gerar Análise e Baixar Análise no header desktop sem fixed bottom', () => {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ChatPdfCta.tsx');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /'Gerar Análise'/);
    assert.match(src, /'Baixar Análise'/);
    assert.doesNotMatch(src, /fixed bottom-6/);
  });

  it('abre modal de conclusão no desktop e mobile com Salvar e Salvar e baixar PDF bloqueados durante processamento', () => {
    const ctaFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ChatPdfCta.tsx');
    const ctaSrc = readFileSync(ctaFile, 'utf8');
    assert.match(ctaSrc, /ChatPdfConcludeModal/);
    assert.match(ctaSrc, /onStickyClick[\s\S]*?openConcludeModal\(\)/);
    assert.match(ctaSrc, /onDockClick[\s\S]*?openConcludeModal\(\)/);
    assert.match(ctaSrc, /runSaveOnly[\s\S]*?waitAnalysisCompleteForPdf[\s\S]*?\/app\/analises/);

    const modalFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ChatPdfConcludeModal.tsx');
    const modalSrc = readFileSync(modalFile, 'utf8');
    assert.match(modalSrc, /Como deseja concluir sua análise\?/);
    assert.match(modalSrc, /Nome escolhido:/);
    assert.match(modalSrc, /closeLabel="Cancelar"/);
    assert.match(modalSrc, /closeDisabled=\{isBusy\}/);
    assert.match(modalSrc, /variant="primary"[\s\S]*?Salvar e baixar PDF/);
    assert.match(modalSrc, /Guarda em Minhas análises e inicia o download\./);
    assert.match(modalSrc, /variant="secondary-gold"[\s\S]*?Salvar/);
    assert.match(modalSrc, /Guarda em Minhas análises e abre essa página\./);
    assert.match(modalSrc, /Você também poderá baixar o PDF depois em Minhas análises\./);

    const uiModalSrc = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'ui', 'Modal.tsx'),
      'utf8',
    );
    assert.match(uiModalSrc, /z-\[110\]/);
    assert.match(uiModalSrc, /data-nm-modal="true"/);
  });
});
