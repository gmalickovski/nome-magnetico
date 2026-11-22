import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { NomeAtualPDF } from './NomeAtualPDF.tsx';
import { NomeSocialPDF } from './NomeSocialPDF.tsx';
import { PDFTriangleDetailsBlock } from './shared/PDFTriangleDetailsBlock.tsx';
import './nome-artistico-pdf.test.ts';

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

  it('PDFTriangleDetailsBlock ordena Pirâmide -> Bloqueios -> Arcanos', () => {
    const tree = PDFTriangleDetailsBlock({
      data: {
        tipo: 'vida',
        linhas: [[1, 1, 1], [2, 2], [4]],
        arcanoRegente: 1,
        sequenciasNegativas: ['111'],
        arcanosDePassagem: [11, 22],
        arcanoAtual: { numero: 11, periodo: '0-30', idadeInicio: 0, idadeFim: 30 },
      },
      triangulo: 'vida',
      pyramidLabel: 'TRIÂNGULO DA VIDA',
      cellSize: 12,
      letras: ['A', 'A', 'A'],
      bloqueiosTitle: 'Bloqueios do Triângulo da Vida',
      arcanosTitle: 'Arcanos do Triângulo da Vida',
      allBloqueios: [
        {
          codigo: '111',
          titulo: 'Iniciação',
          descricao: 'Teste',
          aspectoSaude: 'Teste saúde',
          triangulos: ['vida'],
        },
      ],
    }) as React.ReactElement<{ children: React.ReactNode[] }>;

    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    assert.equal(children.length, 3);
    const fnName = (el: React.ReactElement) =>
      typeof el.type === 'function' ? el.type.name : String(el.type);
    assert.equal(fnName(children[0]), 'TrianguloPiramideInline');
    // children[1] é o View contendo título + BloqueiosBlock
    assert.match(JSON.stringify(children[1]), /Bloqueios do Triângulo da Vida/);
    assert.equal(fnName(children[2]), 'PDFArcanosBlock');
  });
});
