import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LEGAL_DISCLAIMER,
  sanitizeClientOutput,
  sanitizeClientNivel,
  sanitizeClientCompatibilidade,
} from '../../src/backend/client-mcp/sanitize.js';

describe('nm-client-mcp Sanitization & Compliance Rules (DEV-208)', () => {
  it('substitui incompativel por Tensão Vibracional', () => {
    assert.equal(sanitizeClientNivel('incompativel'), 'Tensão Vibracional');
    assert.equal(sanitizeClientCompatibilidade('incompativel'), 'Tensão Vibracional');
    assert.equal(sanitizeClientNivel('harmonioso'), 'Harmonioso');
    assert.equal(sanitizeClientNivel('neutro'), 'Neutro');
  });

  it('remove chaves proibidas de pesos crus, fórmulas, saúde e provedores de IA', () => {
    const rawData = {
      score: 85,
      nivel: 'Harmonioso',
      aspectoSaude: 'Atenção aos rins e sistema reprodutor',
      pesoCalculado: 14.5,
      formulaAplicada: 'Expressao * Destino / 2',
      modelProvider: 'Anthropic Claude 3.5 Sonnet',
      mensagem: 'Cálculo gerado via Claude no Studio MLK',
      nested: {
        saudeOculta: 'problema cardiaco',
        deducaoPontos: 15,
        valorValido: 'ok',
      },
    };

    const sanitized = sanitizeClientOutput(rawData) as any;

    assert.equal(sanitized.score, 85);
    assert.equal(sanitized.nivel, 'Harmonioso');
    assert.equal(sanitized.aspectoSaude, undefined);
    assert.equal(sanitized.pesoCalculado, undefined);
    assert.equal(sanitized.formulaAplicada, undefined);
    assert.equal(sanitized.modelProvider, undefined);
    assert.equal(sanitized.nested.saudeOculta, undefined);
    assert.equal(sanitized.nested.deducaoPontos, undefined);
    assert.equal(sanitized.nested.valorValido, 'ok');

    // Nomes de provedores e Studio MLK são expurgados do texto
    assert.equal(sanitized.mensagem.includes('Claude'), false);
    assert.equal(sanitized.mensagem.includes('Studio MLK'), false);
    assert.equal(sanitized.mensagem.includes('Nome Magnético'), true);
  });

  it('aviso legal possui texto institucional completo', () => {
    assert.match(LEGAL_DISCLAIMER, /critérios formais e objetivos/);
    assert.match(LEGAL_DISCLAIMER, /não substituindo orientação médica/);
  });
});
