import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChatPdfEnsureKey,
  runChatPdfEnsureOnce,
  clearChatPdfEnsureInflight,
} from './chat-pdf-ensure-client.ts';

describe('chat-pdf-ensure-client', () => {
  beforeEach(() => {
    clearChatPdfEnsureInflight();
  });

  it('buildChatPdfEnsureKey normaliza e concatena', () => {
    const a = buildChatPdfEnsureKey('  Maria  ', '01/01/1990', 'Ana Silva');
    const b = buildChatPdfEnsureKey('maria', '01/01/1990', 'ana silva');
    assert.equal(a, b);
  });

  it('runChatPdfEnsureOnce deduplica POST paralelo com mesma chave', async () => {
    let calls = 0;
    const run = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 30));
      return 'id-1';
    };
    const key = 'k1';
    const [a, b] = await Promise.all([
      runChatPdfEnsureOnce(key, run),
      runChatPdfEnsureOnce(key, run),
    ]);
    assert.equal(calls, 1);
    assert.equal(a, 'id-1');
    assert.equal(b, 'id-1');
  });

  it('runChatPdfEnsureOnce propaga abort do signal externo', async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await runChatPdfEnsureOnce(
      'abort-key',
      async (signal) => {
        if (signal.aborted) return undefined;
        return 'never';
      },
      controller.signal
    );
    assert.equal(result, undefined);
  });
});
