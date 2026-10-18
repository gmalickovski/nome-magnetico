import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  signDownloadPdfPath,
  verifyDownloadPdfRequest,
  computeDownloadPdfSignature,
  DOWNLOAD_PDF_TTL_SECONDS,
} from './signedDownloadUrl';

describe('signedDownloadUrl', () => {
  const secret = 'test-secret-123';
  const leadId = 'lead-uuid-456';
  const baseTimeMs = 1770000000000; // Tempo base simulado

  it('gera caminho assinado e valida com sucesso', () => {
    const signedPath = signDownloadPdfPath(leadId, {
      nowMs: baseTimeMs,
      ttlSeconds: 600,
      secret,
    });

    const url = new URL(`https://nomemagnetico.com.br${signedPath}`);
    const id = url.searchParams.get('id');
    const exp = url.searchParams.get('exp');
    const sig = url.searchParams.get('sig');

    assert.equal(id, leadId);
    assert.equal(exp, String(Math.floor(baseTimeMs / 1000) + 600));
    assert.ok(sig);

    // Validação imediata dentro da validade
    const validResult = verifyDownloadPdfRequest({
      id,
      exp,
      sig,
      nowMs: baseTimeMs + 1000,
      secret,
    });
    assert.equal(validResult.ok, true);
  });

  it('rejeita link com assinatura adulterada (403)', () => {
    const exp = Math.floor(baseTimeMs / 1000) + 600;
    const sig = computeDownloadPdfSignature(leadId, exp, secret);

    const invalidResult = verifyDownloadPdfRequest({
      id: leadId,
      exp: String(exp),
      sig: sig.replace(/[0-9a-f]/, 'z'),
      nowMs: baseTimeMs,
      secret,
    });

    assert.equal(invalidResult.ok, false);
    if (!invalidResult.ok) {
      assert.equal(invalidResult.status, 403);
      assert.match(invalidResult.reason, /inválida/i);
    }
  });

  it('rejeita link expirado com 410 antes de qualquer verificação posterior', () => {
    const exp = Math.floor(baseTimeMs / 1000) + 600;
    const sig = computeDownloadPdfSignature(leadId, exp, secret);

    const expiredResult = verifyDownloadPdfRequest({
      id: leadId,
      exp: String(exp),
      sig,
      nowMs: (exp + 10) * 1000, // 10 segundos após a expiração
      secret,
    });

    assert.equal(expiredResult.ok, false);
    if (!expiredResult.ok) {
      assert.equal(expiredResult.status, 410);
      assert.match(expiredResult.reason, /expirou/i);
    }
  });

  it('respeita a janela de transição para links antigos sem assinatura', () => {
    const cutoffMs = baseTimeMs;
    const oldLeadCreated = new Date(baseTimeMs - 24 * 60 * 60 * 1000).toISOString(); // 1 dia antes do cutoff
    const recentTime = baseTimeMs + 2 * 24 * 60 * 60 * 1000; // 2 dias depois do lead (dentro dos 7 dias)

    const transitionResult = verifyDownloadPdfRequest({
      id: leadId,
      exp: null,
      sig: null,
      leadCreatedAt: oldLeadCreated,
      nowMs: recentTime,
      legacyCutoffMs: cutoffMs,
    });

    assert.equal(transitionResult.ok, true);
    if (transitionResult.ok) {
      assert.equal(transitionResult.isLegacyTransition, true);
    }

    // Após 7 dias da criação do lead antigo, o link legado expira
    const after7Days = new Date(oldLeadCreated).getTime() + (DOWNLOAD_PDF_TTL_SECONDS + 10) * 1000;
    const expiredLegacy = verifyDownloadPdfRequest({
      id: leadId,
      exp: null,
      sig: null,
      leadCreatedAt: oldLeadCreated,
      nowMs: after7Days,
      legacyCutoffMs: cutoffMs,
    });

    assert.equal(expiredLegacy.ok, false);
    if (!expiredLegacy.ok) {
      assert.equal(expiredLegacy.status, 403);
    }
  });
});
