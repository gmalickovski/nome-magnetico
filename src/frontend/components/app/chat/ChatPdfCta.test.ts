import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

describe('ChatPdfCta / useChatPdfCta', () => {
  it('usa ensureAnalysisId e lock contra clique duplo', () => {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ChatPdfCta.tsx');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /ensureAnalysisId/);
    assert.match(src, /pdfRunLockRef/);
  });
});
