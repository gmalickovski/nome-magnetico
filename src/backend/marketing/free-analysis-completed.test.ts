import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDefaultFreeAnalysisMarketingUrls,
  createFireFreeAnalysisMarketingEvent,
  resolvePublicFreeAnalysisMarketingConsent,
} from './free-analysis-completed';
import type { FreeAnalysisMarketingNotifyInput } from './free-analysis-completed';

describe('resolvePublicFreeAnalysisMarketingConsent', () => {
  it('sem campo opt_in dispara fluxo DOI (opt_in false, sem data)', () => {
    const result = resolvePublicFreeAnalysisMarketingConsent(undefined);
    assert.deepEqual(result, { send: true, optIn: false, optInEm: null });
  });

  it('opt_in true registra consentimento explícito', () => {
    const result = resolvePublicFreeAnalysisMarketingConsent(true);
    assert.equal(result.send, true);
    if (result.send) {
      assert.equal(result.optIn, true);
      assert.match(result.optInEm ?? '', /^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('opt_in false dispara fluxo DOI/transacional sem consentimento de marketing (optIn: false)', () => {
    assert.deepEqual(resolvePublicFreeAnalysisMarketingConsent(false), {
      send: true,
      optIn: false,
      optInEm: null,
    });
  });
});

describe('buildDefaultFreeAnalysisMarketingUrls', () => {
  it('usa downloadPath público quando informado', () => {
    const urls = buildDefaultFreeAnalysisMarketingUrls('https://nomemagnetico.com.br', 'lead-1', {
      downloadPath: '/api/download-pdf?id=lead-1',
    });
    assert.match(urls.analysisUrl, /download-pdf\?id=lead-1/);
    assert.match(urls.analysisUrl, /utm_source=brevo/);
  });
});

const sampleMarketingInput: FreeAnalysisMarketingNotifyInput = {
  email: 'ana@test.com',
  nomeCompleto: 'Ana Silva',
  analiseId: 'lead-abc',
  score: 55,
  concluidaEm: '2026-10-14T12:00:00.000Z',
  optIn: false,
  optInEm: null,
  analysisUrl: 'https://example.com/pdf',
  offerUrl: 'https://example.com/offer',
  checkoutUrl: 'https://example.com/checkout',
};

describe('createFireFreeAnalysisMarketingEvent', () => {
  it('dispara o sender injetado no sucesso da análise pública', async () => {
    const calls: FreeAnalysisMarketingNotifyInput[] = [];
    const fire = createFireFreeAnalysisMarketingEvent(async (input) => {
      calls.push(input);
    });

    fire(sampleMarketingInput);
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.email, 'ana@test.com');
    assert.equal(calls[0]?.optIn, false);
  });

  it('não propaga falha do sender (fire-and-forget)', async () => {
    const fire = createFireFreeAnalysisMarketingEvent(async () => {
      throw new Error('n8n indisponível');
    });

    assert.doesNotThrow(() => fire(sampleMarketingInput));
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
});
