import type { APIRoute } from 'astro';
import { supabase } from '../../backend/db/supabase';
import { getAnalysis, createAnalysis, updateAnalysis } from '../../backend/db/analyses';
import { avaliarNome, calcularScoreV1SemOcorrenciasExtras, persistenciaScoreFields } from '../../backend/numerology/score';
import { calcularTodosTriangulos, detectarBloqueios } from '../../backend/numerology/triangle';
import { calcularCincoNumeros } from '../../backend/numerology/numbers';
import {
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  mapearFrequencias,
  calcularDebitosCarmicos,
} from '../../backend/numerology/karmic';
import { avaliarCompatibilidade } from '../../backend/numerology/harmonization';
import { analisarNomesSocial } from '../../backend/numerology/products/nome-social';

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

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { analysisId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Payload JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { analysisId } = body;
  if (!analysisId) {
    return new Response(JSON.stringify({ error: 'analysisId é obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const original = await getAnalysis(analysisId);
    if (!original || original.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Análise não encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Se a análise já é v3 e não possui parent (já é atual)
    if (original.score_version === 'v3' && !original.parent_analysis_id) {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyV3: true,
          analysisId: original.id,
          message: 'Esta análise já está no motor v3.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Idempotência: verificar se já existe uma versão recalculada desta análise
    const { data: existingRecalc } = await supabase
      .from('analyses')
      .select('id, score_version')
      .eq('parent_analysis_id', original.id)
      .eq('score_version', 'v3')
      .maybeSingle();

    if (existingRecalc) {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyV3: true,
          analysisId: existingRecalc.id,
          message: 'Análise já recalculada com o motor v3.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const nomeCompleto = original.nome_completo;
    const dataNascimentoBr = toDateBr(original.data_nascimento);
    const dataNascimentoIso = toIsoDate(original.data_nascimento);

    // Avaliação no motor v3
    const v3Eval = avaliarNome(nomeCompleto, dataNascimentoBr);

    // Calcular estruturas numerológicas atualizadas
    const todosTriangulos = calcularTodosTriangulos(nomeCompleto, dataNascimentoBr);
    const bloqueios = detectarBloqueios(todosTriangulos);
    const cincoNumeros = calcularCincoNumeros(nomeCompleto, dataNascimentoBr);
    const licoesCarmicas = detectarLicoesCarmicas(nomeCompleto);
    const tendenciasOcultas = detectarTendenciasOcultas(nomeCompleto);
    const frequenciasNumeros = mapearFrequencias(nomeCompleto);
    const debitosCarmicos = calcularDebitosCarmicos(
      dataNascimentoBr,
      cincoNumeros.destino,
      cincoNumeros.motivacao,
      cincoNumeros.expressao
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
      nomeParaV3: nomeCompleto,
      dataNascimento: dataNascimentoBr,
    });

    // Se for Nome Social pago, recalcular sugestões mantendo o texto existente
    let freqDataToSave: any = {
      frequencias: frequenciasNumeros,
      ranking: (original as any).frequencias_numeros?.ranking,
    };

    if (original.product_type === 'nome_social' && !original.is_free) {
      try {
        const ranking = analisarNomesSocial([], nomeCompleto, dataNascimentoBr);
        freqDataToSave = {
          frequencias: frequenciasNumeros,
          ranking,
          selectedNomeSocial: ranking.melhorNome?.nomeCompleto,
        };
      } catch (e) {
        console.warn('[recalculate-v3] Aviso ao recalcular ranking de Nome Social:', e);
      }
    }

    // Criar nova versão da análise vinculada à original
    const newAnalysis = await createAnalysis({
      userId: user.id,
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
        success: true,
        analysisId: newAnalysis.id,
        scoreV3: v3Eval.score_v3,
        nivel: v3Eval.nivel.codigo,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[recalculate-v3] Erro ao recalcular:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno ao recalcular análise' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
