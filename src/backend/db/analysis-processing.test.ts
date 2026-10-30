import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ANALYSIS_STALE_PROCESSING_MS, isAnalysisStatusStale } from './analysis-processing';

describe('analysis-processing', () => {
  it('define timeout de processamento stale em 10 minutos', () => {
    assert.equal(ANALYSIS_STALE_PROCESSING_MS, 10 * 60 * 1000);
  });

  it('detecta processing stale pelo created_at', () => {
    const old = new Date(Date.now() - ANALYSIS_STALE_PROCESSING_MS - 1000).toISOString();
    assert.equal(isAnalysisStatusStale('processing', old), true);
    assert.equal(isAnalysisStatusStale('complete', old), false);
    const recent = new Date().toISOString();
    assert.equal(isAnalysisStatusStale('processing', recent), false);
  });
});
