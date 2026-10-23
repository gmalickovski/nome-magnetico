import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  maskEmail,
  parseReprocessArgv,
  runReprocessFreeLeads,
  type FreeAnalysisLeadRow,
  type ReprocessLeadDeps,
} from './reprocess-free-leads';

describe('reprocess-free-leads · maskEmail', () => {
  it('mascara parte local mantendo domínio', () => {
    assert.equal(maskEmail('joao.silva@example.com'), 'j***@example.com');
  });
});

describe('reprocess-free-leads · parseReprocessArgv', () => {
  it('dry-run é padrão', () => {
    const opts = parseReprocessArgv(['--ids', 'a,b', '--limit', '3']);
    assert.equal(opts.dryRun, true);
    assert.deepEqual(opts.ids, ['a', 'b']);
    assert.equal(opts.limit, 3);
  });

  it('--execute desliga dry-run', () => {
    const opts = parseReprocessArgv(['--error-like', 'nome-social', '--execute']);
    assert.equal(opts.dryRun, false);
    assert.equal(opts.errorLike, 'nome-social');
  });
});

describe('reprocess-free-leads · runReprocessFreeLeads', () => {
  const lead: FreeAnalysisLeadRow = {
    id: 'lead-1',
    email: 'maria@example.com',
    nome_completo: 'Maria Teste',
    data_nascimento: '1990-05-10',
    status: 'error',
  };

  function mockDeps(overrides?: Partial<ReprocessLeadDeps>) {
    const lines: string[] = [];
    const deps: ReprocessLeadDeps = {
      log: (line) => lines.push(line),
      sleep: async () => {},
      updateProcessing: async () => {},
      savePdf: async () => {},
      sendFreePdf: async () => {},
      markError: async () => {},
      generatePdfBase64: async () => 'ZmFrZQ==',
      ...overrides,
    };
    return { deps, lines };
  }

  it('dry-run não chama side effects', async () => {
    let touched = false;
    const { deps } = mockDeps({
      updateProcessing: async () => {
        touched = true;
      },
    });
    const summary = await runReprocessFreeLeads([lead], { dryRun: true, pauseMs: 0 }, deps);
    assert.equal(summary.listed, 1);
    assert.equal(summary.processed, 0);
    assert.equal(touched, false);
  });

  it('pula leads complete', async () => {
    let touched = false;
    const { deps } = mockDeps({
      updateProcessing: async () => {
        touched = true;
      },
    });
    const summary = await runReprocessFreeLeads(
      [{ ...lead, status: 'complete' }],
      { dryRun: false, pauseMs: 0 },
      deps,
    );
    assert.equal(summary.skippedComplete, 1);
    assert.equal(touched, false);
  });

  it('execute grava PDF e invoca send-free-pdf', async () => {
    const steps: string[] = [];
    const { deps } = mockDeps({
      updateProcessing: async () => {
        steps.push('processing');
      },
      savePdf: async () => {
        steps.push('pdf');
      },
      sendFreePdf: async () => {
        steps.push('send');
      },
    });
    const summary = await runReprocessFreeLeads([lead], { dryRun: false, pauseMs: 0 }, deps);
    assert.equal(summary.processed, 1);
    assert.deepEqual(steps, ['processing', 'pdf', 'send']);
  });

  it('em erro marca lead como error', async () => {
    const errors: string[] = [];
    const { deps } = mockDeps({
      sendFreePdf: async () => {
        throw new Error('smtp down');
      },
      markError: async (_id, message) => {
        errors.push(message);
      },
    });
    const summary = await runReprocessFreeLeads([lead], { dryRun: false, pauseMs: 0 }, deps);
    assert.equal(summary.failed, 1);
    assert.equal(errors[0], 'smtp down');
  });
});
