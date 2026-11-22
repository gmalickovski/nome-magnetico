import { buildPaidTocEntries } from './pdfTocCatalog.ts';
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

/** DEV-322: jargão proibido no PDF pago do Nome Social. */
const FORBIDDEN_NOME_SOCIAL_PAGO = ['motor v3', 'motor v4', 'regra n5', 'regras ocultas', ' pts', 'n4 ·', 'n5 ·', '(n4)', '(n5)'];

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

    const pDest = await inspectNamedDestinations(Buffer.from(pagoBuf));
    const compactText = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, '').toLowerCase();
    const paidTextPages = pdfToText(Buffer.from(pagoBuf)).split('\f');
    // Letter spacing pode aparecer como espaços entre letras na extração Poppler.
    assert.ok(!('error' in pDest));
    const numbersHeaderPage = paidTextPages[pDest['pdf-harmonizacao-corpo'] - 1];
    assert.ok(numbersHeaderPage, 'cabeçalho do comparativo item por item presente');
    assert.ok(compactText(numbersHeaderPage).includes('antesedepois,itemporitem'), 'tabela comparativa na página esperada');

    const gDest = await inspectNamedDestinations(Buffer.from(gratuitoBuf));
    assert.ok(!('error' in gDest), `gratuito destinos: ${'error' in gDest ? gDest.error : ''}`);
    assert.ok(!('error' in pDest), `pago destinos: ${'error' in pDest ? pDest.error : ''}`);

    assert.ok(gDest['pdf-essencia'] >= 1, 'pdf-essencia gratuito');
    assert.ok(gDest['pdf-sumario'] >= 1, 'pdf-sumario gratuito');
    assert.ok(
      gDest['pdf-essencia-arquetipo'] >= gDest['pdf-essencia'] &&
        gDest['pdf-essencia-arquetipo'] < gDest['pdf-essencia-triangulo-vida'],
      'gratuito: arquétipo na Essência antes do Triângulo da Vida',
    );
    assert.ok(
      gDest['pdf-essencia-karma'] >= gDest['pdf-essencia-triangulo-vida'],
      'gratuito: O Peso do Passado após Triângulo da Vida',
    );
    assert.ok(pDest['pdf-resumo'] > pDest['pdf-sumario'], 'resumo logo após sumário');
    assert.ok(pDest['pdf-intro-leitura'] > pDest['pdf-resumo'], 'como ler após resumo');
    assert.ok(pDest['pdf-essencia'] >= 1, 'pdf-essencia pago');
    assert.ok(pDest['pdf-harmonizacao'] >= 1, 'pdf-harmonizacao pago');
    assert.ok(pDest['pdf-harmonizacao-comparativa'] >= 1, 'pdf-harmonizacao-comparativa pago');
    assert.ok(pDest['pdf-harmonizacao-mapa'] >= pDest['pdf-harmonizacao']);
    assert.ok(pDest['pdf-essencia-arquetipo'] >= pDest['pdf-essencia'] && pDest['pdf-essencia-arquetipo'] < pDest['pdf-essencia-triangulo-vida'], 'arquétipo de nascimento na Essência antes do Triângulo da Vida');
    assert.ok(pDest['pdf-harmonizado-arquetipo'] >= pDest['pdf-nome-harmonizado'] && pDest['pdf-harmonizado-arquetipo'] <= pDest['pdf-harmonizado-triangulo-vida'], 'arquétipo harmonizado na Parte 3 antes/junto do Triângulo da Vida');
    assert.ok(pDest['pdf-harmonizado-arquetipo'] < pDest['pdf-anexos'], 'arquétipo fora dos anexos');
    assert.ok(pDest['pdf-guia'] > pDest['pdf-nome-harmonizado'], 'Parte 4 após Parte 3');
    assert.ok(pDest['pdf-anexos'] > pDest['pdf-treino'], 'Anexos após folha de treino');
    const annexFirstPage = paidTextPages[pDest['pdf-anexos'] - 1];
    assert.ok(compactText(annexFirstPage).includes('triangulopessoal'), 'Anexo 1 abre com Triângulo Pessoal lado a lado');
    assert.equal(pDest['pdf-anexos-triangulos'], pDest['pdf-anexos'], 'triângulos pertencem à abertura de Anexos');
    for (const prefix of ['pdf-essencia-triangulo-', 'pdf-harmonizado-triangulo-']) {
      for (const suffix of ['pessoal', 'social', 'destino']) assert.ok(pDest[prefix + suffix] >= pDest['pdf-anexos-triangulos']);
    }
    assert.ok(pDest['pdf-essencia-triangulo-vida'] < pDest['pdf-anexos-triangulos']);
    assert.ok(pDest['pdf-harmonizado-triangulo-vida'] < pDest['pdf-anexos-triangulos']);
    assert.ok(pDest['pdf-anexos-ciclos'] > pDest['pdf-essencia-triangulo-destino'], 'Ciclos do nome após os 3 anexos de dimensão');
    assert.ok(paidTextPages.length <= 36, `PDF pago enxuto esperado (<=36 págs); got ${paidTextPages.length}`);


    for (const [label, dests, ids] of [
      ['gratuito', gDest, PDF_TOC_ANCHOR_IDS.gratuito],
      ['pago', pDest, buildPaidTocEntries(true).map(e => e.id)],
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

    const gratuitoCompact = compactText(pdfToText(Buffer.from(gratuitoBuf)));
    assert.ok(gratuitoCompact.includes('arquetipovibracional'), 'gratuito contém Arquétipo Vibracional');
    assert.ok(gratuitoCompact.includes('otriangulodavida(nascimento)'), 'gratuito contém Triângulo da Vida');
    for (const removedTitle of [
      'otriangulopessoal(nascimento)',
      'otriangulosocial(nascimento)',
      'otriangulododestino(nascimento)',
    ]) {
      assert.equal(gratuitoCompact.includes(removedTitle), false, `gratuito não deve conter ${removedTitle}`);
    }

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

    const pagoText = pdfToText(Buffer.from(pagoBuf)).toLowerCase();
    for (const snippet of FORBIDDEN_NOME_SOCIAL_PAGO) {
      assert.equal(pagoText.includes(snippet), false, `jargão no PDF pago: "${snippet}"`);
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
