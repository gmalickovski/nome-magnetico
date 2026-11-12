import { NomeAtualPDF } from '../../frontend/components/pdf/NomeAtualPDF';
import {
  PDF_TOC_ANCHOR_IDS,
  renderProductPdfBuffer,
} from '../../frontend/components/pdf/shared/pdfDynamicRender.ts';
import { buildPotencialCtaQrDataUrl } from '../../frontend/components/pdf/shared/pdfPotencialQr';
import { buildPotencialCtaUrl } from '../../frontend/components/pdf/shared/pdfPotencialCtaUrl';
import { calcularTodosTriangulos, detectarBloqueios } from '../numerology/triangle';
import {
  calcularExpressao,
  calcularDestino,
  calcularMotivacao,
  calcularImpressao,
  calcularMissao,
} from '../numerology/numbers';
import {
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  mapearFrequencias,
  calcularDebitosCarmicos,
} from '../numerology/karmic';
import { avaliarCompatibilidade } from '../numerology/harmonization';
import {
  avaliarNome,
  calcularScoreV1SemOcorrenciasExtras,
  type AvaliacaoScoreNome,
} from '../numerology/score';
import { isScoreV3 } from '../numerology/score-version';
import { calcularPotencialAssinaturaPdfGratuito } from '../numerology/products/nome-social-potencial-pdf';
import { isoBirthDateToPtBr } from './birth-date';

export type FreeLeadAnalysisRecord = Record<string, unknown>;

export type BuiltFreeLeadAnalysis = {
  record: FreeLeadAnalysisRecord;
  scoreLegado: number;
  score: number;
  avaliacaoV3: AvaliacaoScoreNome;
};

export function dbBirthDateToPtBr(dbDate: string): string {
  const iso = dbDate.includes('T') ? dbDate.slice(0, 10) : dbDate.slice(0, 10);
  return isoBirthDateToPtBr(iso);
}

/**
 * Monta o objeto de análise gratuito consumido por {@link NomeAtualPDF}.
 * Mesma forma usada em `/api/teste-bloqueio` e regeneração de PDF.
 */
export function buildFreeLeadAnalysisRecord(input: {
  nomeCompleto: string;
  /** DD/MM/AAAA */
  dataNascimentoPt: string;
  /** YYYY-MM-DD (coluna DATE) */
  dataNascimentoDb: string;
  createdAt: string;
  completedAt?: string;
}): BuiltFreeLeadAnalysis {
  const nome = input.nomeCompleto.trim();
  const dataPt = input.dataNascimentoPt;

  const todosTriangulos = calcularTodosTriangulos(nome, dataPt);
  const bloqueios = detectarBloqueios(todosTriangulos);
  const expressao = calcularExpressao(nome);
  const destino = calcularDestino(dataPt);
  const motivacao = calcularMotivacao(nome);
  const impressao = calcularImpressao(nome);
  const missao = calcularMissao(nome, dataPt);
  const licoesCarmicas = detectarLicoesCarmicas(nome);
  const tendenciasOcultas = detectarTendenciasOcultas(nome);
  const debitosCarmicos = calcularDebitosCarmicos(dataPt, destino, motivacao, expressao);
  const frequencias = mapearFrequencias(nome);
  const scoreLegado = calcularScoreV1SemOcorrenciasExtras({
    bloqueios,
    licoesCarmicas: licoesCarmicas.length,
    tendenciasOcultas: tendenciasOcultas.length,
    debitosCarmicos,
    compatibilidade: avaliarCompatibilidade(expressao, destino),
  });
  const potencialAssinatura = calcularPotencialAssinaturaPdfGratuito(nome, dataPt);
  const avaliacaoV3 = avaliarNome(nome, dataPt, {
    potencial: potencialAssinatura.potencialMax ?? potencialAssinatura.notaBase,
  });
  const score = isScoreV3() ? avaliacaoV3.score_v3 : scoreLegado;
  const completedAt = input.completedAt ?? new Date().toISOString();

  const record: FreeLeadAnalysisRecord = {
    nome_completo: nome,
    data_nascimento: input.dataNascimentoDb,
    numero_expressao: expressao,
    numero_destino: destino,
    numero_motivacao: motivacao,
    numero_missao: missao,
    numero_impressao: impressao,
    numero_personalidade: impressao,
    arcano_regente: todosTriangulos.vida.arcanoRegente,
    bloqueios,
    triangulo_vida: todosTriangulos.vida,
    triangulo_pessoal: todosTriangulos.pessoal,
    triangulo_social: todosTriangulos.social,
    triangulo_destino: todosTriangulos.destino,
    licoes_carmicas: licoesCarmicas,
    tendencias_ocultas: tendenciasOcultas,
    debitos_carmicos: debitosCarmicos,
    frequencias_numeros: {
      frequencias,
      ranking: {
        melhorNome: { nomeCompleto: nome },
        dataNascimento: input.dataNascimentoDb,
      },
    },
    analise_texto: null,
    score,
    score_version: avaliacaoV3.score_version,
    score_v3: avaliacaoV3.score_v3,
    nivel: avaliacaoV3.nivel.codigo,
    potencial: potencialAssinatura.potencialMax ?? potencialAssinatura.notaBase,
    potencial_assinatura_calculado: potencialAssinatura.calculado,
    potencial_assinatura_nota_base: potencialAssinatura.notaBase,
    potencial_assinatura_max: potencialAssinatura.potencialMax,
    score_detalhe: avaliacaoV3,
    is_free: true,
    created_at: input.createdAt,
    updated_at: new Date().toISOString(),
    completed_at: completedAt,
  };

  return { record, scoreLegado, score, avaliacaoV3 };
}

export async function renderFreeLeadPdfBase64(
  analysis: FreeLeadAnalysisRecord,
  userName: string,
): Promise<string> {
  const nome = typeof analysis.nome_completo === 'string' ? analysis.nome_completo : '';
  const ctaUrl = buildPotencialCtaUrl(nome);
  const potencialCtaQrDataUrl = await buildPotencialCtaQrDataUrl(ctaUrl);
  const pdfBuffer = await renderProductPdfBuffer(
    NomeAtualPDF,
    {
      analysis: analysis as never,
      magneticNames: [],
      userName,
      potencialCtaQrDataUrl,
    },
    PDF_TOC_ANCHOR_IDS.gratuito,
  );
  return Buffer.from(pdfBuffer).toString('base64');
}
