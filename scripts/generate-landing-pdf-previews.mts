/**
 * Gera PDFs reais de exemplo (fictícios) do Nome Artístico e do Nome do Bebê para as prévias da landing.
 * Uso: NM_PDF_OUT=<pasta> npx tsx scripts/generate-landing-pdf-previews.mts
 * Fixtures copiadas dos testes oficiais dos PDFs (nome-artistico-pdf.test.ts e nome-bebe-chat-pdf.test.ts).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { NomeArtisticoPDF } from '../src/frontend/components/pdf/NomeArtisticoPDF.tsx';
import { NomeBebeChatPDF } from '../src/frontend/components/pdf/NomeBebeChatPDF.tsx';
import { gerarNomesBebe } from '../src/backend/numerology/products/nome-bebe-chat/index.ts';

process.env.SCORE_VERSION = 'v3';
const OUT = process.env.NM_PDF_OUT ?? 'tmp-pdf';
mkdirSync(OUT, { recursive: true });

const artisticAnalysisFixture = {
  id: 'art-analysis-1',
  user_id: 'art-user-1',
  nome_completo: 'Larissa Macedo Machado',
  data_nascimento: '1993-03-30',
  product_type: 'nome_social',
  nome_harmonizado: 'Luna Vale',
  versao_score: 'v3',
  score_v3: 90,
  status: 'complete',
  created_at: '2026-11-22T12:00:00Z',
  frequencias_numeros: {
    selectedNomeSocial: 'Luna Vale',
    ranking: {
      nomeNascimento: 'Larissa Macedo Machado',
      dataNascimento: '30/03/1993',
      melhorNome: { nomeCompleto: 'Luna Vale' },
    },
    perfilChat: {
      motivo: 'artistico',
      areaArtistica: 'cantor',
      detalheArtistico: ['pop'],
      generoPersona: 'feminino',
      imagemArtistica: ['marcante'],
      tipoNomeArtistico: 'ambos',
    },
    nomesArtisticos: {
      escolhido: 'Luna Vale',
      novos: [
        {
          nome: 'Luna Vale',
          nota: 90,
          expressao: 3,
          afinidade: 1,
          explicacao: 'Curto, sonoro e fácil de lembrar para o palco.',
          tecnica: 'ia',
          secao: 'novo',
        },
        {
          nome: 'Aurora Lis',
          nota: 87,
          expressao: 6,
          afinidade: 0.9,
          explicacao: 'Voz acolhedora e conexão imediata com o público.',
          tecnica: 'banco',
          secao: 'novo',
        },
      ],
      proximos: [
        {
          nome: 'Lari Macedo',
          nota: 81,
          expressao: 11,
          afinidade: 0.9,
          explicacao: 'Mantém o apelido e o sobrenome da família.',
          tecnica: 'apelido_sobrenome',
          secao: 'proximo',
        },
        {
          nome: 'Lari Machado',
          nota: 74,
          expressao: 1,
          afinidade: 0.7,
          explicacao: 'Direto, com presença forte.',
          tecnica: 'apelido_sobrenome',
          secao: 'proximo',
        },
      ],
    },
  },
};


const realMotorPrevista = gerarNomesBebe({
  sobrenomes: ['Silva'],
  data: '15/06/2027',
  modoData: 'janela',
  sexo: 'menina',
  estilos: ['classico'],
  nomesPais: ['Laura'],
});
const escolhidoReal = realMotorPrevista.sugestoes[0]!;
const seusNomesComBloqueio = [
  ...(realMotorPrevista.seusNomes.map((s) => ({
    nome: s.nomeCompleto,
    nota: s.score,
    expressao: s.expressao,
    bloqueios: s.bloqueios.length > 0 ? s.bloqueios.map((b) => b.codigo) : ['555'],
    diasBons: s.diasBons,
    diasTotal: s.diasTotal,
    grupo: 'seu' as const,
  }))),
];

const fixtureMeninaPrevista = {
  id: 'bebe-1',
  user_id: 'u-1',
  nome_completo: escolhidoReal.nomeCompleto,
  data_nascimento: '2027-06-15',
  product_type: 'nome_social',
  status: 'complete',
  frequencias_numeros: {
    selectedNomeSocial: escolhidoReal.nomeCompleto,
    perfilChat: {
      motivo: 'bebe',
      bebeMae: 'Mariana Silva',
      bebePai: 'Rafael Costa',
      bebeSituacao: 'nao_nasceu',
      bebeDataTipo: 'prevista',
      bebeSexo: 'menina',
      bebeData: '15/06/2027',
      bebeSobrenomes: ['Silva'],
      bebeNomesPais: ['Laura'],
    },
    nomesBebe: {
      escolhido: escolhidoReal.nomeCompleto,
      seusNomes: seusNomesComBloqueio,
      sugestoes: realMotorPrevista.sugestoes.map((s) => ({
        nome: s.nomeCompleto,
        nota: s.score,
        expressao: s.expressao,
        bloqueios: s.bloqueios.map((b) => b.codigo),
        diasBons: s.diasBons,
        diasTotal: s.diasTotal,
        grupo: s.grupo === 'seu' ? 'menina' : s.grupo,
      })),
      janela: realMotorPrevista.janela,
    },
  },
};


const art = await renderToBuffer(
  React.createElement(NomeArtisticoPDF, {
    analysis: artisticAnalysisFixture as any,
    magneticNames: [],
    userName: 'Larissa',
  }) as any,
);
writeFileSync(`${OUT}/artistico.pdf`, art);

const bebe = await renderToBuffer(
  React.createElement(NomeBebeChatPDF, {
    analysis: fixtureMeninaPrevista as any,
    magneticNames: [],
    userName: 'Mariana',
  }) as any,
);
writeFileSync(`${OUT}/bebe.pdf`, bebe);
console.log('OK', OUT);
