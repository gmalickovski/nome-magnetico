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
    assert.doesNotMatch(ctaSrc, /redirectToDashboard\(analysisId,\s*300\)/);
    assert.match(ctaSrc, /readyDownload=/);
    assert.match(ctaSrc, /runSaveOnly[\s\S]*?waitAnalysisCompleteForPdf[\s\S]*?redirectToDashboard\(analysisId\)/);
    assert.match(ctaSrc, /window\.location\.href\s*=\s*'\/app'/);

    const modalFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ChatPdfConcludeModal.tsx');
    const modalSrc = readFileSync(modalFile, 'utf8');
    assert.match(modalSrc, /Como deseja concluir sua análise\?/);
    assert.match(modalSrc, /Nome escolhido:/);
    assert.match(modalSrc, /closeLabel="Cancelar"/);
    assert.match(modalSrc, /closeDisabled=\{isBusy\}/);
    assert.match(modalSrc, /variant="primary"[\s\S]*?Salvar e baixar PDF/);
    assert.match(modalSrc, /Guarda em Minhas análises e prepara o download\./);
    assert.match(modalSrc, /variant="secondary-gold"[\s\S]*?Salvar/);
    assert.match(modalSrc, /Guarda em Minhas análises e volta ao início\./);
    assert.match(modalSrc, /Você também poderá baixar o PDF depois em Minhas análises\./);

    const uiModalSrc = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'ui', 'Modal.tsx'),
      'utf8',
    );
    assert.match(uiModalSrc, /z-\[110\]/);
    assert.match(uiModalSrc, /data-nm-modal="true"/);
  });

  it('padroniza o modal de carregamento de PDF com spinner circular e texto novo em todo o app', () => {
    const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
    const overlaySrc = readFileSync(
      path.join(appDir, 'chat', 'ChatPdfPreparingOverlay.tsx'),
      'utf8',
    );
    assert.match(overlaySrc, /Preparando seu PDF/);
    assert.match(
      overlaySrc,
      /Estamos finalizando a análise completa com a assinatura escolhida e montando o PDF/,
    );
    assert.match(overlaySrc, /animate-spin/);
    assert.match(overlaySrc, /<circle/);
    assert.doesNotMatch(overlaySrc, /role="progressbar"/);

    const btnSrc = readFileSync(path.join(appDir, 'PDFFeedbackButton.tsx'), 'utf8');
    assert.match(btnSrc, /ChatPdfPreparingOverlay/);
    assert.match(btnSrc, /usePdfDownloadOverlay/);
    assert.doesNotMatch(btnSrc, /Preparando seu documento/);
    assert.doesNotMatch(btnSrc, /Enquanto isso, nos diga o que achou/);

    const workspaceSrc = readFileSync(
      path.join(appDir, 'analises', 'MyAnalysesWorkspace.tsx'),
      'utf8',
    );
    assert.match(workspaceSrc, /ChatPdfPreparingOverlay/);
    assert.match(workspaceSrc, /usePdfDownloadOverlay/);
    assert.doesNotMatch(workspaceSrc, /window\.location\.href\s*=\s*`\/api\/generate-pdf/);

    const dockSrc = readFileSync(
      path.join(appDir, 'chat', 'ResultadoMobileDock.tsx'),
      'utf8',
    );
    assert.match(dockSrc, /ChatPdfPreparingOverlay/);
    assert.match(dockSrc, /usePdfDownloadOverlay/);
    assert.doesNotMatch(dockSrc, /window\.location\.href\s*=\s*`\/api\/generate-pdf/);
  });
});
