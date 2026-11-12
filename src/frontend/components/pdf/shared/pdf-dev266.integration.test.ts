import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  PDF_TOC_ANCHOR_IDS,
  renderProductPdfBuffer,
} from './pdfDynamicRender.ts';
import { writeFileSync, mkdtempSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { NomeAtualPDF } from '../NomeAtualPDF.tsx';
import { NomeSocialPDF } from '../NomeSocialPDF.tsx';
import { buildFreeLeadAnalysisRecord } from '../../../../backend/public-free-analysis/generate-free-lead-pdf.ts';
import { analisarNomesSocial } from '../../../../backend/numerology/products/nome-social.ts';
import { analisarNomeSocial } from '../../../../backend/numerology/products/nome-social.ts';
import { assertPdfBodyFontsEmbedded, pdfFontRegistration } from './PDFFonts.ts';
import { inspectNamedDestinations, inspectEmbeddedFonts } from './pdfDestinationInspect.ts';
import { assertPdfOfflineHarnessReady } from './pdfOfflinePrerequisites.ts';

const FORBIDDEN_SNIPPETS = [
  'Os bloqueios são neutralizados',
  'protegida pela estrela dourada',
  'eliminar os bloqueios',
  'prosperidade sólida e duradoura',
  'diretamente proporcional ao uso',
  'padrão compulsivo que perde força',
  'eliminando os padrões compulsivos',
  'A harmonização neutralizou',
];

function pdfToText(buf: Buffer): string {
  const dir = mkdtempSync(join(tmpdir(), 'nm-pdf-txt-'));
  const path = join(dir, 't.pdf');
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

const profile = {
  nomeCompleto: 'Alexandra Mendes Vale',
  nomeHarmonizado: 'Alexandra M. Vale',
  dataNascimentoPt: '07/03/1992',
  dataNascimentoDb: '1992-03-07',
};

describe('DEV-266 · PDF integração offline', () => {
  it('registra Inter Regular/Bold antes do render', () => {
    assertPdfBodyFontsEmbedded();
    assert.equal(pdfFontRegistration.interOk, true);
    assert.equal(pdfFontRegistration.interBoldOk, true);
  });

  it('named destinations, copy proibida e fontes embutidas (exige harness pré-instalado)', async () => {
    assertPdfOfflineHarnessReady();

    const ts = '2026-11-05T12:00:00.000Z';
    const built = buildFreeLeadAnalysisRecord({
      nomeCompleto: profile.nomeCompleto,
      dataNascimentoPt: profile.dataNascimentoPt,
      dataNascimentoDb: profile.dataNascimentoDb,
      createdAt: ts,
      completedAt: ts,
    });
    const rankingMotor = analisarNomesSocial([], profile.nomeCompleto, profile.dataNascimentoPt, {
      assinaturaAtual: profile.nomeHarmonizado,
    });
    const paidRecord = {
      ...built.record,
      product_type: 'nome_social',
      nome_harmonizado: profile.nomeHarmonizado,
      analise_texto: '## FIXTURE\nTexto mínimo.',
      versao_score: 'v3',
      frequencias_numeros: {
        ...(built.record.frequencias_numeros as object),
        selectedNomeSocial: profile.nomeHarmonizado,
        ranking: {
          nomeNascimento: profile.nomeCompleto,
          dataNascimento: profile.dataNascimentoDb,
          melhorNome: rankingMotor.melhorNome
            ? { nomeCompleto: rankingMotor.melhorNome.nomeCompleto }
            : undefined,
          nomesCandidatos: rankingMotor.nomesCandidatos.slice(0, 6).map((a) => ({
            nomeCompleto: a.nomeCompleto,
            origemSugerida: a.origemSugerida,
          })),
        },
      },
    };

    const gratuitoBuf = await renderProductPdfBuffer(
      NomeAtualPDF,
      {
        analysis: { ...built.record, analise_texto: null } as never,
        magneticNames: [],
        userName: 'Alexandra',
        upgradeOfferLabel: 'FIXTURE',
      },
      PDF_TOC_ANCHOR_IDS.gratuito,
    );
    const pagoBuf = await renderProductPdfBuffer(
      NomeSocialPDF,
      {
        analysis: paidRecord as never,
        magneticNames: [
          {
            id: 'mn-1',
            analysis_id: paidRecord.id,
            nome_proposto: profile.nomeHarmonizado,
            score_v3: 50,
            nivel_v3: 'N3',
            origem: 'fixture',
          },
        ] as never,
        userName: 'Alexandra',
      },
      PDF_TOC_ANCHOR_IDS.nome_social,
    );

    const compactText = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, '').toLowerCase();
    const paidTextPages = pdfToText(Buffer.from(pagoBuf)).split('\f');
    // Letter spacing pode aparecer como espaços entre letras na extração Poppler.
    const numbersHeaderPage = paidTextPages.find((page) => compactText(page).includes('os5numerosfundamentais'));
    assert.ok(numbersHeaderPage, 'cabeçalho do comparativo numérico presente');
    assert.ok(compactText(numbersHeaderPage).includes('datadenascimento'), 'cabeçalho permanece na página da primeira linha');

    const gDest = await inspectNamedDestinations(Buffer.from(gratuitoBuf));
    const pDest = await inspectNamedDestinations(Buffer.from(pagoBuf));
    assert.ok(!('error' in gDest), `gratuito destinos: ${'error' in gDest ? gDest.error : ''}`);
    assert.ok(!('error' in pDest), `pago destinos: ${'error' in pDest ? pDest.error : ''}`);

    assert.ok(gDest['pdf-essencia'] >= 1, 'pdf-essencia gratuito');
    assert.ok(gDest['pdf-sumario'] >= 1, 'pdf-sumario gratuito');
    assert.ok(pDest['pdf-essencia'] >= 1, 'pdf-essencia pago');
    assert.ok(pDest['pdf-harmonizacao'] >= 1, 'pdf-harmonizacao pago');
    assert.ok(pDest['pdf-harmonizacao-comparativa'] >= 1, 'pdf-harmonizacao-comparativa pago');

    for (const [label, dests, ids] of [
      ['gratuito', gDest, PDF_TOC_ANCHOR_IDS.gratuito],
      ['pago', pDest, PDF_TOC_ANCHOR_IDS.nome_social],
    ] as const) {
      const sumarioPage = dests['pdf-sumario'];
      for (const id of ids) {
        const p = dests[id];
        assert.ok(p != null && p >= sumarioPage, `${label}: destino ${id} após sumário (p${p})`);
      }
    }

    assert.ok(
      gDest['pdf-essencia'] <= 8,
      `Essência gratuito deve estar no início da seção (got p${gDest['pdf-essencia']})`,
    );
    assert.ok(
      pDest['pdf-essencia'] <= 12,
      `Essência pago deve estar no início da seção (got p${pDest['pdf-essencia']})`,
    );
    assert.ok(
      pDest['pdf-harmonizacao'] <= pDest['pdf-essencia'] + 20,
      `Harmonização não deve cair no fim do bloco longo (got p${pDest['pdf-harmonizacao']})`,
    );

    for (const buf of [gratuitoBuf, pagoBuf]) {
      const text = pdfToText(Buffer.from(buf));
      for (const snippet of FORBIDDEN_SNIPPETS) {
        assert.equal(
          text.includes(snippet),
          false,
          `copy proibida encontrada: "${snippet}"`,
        );
      }
    }

    const dir = mkdtempSync(join(tmpdir(), 'nm-pdf-font-'));
    const pPath = join(dir, 'pago.pdf');
    writeFileSync(pPath, Buffer.from(pagoBuf));
    const fonts = inspectEmbeddedFonts(pPath);
    assert.ok(!('error' in fonts), `pdffonts: ${'error' in fonts ? fonts.error : ''}`);
    const joined = fonts.join(' ').toLowerCase();
    assert.ok(joined.includes('inter'), `Inter embutida esperada; got: ${fonts.join(', ')}`);
    assert.ok(joined.includes('cinzel'), `Cinzel embutida esperada; got: ${fonts.join(', ')}`);
  });

  it('ranking somente chat não gera sugestões extras do motor', () => {
    const ordem = ['Aléxandra Mendes', 'Álexandra Mendes Vale', 'Alexxandra Mendes'];
    const resultado = analisarNomesSocial(ordem, profile.nomeCompleto, profile.dataNascimentoPt, {
      somenteCandidatosInformados: true,
    });
    assert.equal(resultado.nomesCandidatos.length, 3);
    assert.deepEqual(
      resultado.nomesCandidatos.map((c) => c.nomeCompleto),
      ordem,
    );
    assert.equal(
      resultado.nomesCandidatos.some((c) => c.origemSugerida === 'ia'),
      false,
    );
  });

  it('candidato do motor (Alêxandra) recalcula score auditável sem herdar fixture stale', () => {
    const rankingMotor = analisarNomesSocial([], profile.nomeCompleto, profile.dataNascimentoPt, {
      assinaturaAtual: profile.nomeHarmonizado,
    });
    const melhor = rankingMotor.melhorNome;
    assert.ok(melhor, 'motor deve retornar melhorNome');
    const recalc = analisarNomeSocial(melhor!.nomeCompleto, profile.dataNascimentoPt, 'usuario');
    assert.equal(recalc.score, melhor!.score);
    assert.equal(recalc.score, 94);
    assert.match(melhor!.nomeCompleto, /[Aa]l[eê]xandra/i);
  });
});
