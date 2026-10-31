import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildInitialMomentReadingText } from './copy.ts';
import { validateMomentReadingText } from './moment-reading-validation.ts';
import { mapDecideLiveResponse } from '../../frontend/components/app/chat/decide-live-bridge.ts';

describe('Leitura do momento (pré seleção)', () => {
  it('template prosperidade não cita potencial harmonizado', () => {
    const text = buildInitialMomentReadingText({
      nome: 'Guilherme Malickovski Correa',
      areaFoco: 'prosperidade_financeira',
      destino: 8,
      notaHoje: 66,
    });
    assert.ok(text.includes('66'));
    assert.ok(text.includes('8'));
    assert.ok(!text.includes('95'));
    assert.ok(!/\b9[0-9]\b/.test(text));
  });

  it('validateMomentReadingText rejeita potencial e aceita template', () => {
    const ctx = { notaHoje: 66, destino: 8 };
    const good = buildInitialMomentReadingText({
      nome: 'Guilherme',
      areaFoco: 'carreira_negocios',
      destino: 8,
      notaHoje: 66,
    });
    assert.equal(validateMomentReadingText(good, ctx), true);
    assert.equal(
      validateMomentReadingText('Sua nota sobe para 95 com harmonização total.', ctx),
      false
    );
    assert.equal(validateMomentReadingText('Texto com score alto.', ctx), false);
  });

  it('mapDecideLiveResponse só emite reading no passo palpite', () => {
    const base = {
      next_step: 'onde_vai_usar',
      remaining: 4,
      reading: 'Leitura que não deve vazar',
      palpiteTexto: 'Palpite antigo com 95',
      areaFoco: 'carreira_negocios',
    };
    const off = mapDecideLiveResponse(base);
    assert.equal(off.reading, '');

    const on = mapDecideLiveResponse({ ...base, next_step: 'palpite' });
    assert.ok(on.reading.includes('Leitura') || on.reading.length > 0);
  });
});
