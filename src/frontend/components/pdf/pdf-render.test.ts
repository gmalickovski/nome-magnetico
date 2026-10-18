import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { NomeAtualPDF } from './NomeAtualPDF.tsx';
import { NomeSocialPDF } from './NomeSocialPDF.tsx';

describe('PDF Render Tests (DEV-192)', () => {
  const baseAnalysis = {
    id: 'test-analysis-123',
    user_id: 'test-user-456',
    nome_completo: 'Guilherme Malickovski Correa',
    data_nascimento: '1990-02-14',
    nome_harmonizado: 'Guilherme Málickovski',
    expressao_harmonizada: 95,
    analise_texto: '## 1. Introdução\nTexto de teste para validação de PDF.\n## Conclusão\nFinalização do teste.',
    versao_score: 'v3',
    score_v3: 66,
    nivel_score_v3: 'N3',
    status: 'complete',
    created_at: '2026-10-18T00:00:00Z',
  };

  const sampleMagneticNames = [
    {
      id: 'mn-1',
      analysis_id: 'test-analysis-123',
      nome_proposto: 'Guilherme Málickovski',
      score: 95,
      score_v3: 95,
      nivel_v3: 'N5',
      origem: 'etapa_2',
      explicacao: 'Harmonização de alta potência',
    },
  ];

  it('renders NomeAtualPDF (Gratuito) successfully to valid PDF buffer', async () => {
    const element = React.createElement(NomeAtualPDF, {
      analysis: baseAnalysis as any,
      magneticNames: sampleMagneticNames as any,
      userName: 'Guilherme',
      upgradeOfferLabel: 'R$ 97,00',
    });

    const buffer = await renderToBuffer(element as any);
    assert.ok(buffer);
    assert.ok(buffer.length > 1000);
    // PDF header starts with %PDF-
    assert.equal(buffer.subarray(0, 5).toString('ascii'), '%PDF-');
  });

  it('renders NomeSocialPDF successfully to valid PDF buffer under v3', async () => {
    const element = React.createElement(NomeSocialPDF, {
      analysis: baseAnalysis as any,
      magneticNames: sampleMagneticNames as any,
      userName: 'Guilherme',
      selectedSocialName: 'Guilherme Málickovski',
    });

    const buffer = await renderToBuffer(element as any);
    assert.ok(buffer);
    assert.ok(buffer.length > 1000);
    assert.equal(buffer.subarray(0, 5).toString('ascii'), '%PDF-');
  });

  it('renders NomeSocialPDF with fallback v1 analysis', async () => {
    const v1Analysis = {
      ...baseAnalysis,
      versao_score: 'v1',
      score_v3: undefined,
      nivel_score_v3: undefined,
    };

    const element = React.createElement(NomeSocialPDF, {
      analysis: v1Analysis as any,
      magneticNames: sampleMagneticNames as any,
      userName: 'Guilherme',
      selectedSocialName: 'Guilherme Málickovski',
    });

    const buffer = await renderToBuffer(element as any);
    assert.ok(buffer);
    assert.ok(buffer.length > 1000);
    assert.equal(buffer.subarray(0, 5).toString('ascii'), '%PDF-');
  });
});
