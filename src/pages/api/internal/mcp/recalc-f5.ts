import type { APIRoute } from 'astro';
import { z } from 'zod';
import { verifyInternalHmacRequest } from '@/backend/security/hmac';
import { getSupabaseAdmin } from '@/backend/db/supabase';
import { getAnalysis, createAnalysis, updateAnalysis } from '@/backend/db/analyses';
import { avaliarNome, calcularScoreV1SemOcorrenciasExtras, persistenciaScoreFields } from '@/backend/numerology/score';
import { calcularTodosTriangulos, detectarBloqueios } from '@/backend/numerology/triangle';
import { calcularCincoNumeros } from '@/backend/numerology/numbers';
import {
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  mapearFrequencias,
  calcularDebitosCarmicos,
} from '@/backend/numerology/karmic';
import { avaliarCompatibilidade } from '@/backend/numerology/harmonization';
import { analisarNomesSocial } from '@/backend/numerology/products/nome-social';

export const prerender = false;

const RecalcF5Schema = z.object({
  analysisId: z.string().uuid('analysisId deve ser um UUID válido'),
  dryRun: z.boolean().optional().default(true),
});

function toDateBr(isoOrBr: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoOrBr)) return isoOrBr;
  if (/^\d{4}-\d{2}-\d{2}/.test(isoOrBr)) {
    const [y, m, d] = isoOrBr.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  return isoOrBr;
}

function toIsoDate(dateStr: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }
  return dateStr;
}

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('X-Internal-Signature');
  const timestampHeader = request.headers.get('X-Internal-Timestamp');

  const auth = verifyInternalHmacRequest({
    rawBody,
    signatureHeader,
    timestampHeader,
  });

  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: auth.error }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let parsedBody: unknown;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parseResult = RecalcF5Schema.safeParse(parsedBody);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: parseResult.error.errors.map((e) => e.message).join(', '),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { analysisId, dryRun } = parseResult.data;
  const supabase = getSupabaseAdmin();

  try {
    const original = await getAnalysis(analysisId);
    if (!original) {
      return new Response(JSON.stringify({ ok: false, error: 'Análise não encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Se já é v3 e não é derivada de outra
    if (original.score_version === 'v3' && !original.parent_analysis_id) {
      return new Response(
        JSON.stringify({
          ok: true,
          status: 'already_v3',
          analysisId: original.id,
          scoreV3: original.score_v3 ?? original.score,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Idempotência: verificar se já existe versão v3 recalculada
    const { data: existingRecalc } = await supabase
      .from('analyses')
      .select('id, score_version, score_v3, score')
      .eq('parent_analysis_id', original.id)
      .eq('score_version', 'v3')
      .maybeSingle();

    if (existingRecalc) {
      return new Response(
        JSON.stringify({
          ok: true,
          status: 'already_recalculated',
          analysisId: existingRecalc.id,
          scoreV3: existingRecalc.score_v3 ?? existingRecalc.score,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const nomeCompleto = original.nome_completo;
    const dataNascimentoBr = toDateBr(original.data_nascimento);
    const dataNascimentoIso = toIsoDate(original.data_nascimento);

    let targetNomeAvaliado = nomeCompleto;
    const origFreqData = (original as any).frequencias_numeros as any;
    const originalRanking = origFreqData?.ranking;
    const originalNomesCandidatos: string[] = Array.isArray(originalRanking?.nomesCandidatos)
      ? originalRanking.nomesCandidatos.map((c: any) => c.nomeCompleto || c.nome).filter(Boolean)
      : [];

    let rankingSocial: any = null;
    if (original.product_type === 'nome_social' && !original.is_free) {
      try {
        const opcoesRanking = {
          aceitaEncurtarOuApelido: Boolean(origFreqData?.aceitaEncurtarApelido),
          ondeVaiUsar: origFreqData?.ondeVaiUsar,
          assinaturaAtual: origFreqData?.assinaturaAtual,
        };
        rankingSocial = analisarNomesSocial(
          originalNomesCandidatos,
          nomeCompleto,
          dataNascimentoBr,
          opcoesRanking,
        );
        if (rankingSocial.melhorNome?.nomeCompleto) {
          targetNomeAvaliado = rankingSocial.melhorNome.nomeCompleto;
        }
      } catch (e) {
        console.warn('[recalc-f5] Aviso ao recalcular ranking de Nome Social:', e);
      }
    }

    const v3Eval = avaliarNome(targetNomeAvaliado, dataNascimentoBr);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          ok: true,
          dry_run: true,
          status: 'simulated',
          originalId: original.id,
          currentVersion: original.score_version || 'v1',
          currentScore: original.score,
          targetNomeAvaliado,
          prospectiveScoreV3: v3Eval.score_v3,
          prospectiveNivel: v3Eval.nivel.codigo,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Execução real do recálculo F5
    const todosTriangulos = calcularTodosTriangulos(targetNomeAvaliado, dataNascimentoBr);
    const bloqueios = detectarBloqueios(todosTriangulos);
    const cincoNumeros = calcularCincoNumeros(targetNomeAvaliado, dataNascimentoBr);
    const licoesCarmicas = detectarLicoesCarmicas(targetNomeAvaliado);
    const tendenciasOcultas = detectarTendenciasOcultas(targetNomeAvaliado);
    const frequenciasNumeros = mapearFrequencias(targetNomeAvaliado);
    const debitosCarmicos = calcularDebitosCarmicos(
      dataNascimentoBr,
      cincoNumeros.destino,
      cincoNumeros.motivacao,
      cincoNumeros.expressao,
    );
    const compatibilidade = avaliarCompatibilidade(cincoNumeros.expressao, cincoNumeros.destino);

    const scoreLegado = calcularScoreV1SemOcorrenciasExtras({
      bloqueios,
      licoesCarmicas: licoesCarmicas.length,
      tendenciasOcultas: tendenciasOcultas.length,
      debitosCarmicos,
      compatibilidade,
    });

    const scoreFields = persistenciaScoreFields({
      scoreLegado,
      nomeParaV3: targetNomeAvaliado,
      dataNascimento: dataNascimentoBr,
      nomeNascimentoPotencial: nomeCompleto,
    });

    const freqDataToSave: any = {
      frequencias: frequenciasNumeros,
      ranking: rankingSocial ?? originalRanking,
      selectedNomeSocial: rankingSocial?.melhorNome?.nomeCompleto ?? origFreqData?.selectedNomeSocial ?? null,
      assinaturaAtual: origFreqData?.assinaturaAtual || null,
      ondeVaiUsar: origFreqData?.ondeVaiUsar || [],
      aceitaEncurtarApelido: Boolean(origFreqData?.aceitaEncurtarApelido),
    };

    const newAnalysis = await createAnalysis({
      userId: original.user_id,
      productType: original.product_type,
      nomeCompleto,
      dataNascimento: dataNascimentoIso,
      isFree: original.is_free,
    });

    await updateAnalysis(newAnalysis.id, {
      numero_expressao: cincoNumeros.expressao,
      numero_destino: cincoNumeros.destino,
      numero_motivacao: cincoNumeros.motivacao,
      numero_missao: cincoNumeros.missao,
      numero_impressao: cincoNumeros.impressao,
      numero_personalidade: cincoNumeros.impressao,
      arcano_regente: todosTriangulos.vida.arcanoRegente,
      bloqueios: bloqueios as unknown[],
      triangulo_vida: todosTriangulos.vida as unknown,
      triangulo_pessoal: todosTriangulos.pessoal as unknown,
      triangulo_social: todosTriangulos.social as unknown,
      triangulo_destino: todosTriangulos.destino as unknown,
      licoes_carmicas: licoesCarmicas as unknown[],
      tendencias_ocultas: tendenciasOcultas as unknown[],
      debitos_carmicos: debitosCarmicos as unknown[],
      frequencias_numeros: freqDataToSave as unknown,
      analise_texto: original.analise_texto,
      ...scoreFields,
      parent_analysis_id: original.id,
      recalculated_from_version: original.score_version || 'v1',
      recalculated_at: new Date().toISOString(),
      status: 'complete',
      completed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        dry_run: false,
        status: 'recalculated',
        originalId: original.id,
        newAnalysisId: newAnalysis.id,
        scoreV3: v3Eval.score_v3,
        nivel: v3Eval.nivel.codigo,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
