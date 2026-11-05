/**
 * Gera PDFs offline DEV-266 (fictícios). Uso: npm run pdf:dev266-fixtures
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { buildFreeLeadAnalysisRecord } from '../src/backend/public-free-analysis/generate-free-lead-pdf.ts';
import { NomeAtualPDF } from '../src/frontend/components/pdf/NomeAtualPDF.tsx';
import { NomeSocialPDF } from '../src/frontend/components/pdf/NomeSocialPDF.tsx';
import { calcularCincoNumeros } from '../src/backend/numerology/numbers.ts';
import { calcularTodosTriangulos, detectarBloqueios } from '../src/backend/numerology/triangle.ts';
import {
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  calcularDebitosCarmicos,
} from '../src/backend/numerology/karmic.ts';
import { avaliarNome } from '../src/backend/numerology/score.ts';
import { avaliarCompatibilidade } from '../src/backend/numerology/harmonization.ts';
import { buildClientBirthNamePanel } from '../src/backend/numerology/birth-name-panel.ts';
import { analisarNomesSocial, analisarNomeSocial } from '../src/backend/numerology/products/nome-social.ts';
import { getScoreTierVisual } from '../src/frontend/components/landing/score-tier-visual.ts';
import { harmonyStarNumsFromPanel } from '../src/frontend/components/landing/ProductResultFrame.tsx';
import { inspectNamedDestinations } from '../src/frontend/components/pdf/shared/pdfDestinationInspect.ts';

const OUT = process.env.NM_PDF_OUT ?? '/opt/cursor/artifacts/nm-pdf-dev266-round2';
const gitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

process.env.SCORE_VERSION = 'v3';
mkdirSync(OUT, { recursive: true });

const FIXTURE_META = {
  disclaimer:
    'PERSONAGEM FICTÍCIO — exemplo offline DEV-266. Narrativa FIXTURE; não é copy de produção.',
  generationGitSha: gitSha,
  dev266Branch: 'linear/dev-266-pdf-package-a74a',
  generatedAt: new Date().toISOString(),
};

const profile = {
  primeiroNome: 'Alexandra',
  nomeCompleto: 'Alexandra Mendes Vale',
  nomeHarmonizado: 'Alexandra M. Vale',
  dataNascimentoPt: '07/03/1992',
  dataNascimentoDb: '1992-03-07',
};

const FIXTURE_NARRATIVE = `# Relatorio FIXTURE\n\nTexto estático para layout.\n`.trim();
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
const melhorMotor = rankingMotor.melhorNome;
if (!melhorMotor) throw new Error('motor sem melhorNome');

const candidatoAudit = analisarNomeSocial(
  melhorMotor.nomeCompleto,
  profile.dataNascimentoPt,
  melhorMotor.origemSugerida === 'ia' ? 'ia' : 'usuario',
);

const candidatosPdf = rankingMotor.nomesCandidatos.slice(0, 8).map((a) => {
  const base = analisarNomeSocial(
    a.nomeCompleto,
    profile.dataNascimentoPt,
    a.origemSugerida === 'ia' ? 'ia' : 'usuario',
  );
  return {
    nomeCompleto: base.nomeCompleto,
    score: base.score,
    expressao: base.expressao,
    motivacao: base.motivacao,
    impressao: base.impressao,
    destino: base.destino,
    compatibilidade: base.compatibilidade,
    temBloqueio: base.temBloqueio,
    bloqueios: base.bloqueios,
    origemSugerida: base.origemSugerida,
    nivelV3: base.nivelV3,
  };
});

const birthPanel = buildClientBirthNamePanel(profile.nomeCompleto, profile.dataNascimentoPt);
const harmPanel = buildClientBirthNamePanel(profile.nomeHarmonizado, profile.dataNascimentoPt);
const candPanel = buildClientBirthNamePanel(melhorMotor.nomeCompleto, profile.dataNascimentoPt);
const avalBirth = avaliarNome(profile.nomeCompleto, profile.dataNascimentoPt, { calcularPotencial: true });
const avalHarm = avaliarNome(profile.nomeHarmonizado, profile.dataNascimentoPt, { calcularPotencial: true });
const avalCand = avaliarNome(melhorMotor.nomeCompleto, profile.dataNascimentoPt, { calcularPotencial: true });

const cincoBirth = calcularCincoNumeros(profile.nomeCompleto, profile.dataNascimentoDb);
const cincoHarm = calcularCincoNumeros(profile.nomeHarmonizado, profile.dataNascimentoDb);
const cincoCand = calcularCincoNumeros(melhorMotor.nomeCompleto, profile.dataNascimentoDb);
const triBirth = calcularTodosTriangulos(profile.nomeCompleto, profile.dataNascimentoPt);
const triHarm = calcularTodosTriangulos(profile.nomeHarmonizado, profile.dataNascimentoPt);
const triCand = calcularTodosTriangulos(melhorMotor.nomeCompleto, profile.dataNascimentoPt);

const calculatedJson = {
  ...FIXTURE_META,
  profile,
  scores: {
    nascimento: { score_v3: avalBirth.score_v3, tierVisual: getScoreTierVisual(avalBirth.score_v3) },
    assinaturaManual: { score_v3: avalHarm.score_v3, tierVisual: getScoreTierVisual(avalHarm.score_v3) },
    candidatoMotorValidado: {
      nomeCompleto: melhorMotor.nomeCompleto,
      score_v3: avalCand.score_v3,
      tierVisual: getScoreTierVisual(avalCand.score_v3),
      audit: candidatoAudit,
    },
  },
  cincoNumeros: { nascimento: cincoBirth, assinaturaManual: cincoHarm, candidatoMotor: cincoCand },
  bloqueios: {
    nascimento: detectarBloqueios(triBirth).map((b) => b.codigo),
    assinaturaManual: detectarBloqueios(triHarm).map((b) => b.codigo),
    candidatoMotor: detectarBloqueios(triCand).map((b) => b.codigo),
  },
  estrelaCincoNumeros: {
    nascimento: harmonyStarNumsFromPanel(birthPanel),
    assinaturaManual: harmonyStarNumsFromPanel(harmPanel),
    candidatoMotor: harmonyStarNumsFromPanel(candPanel),
  },
  rankingMotor: {
    melhorNome: melhorMotor.nomeCompleto,
    candidatos: candidatosPdf,
  },
  compatibilidade: {
    assinaturaManual: avaliarCompatibilidade(cincoHarm.expressao, cincoHarm.destino),
    candidatoMotor: avaliarCompatibilidade(cincoCand.expressao, cincoCand.destino),
  },
  karma: {
    nascimento: {
      licoes: detectarLicoesCarmicas(profile.nomeCompleto).map((l) => l.numero),
      tendencias: detectarTendenciasOcultas(profile.nomeCompleto).map((t) => t.numero),
      debitos: calcularDebitosCarmicos(
        profile.dataNascimentoDb,
        cincoBirth.destino,
        cincoBirth.motivacao,
        cincoBirth.expressao,
      ).map((d) => d.numero),
    },
  },
};

function buildPaidRecord(assinatura: string) {
  const freqBase = (built.record.frequencias_numeros ?? {}) as Record<string, unknown>;
  return {
    ...built.record,
    id: assinatura === profile.nomeHarmonizado ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002',
    user_id: '00000000-0000-4000-8000-000000000099',
    product_type: 'nome_social',
    nome_harmonizado: assinatura,
    expressao_harmonizada: calcularCincoNumeros(assinatura, profile.dataNascimentoDb).expressao,
    analise_texto: FIXTURE_NARRATIVE,
    status: 'complete',
    versao_score: 'v3',
    frequencias_numeros: {
      ...freqBase,
      selectedNomeSocial: assinatura,
      ranking: {
        ...(freqBase.ranking as object),
        nomeNascimento: profile.nomeCompleto,
        dataNascimento: profile.dataNascimentoDb,
        melhorNome: { nomeCompleto: melhorMotor.nomeCompleto },
        nomesCandidatos: candidatosPdf,
      },
    },
  };
}

function sha256(buf: Buffer) {
  return createHash('sha256').update(buf).digest('hex');
}

const freeRecord = { ...built.record, analise_texto: null };
const paidManual = buildPaidRecord(profile.nomeHarmonizado);
const paidCandidato = buildPaidRecord(melhorMotor.nomeCompleto);

const gratuitoBuf = await renderToBuffer(
  React.createElement(NomeAtualPDF, {
    analysis: freeRecord as never,
    magneticNames: [],
    userName: profile.primeiroNome,
    upgradeOfferLabel: 'EXEMPLO — não comercial',
  }) as never,
);

const pagoManualBuf = await renderToBuffer(
  React.createElement(NomeSocialPDF, {
    analysis: paidManual as never,
    magneticNames: [
      {
        id: 'mn-manual',
        analysis_id: paidManual.id,
        nome_proposto: profile.nomeHarmonizado,
        score_v3: avalHarm.score_v3,
        nivel_v3: avalHarm.nivel.codigo,
        origem: 'fixture_manual',
      },
    ] as never,
    userName: profile.primeiroNome,
  }) as never,
);

const pagoCandidatoBuf = await renderToBuffer(
  React.createElement(NomeSocialPDF, {
    analysis: paidCandidato as never,
    magneticNames: [
      {
        id: 'mn-candidato',
        analysis_id: paidCandidato.id,
        nome_proposto: melhorMotor.nomeCompleto,
        score_v3: avalCand.score_v3,
        nivel_v3: avalCand.nivel.codigo,
        origem: 'fixture_motor_n5',
      },
    ] as never,
    userName: profile.primeiroNome,
  }) as never,
);

writeFileSync(`${OUT}/gratuito.pdf`, gratuitoBuf);
writeFileSync(`${OUT}/pago-assinatura-manual-73-50.pdf`, pagoManualBuf);
writeFileSync(`${OUT}/pago-candidato-motor-validado.pdf`, pagoCandidatoBuf);
writeFileSync(`${OUT}/calculated.json`, JSON.stringify(calculatedJson, null, 2));
writeFileSync(`${OUT}/fixture.json`, JSON.stringify({ ...FIXTURE_META, profile }, null, 2));

const destManual = inspectNamedDestinations(Buffer.from(pagoManualBuf));
const destGratuito = inspectNamedDestinations(Buffer.from(gratuitoBuf));

const manifest = {
  ...FIXTURE_META,
  outputs: {
    gratuito: `${OUT}/gratuito.pdf`,
    pagoAssinaturaManual: `${OUT}/pago-assinatura-manual-73-50.pdf`,
    pagoCandidatoMotor: `${OUT}/pago-candidato-motor-validado.pdf`,
    calculatedJson: `${OUT}/calculated.json`,
  },
  sha256: {
    gratuito: sha256(Buffer.from(gratuitoBuf)),
    pagoAssinaturaManual: sha256(Buffer.from(pagoManualBuf)),
    pagoCandidatoMotor: sha256(Buffer.from(pagoCandidatoBuf)),
    calculatedJson: sha256(Buffer.from(JSON.stringify(calculatedJson, null, 2))),
  },
  namedDestinations: {
    gratuito: destGratuito,
    pagoAssinaturaManual: destManual,
  },
  labels: {
    pagoAssinaturaManual: 'Alexandra M. Vale (manual 73→50)',
    pagoCandidatoMotor: `${melhorMotor.nomeCompleto} (motor ${avalCand.score_v3})`,
  },
};

writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log('OK', OUT, gitSha);
