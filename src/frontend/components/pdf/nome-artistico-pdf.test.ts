import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { writeFileSync, mkdtempSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { NomeArtisticoPDF } from './NomeArtisticoPDF.tsx';
import { assertPdfOfflineHarnessReady } from './shared/pdfOfflinePrerequisites.ts';

const FORBIDDEN_SNIPPETS = [
  'motor v3',
  'motor v4',
  'regra n5',
  'regras ocultas',
  ' pts',
  'n4 ·',
  'n5 ·',
  '(n4)',
  '(n5)',
  'incompatível',
  'incompativel',
  'radiestesia',
  'pêndulo',
  'pendulo',
];

function pdfToText(buf: Buffer): string {
  const dir = mkdtempSync(join(tmpdir(), 'nm-art-pdf-'));
  const path = join(dir, 'art.pdf');
  writeFileSync(path, buf);
  const run = spawnSync('pdftotext', [path, '-'], { encoding: 'utf8', timeout: 60_000 });
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
  assert.equal(run.status, 0, 'pdftotext deve estar disponível (poppler-utils)');
  return run.stdout;
}

describe('DEV-329 · NomeArtisticoPDF', () => {
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

  it('renderiza NomeArtisticoPDF para buffer PDF válido', async () => {
    const buf = await renderToBuffer(
      React.createElement(NomeArtisticoPDF, {
        analysis: artisticAnalysisFixture as any,
        magneticNames: [],
        userName: 'Larissa',
      }) as any,
    );
    assert.ok(buf.length > 2000);
    assert.equal(buf.subarray(0, 5).toString('ascii'), '%PDF-');
  });

  it('gera 6 páginas, contém conteúdo esperado e nenhum termo proibido', async () => {
    assertPdfOfflineHarnessReady();
    const buf = await renderToBuffer(
      React.createElement(NomeArtisticoPDF, {
        analysis: artisticAnalysisFixture as any,
        magneticNames: [],
        userName: 'Larissa',
      }) as any,
    );
    const dir = mkdtempSync(join(tmpdir(), 'nm-art-info-'));
    const path = join(dir, 'art.pdf');
    writeFileSync(path, buf);
    const info = spawnSync('pdfinfo', [path], { encoding: 'utf8', timeout: 30_000 });
    try {
      unlinkSync(path);
    } catch {
      /* ignore */
    }
    assert.equal(info.status, 0);
    const pagesMatch = info.stdout.match(/Pages:\s+(\d+)/);
    assert.equal(Number(pagesMatch?.[1]), 6);

    const text = pdfToText(buf);
    const lower = text.toLowerCase();

    for (const forbidden of FORBIDDEN_SNIPPETS) {
      assert.equal(
        lower.includes(forbidden),
        false,
        `Termo proibido encontrado no PDF artístico: "${forbidden}"`,
      );
    }

    assert.match(text, /LUNA VALE/);
    assert.match(text, /Larissa Macedo Machado/);
    assert.match(text, /Parte 1/);
    assert.match(text, /Parte 2/);
    assert.match(text, /Parte 3/);
    assert.match(text, /Escolhido/);
    assert.match(text, /INPI/);
    assert.match(text, /nome civil/i);
  });
});
