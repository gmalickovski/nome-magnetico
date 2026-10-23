import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { executeConsultarScore } from '../src/tools/consultar-score.js';
import { executeGerarAnalise } from '../src/tools/gerar-analise.js';
import { executeExplicarScore } from '../src/tools/explicar-score.js';
import { LEGAL_DISCLAIMER } from '../src/utils/sanitize.js';
import type { ClientInternalAppClient } from '../src/client/app-client.js';

describe('nm-client-mcp Tools Execution & Legal Compliance (DEV-208)', () => {
  it('consultar_score_comprador retorna dados limpos e aviso legal', async () => {
    const mockClient = {
      getScore: async (params: any) => {
        return {
          ok: true,
          score: 85,
          nivel: 'Harmonioso',
          compatibilidade: 'Total',
          aviso_legal: LEGAL_DISCLAIMER,
        };
      },
    } as unknown as ClientInternalAppClient;

    const res = await executeConsultarScore({}, 'user-1', mockClient);
    assert.equal(res.ok, true);
    assert.equal(res.score, 85);
    assert.equal(res.aviso_legal, LEGAL_DISCLAIMER);
  });

  it('gerar_analise_social processa candidatos e inclui aviso legal', async () => {
    const mockClient = {
      generateAnalysis: async (params: any) => {
        return {
          ok: true,
          nome_original: params.nomeCompleto,
          melhor_nome: { nome_completo: 'Juliana Rocha', score: 90 },
          aviso_legal: LEGAL_DISCLAIMER,
        };
      },
    } as unknown as ClientInternalAppClient;

    const res = await executeGerarAnalise(
      { nome_completo: 'Juliana Mendes Rocha', data_nascimento: '10/04/1992' },
      'user-1',
      mockClient,
    );

    assert.equal(res.ok, true);
    assert.equal(res.melhor_nome.nome_completo, 'Juliana Rocha');
    assert.equal(res.aviso_legal, LEGAL_DISCLAIMER);
  });

  it('explicar_score gera explicação didática e inclui aviso legal', async () => {
    const mockClient = {
      explainScore: async (params: any) => {
        return {
          ok: true,
          score: params.score,
          nivel: params.nivel,
          explicacao: 'Seu nome atual apresenta excelente equilíbrio vibracional.',
          aviso_legal: LEGAL_DISCLAIMER,
        };
      },
    } as unknown as ClientInternalAppClient;

    const res = await executeExplicarScore(
      { score: 85, nivel: 'Harmonioso' },
      'user-1',
      mockClient,
    );

    assert.equal(res.ok, true);
    assert.equal(res.score, 85);
    assert.match(res.explicacao, /equilíbrio vibracional/);
    assert.equal(res.aviso_legal, LEGAL_DISCLAIMER);
  });
});
