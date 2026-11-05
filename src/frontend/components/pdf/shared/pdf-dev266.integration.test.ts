import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
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

const FORBIDDEN_SNIPPETS = [
  'Os bloqueios são neutralizados',
  'protegida pela estrela dourada',
  'eliminar os bloqueios',
  'prosperidade sólida e duradoura',
];

function pdfToText(buf: Buffer): string | { error: string } {
  const dir = mkdtempSync(join(tmpdir(), 'nm-pdf-txt-'));
  const path = join(dir, 't.pdf');
  writeFileSync(path, buf);
  const run = spawnSync('pdftotext', [path, '-'], { encoding: 'utf8', timeout: 60_000 });
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
  if (run.status !== 0) return { error: 'pdftotext_unavailable' };
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

  it('named destinations de Essência/Harmonização alinham com início da seção (não última página do bloco)', async () => {
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

    const gratuitoBuf = await renderToBuffer(
      React.createElement(NomeAtualPDF, {
        analysis: { ...built.record, analise_texto: null } as never,
        magneticNames: [],
        userName: 'Alexandra',
        upgradeOfferLabel: 'FIXTURE',
      }) as never,
    );
    const pagoBuf = await renderToBuffer(
      React.createElement(NomeSocialPDF, {
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
      }) as never,
    );

    const gDest = inspectNamedDestinations(Buffer.from(gratuitoBuf));
    const pDest = inspectNamedDestinations(Buffer.from(pagoBuf));
    if ('error' in gDest) {
      assert.fail(`gratuito destinos: ${gDest.error} (instale pypdf para validar)`);
    }
    if ('error' in pDest) {
      assert.fail(`pago destinos: ${pDest.error} (instale pypdf para validar)`);
    }

    assert.ok(gDest['pdf-essencia'] >= 1, 'pdf-essencia gratuito');
    assert.ok(pDest['pdf-essencia'] >= 1, 'pdf-essencia pago');
    assert.ok(pDest['pdf-harmonizacao'] >= 1, 'pdf-harmonizacao pago');

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
      if (typeof text !== 'string') continue;
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
    if (!('error' in fonts)) {
      const joined = fonts.join(' ').toLowerCase();
      assert.ok(
        joined.includes('inter'),
        `Inter embutida esperada em pdffonts; got: ${fonts.join(', ')}`,
      );
    }
  });

  it('candidato do motor (Alêxandra) recalcula score auditável sem herdar fixture stale', () => {
    const rankingMotor = analisarNomesSocial([], profile.nomeCompleto, profile.dataNascimentoPt, {
      assinaturaAtual: profile.nomeHarmonizado,
    });
    const melhor = rankingMotor.melhorNome;
    assert.ok(melhor, 'motor deve retornar melhorNome');
    const recalc = analisarNomeSocial(melhor!.nomeCompleto, profile.dataNascimentoPt, 'usuario');
    assert.equal(recalc.score, melhor!.score);
    assert.ok(recalc.score >= 85, 'candidato validado pelo motor deve ter score alto');
    assert.match(melhor!.nomeCompleto, /[Aa]l[eê]xandra/i);
  });
});
