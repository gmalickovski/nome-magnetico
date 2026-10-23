import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { signInternalPayload, verifyInternalHmacRequest } from './hmac';

describe('HMAC Internal Auth', () => {
  const secret = 'super-secret-key-12345';
  const now = 1700000000000;
  const rawBody = JSON.stringify({ leadId: 'lead-123', dryRun: true });

  it('valida com sucesso uma assinatura correta dentro da janela', () => {
    const signature = signInternalPayload({ rawBody, timestamp: now, secret });
    const result = verifyInternalHmacRequest({
      rawBody,
      signatureHeader: signature,
      timestampHeader: String(now),
      secretOverride: secret,
      now,
    });

    assert.equal(result.ok, true);
  });

  it('rejeita requisição quando a assinatura está incorreta', () => {
    const result = verifyInternalHmacRequest({
      rawBody,
      signatureHeader: 'invalid-signature-hex',
      timestampHeader: String(now),
      secretOverride: secret,
      now,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
      assert.equal(result.error, 'invalid internal signature');
    }
  });

  it('rejeita requisição expirada fora da janela de drift (replay attack)', () => {
    const oldTimestamp = now - 6 * 60 * 1000; // 6 minutos atrás
    const signature = signInternalPayload({ rawBody, timestamp: oldTimestamp, secret });
    const result = verifyInternalHmacRequest({
      rawBody,
      signatureHeader: signature,
      timestampHeader: String(oldTimestamp),
      secretOverride: secret,
      now,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
      assert.equal(result.error, 'internal request expired or clock skew');
    }
  });

  it('rejeita quando o timestamp é inválido ou ausente', () => {
    const signature = signInternalPayload({ rawBody, timestamp: now, secret });
    const resultNoTs = verifyInternalHmacRequest({
      rawBody,
      signatureHeader: signature,
      timestampHeader: null,
      secretOverride: secret,
      now,
    });
    assert.equal(resultNoTs.ok, false);

    const resultBadTs = verifyInternalHmacRequest({
      rawBody,
      signatureHeader: signature,
      timestampHeader: 'not-a-number',
      secretOverride: secret,
      now,
    });
    assert.equal(resultBadTs.ok, false);
  });

  it('rejeita quando o body é alterado (tampering)', () => {
    const signature = signInternalPayload({ rawBody, timestamp: now, secret });
    const tamperedBody = JSON.stringify({ leadId: 'lead-123', dryRun: false });

    const result = verifyInternalHmacRequest({
      rawBody: tamperedBody,
      signatureHeader: signature,
      timestampHeader: String(now),
      secretOverride: secret,
      now,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
      assert.equal(result.error, 'invalid internal signature');
    }
  });

  it('retorna 503 se o segredo não estiver configurado', () => {
    const result = verifyInternalHmacRequest({
      rawBody,
      signatureHeader: 'sig',
      timestampHeader: String(now),
      secretOverride: '', // empty
      now,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 503);
    }
  });
});
