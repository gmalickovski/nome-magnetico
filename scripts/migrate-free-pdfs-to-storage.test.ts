import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCliArgs } from './migrate-free-pdfs-to-storage.ts';

describe('migrate-free-pdfs-to-storage · parseCliArgs', () => {
  it('define dry-run como padrão quando nenhuma flag é fornecida', () => {
    const opts = parseCliArgs([]);
    assert.equal(opts.isDryRun, true);
    assert.equal(opts.batchSize, 20);
    assert.equal(opts.pauseMs, 500);
    assert.equal(opts.limit, undefined);
  });

  it('habilita execute com a flag --execute', () => {
    const opts = parseCliArgs(['--execute']);
    assert.equal(opts.isDryRun, false);
  });

  it('suporta --limit, --batch-size e --pause-ms customizados', () => {
    const opts = parseCliArgs(['--execute', '--limit', '10', '--batch-size', '5', '--pause-ms', '100']);
    assert.equal(opts.isDryRun, false);
    assert.equal(opts.limit, 10);
    assert.equal(opts.batchSize, 5);
    assert.equal(opts.pauseMs, 100);
  });
});
