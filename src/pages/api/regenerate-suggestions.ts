import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase as globalSupabase } from '../../backend/db/supabase';
import { getAnalysis, updateAnalysis } from '../../backend/db/analyses';
import { calcularTodosTriangulos, detectarBloqueios } from '../../backend/numerology/triangle';
import { calcularCincoNumeros } from '../../backend/numerology/numbers';
import { mapearFrequencias } from '../../backend/numerology/karmic';
import {
  avaliarNome,
  calcularScoreV1ComOcorrenciasExtras,
  persistenciaScoreFields,
} from '../../backend/numerology/score';
import {
  analisarNomeSocial,
  analisarNomesSocial,
} from '../../backend/numerology/products/nome-social';
import { NOME_MAGNETICO_COPY } from '../../shared/interactive-engine/presets/nome-magnetico';
import { buildSelectedSocialSummary } from './analyze';
import type { ResultPanelData } from './decide-live';

const regenerateSchema = z.object({
  analysisId: z.string().min(1),
  nomesExcluidos: z.array(z.string().max(150)).max(50).optional(),
  sobrenomesObrigatorios: z.array(z.string().max(80)).max(10).optional(),
  sobrenomesExcluidos: z.array(z.string().max(80)).max(10).optional(),
  estiloPreferido: z
    .enum(['sobrenome_forte', 'ajuste_sutil', 'curto_direto', 'qualquer'])
    .optional(),
  motivoRefinamento: z
    .enum([
      'forcar_sobrenome',
      'preferir_sem_acento',
      'preferir_nome_curto',
      'preferir_nome_completo',
      'testar_variacao_propria',
    ])
    .optional(),
  variacaoPropria: z.string().max(150).optional(),
  selecionarComoPrincipal: z.string().max(150).optional(),
});

function toPtBrDate(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [y, m, d] = trimmed.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  return trimmed;
}

function buildPanelData(nome: string, dataPtBr: string, baseDestino: number): ResultPanelData {
  const avaliacao = avaliarNome(nome, dataPtBr, { calcularPotencial: true });
  const triangulos = calcularTodosTriangulos(nome, dataPtBr);
  const bloqueios = detectarBloqueios(triangulos);
  const cinco = calcularCincoNumeros(nome, dataPtBr);
  const sequenciasVida = Object.keys(triangulos.vida.contagemSequencias ?? {});

  const cincoNumerosList = [
    { label: 'Destino', sublabel: 'Caminho e aprendizado de vida', value: cinco.destino ?? baseDestino, icon: '🧭' },
    { label: 'Expressão', sublabel: 'Talentos e como você se projeta', value: cinco.expressao, icon: '✨' },
    { label: 'Motivação', sublabel: 'Desejos da alma e valores íntimos', value: cinco.motivacao, icon: '🔥' },
    { label: 'Missão', sublabel: 'Propósito maior e legado', value: cinco.missao, icon: '🌟' },
    { label: 'Impressão', sublabel: 'Primeira impressão que você causa', value: cinco.impressao, icon: '👁️' },
  ];

  return {
    nomeExibido: nome,
    score: avaliacao.score_v3,
    potencial: avaliacao.potencial ?? avaliacao.score_v3,
    destino: cinco.destino ?? baseDestino,
    expressao: cinco.expressao,
    motivacao: cinco.motivacao,
    missao: cinco.missao,
    impressao: cinco.impressao,
    cincoNumeros: cincoNumerosList,
    trianguloVidaLinhas: triangulos.vida.linhas,
    bloqueiosCount: bloqueios.length,
    bloqueiosCodigos: bloqueios.map(b => b.codigo),
    compatibilidade: avaliacao.compatibilidade ?? 'neutro',
    temBloqueiosVida: sequenciasVida.length > 0,
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  let user = (locals as any).user;

  if (!user) {
    const authHeader = request.headers.get('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (bearerToken) {
      const { data, error } = await globalSupabase.auth.getUser(bearerToken);
      if (!error && data.user) {
        user = data.user;
      }
    }
  }

  if (!user) {
    return new Response(JSON.stringify({ error: 'Autenticação necessária' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = regenerateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const {
    analysisId,
    nomesExcluidos,
    sobrenomesObrigatorios,
    sobrenomesExcluidos,
    estiloPreferido,
    motivoRefinamento,
    variacaoPropria,
    selecionarComoPrincipal,
  } = parsed.data;

  const analysis = await getAnalysis(analysisId);
  if (!analysis || analysis.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Análise não encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const freqData = (analysis.frequencias_numeros as Record<string, any> | null) ?? {};
  const rankingAnterior = freqData.ranking ?? {};
  const parametrosAnteriores = freqData.parametros_usuario ?? {};

  const nomeNascimento: string =
    (rankingAnterior.nomeNascimento as string | undefined)?.trim() ||
    analysis.nome_completo.trim();
  const dataNascimento = toPtBrDate(
    (rankingAnterior.dataNascimento as string | undefined) || analysis.data_nascimento
  );

  const sobrenomesObrigEfetivos =
    sobrenomesObrigatorios ?? parametrosAnteriores.sobrenomesObrigatorios ?? [];
  const sobrenomesExclEfetivos =
    sobrenomesExcluidos ?? parametrosAnteriores.sobrenomesExcluidos ?? [];
  const estiloEfetivo =
    estiloPreferido ?? parametrosAnteriores.estiloPreferido ?? 'qualquer';

  const resultado = analisarNomesSocial([], nomeNascimento, dataNascimento, {
    aceitaEncurtarOuApelido:
      Boolean(parametrosAnteriores.aceitaEncurtarApelido) ||
      estiloEfetivo === 'curto_direto' ||
      motivoRefinamento === 'preferir_nome_curto',
    ondeVaiUsar: parametrosAnteriores.ondeVaiUsar ?? freqData.ondeVaiUsar ?? [],
    assinaturaAtual: parametrosAnteriores.assinaturaAtual ?? freqData.assinaturaAtual ?? undefined,
    sobrenomesObrigatorios: sobrenomesObrigEfetivos,
    sobrenomesExcluidos: sobrenomesExclEfetivos,
    estiloPreferido: estiloEfetivo,
    nomesExcluidos: selecionarComoPrincipal ? undefined : nomesExcluidos,
    motivoRefinamento,
    variacaoPropria,
  });

  if (selecionarComoPrincipal && selecionarComoPrincipal.trim().length >= 2) {
    const alvoNorm = selecionarComoPrincipal.trim().toLowerCase();
    const escolhido =
      resultado.nomesCandidatos.find(
        c => c.nomeCompleto.trim().toLowerCase() === alvoNorm
      ) ?? analisarNomeSocial(selecionarComoPrincipal.trim(), dataNascimento, 'ia');

    resultado.melhorNome = escolhido;
    resultado.nomesCandidatos = [
      escolhido,
      ...resultado.nomesCandidatos.filter(
        c => c.nomeCompleto.trim().toLowerCase() !== alvoNorm
      ),
    ];
    resultado.top3 = resultado.nomesCandidatos
      .filter(c => c.nomeCompleto.trim().toLowerCase() !== alvoNorm)
      .slice(0, 3);
  }

  const melhor = resultado.melhorNome;
  const scoreFieldsSocial = melhor
    ? persistenciaScoreFields({
        scoreLegado: calcularScoreV1ComOcorrenciasExtras({
          bloqueios: melhor.bloqueios,
          licoesCarmicas: melhor.licoesCarmicas.length,
          tendenciasOcultas: melhor.tendenciasOcultas.length,
          debitosCarmicos: melhor.debitosCarmicos,
          compatibilidade: melhor.compatibilidade,
        }),
        nomeParaV3: melhor.nomeCompleto,
        dataNascimento,
        nomeNascimentoPotencial: nomeNascimento,
      })
    : {};

  const todosTriangulosSocial = melhor
    ? calcularTodosTriangulos(melhor.nomeCompleto, dataNascimento)
    : null;
  const freqMapSocial = melhor ? mapearFrequencias(melhor.nomeCompleto) : {};

  const novosParametrosUsuario = {
    ...parametrosAnteriores,
    sobrenomesObrigatorios: sobrenomesObrigEfetivos,
    sobrenomesExcluidos: sobrenomesExclEfetivos,
    estiloPreferido: estiloEfetivo,
    motivoRefinamento: motivoRefinamento ?? null,
  };

  const resumoAtualizado = buildSelectedSocialSummary({
    nomeNascimento,
    nomeSocial: melhor?.nomeCompleto ?? nomeNascimento,
    score: melhor?.score,
    bloqueios: melhor?.bloqueios?.length ?? 0,
    compatibilidade: melhor?.compatibilidade,
  });

  await updateAnalysis(analysis.id, {
    frequencias_numeros: {
      ...freqData,
      ranking: resultado,
      frequencias: freqMapSocial,
      selectedNomeSocial: melhor?.nomeCompleto ?? null,
      parametros_usuario: novosParametrosUsuario,
    } as unknown,
    numero_expressao: melhor?.expressao ?? null,
    numero_destino: resultado.destino,
    numero_motivacao: melhor?.motivacao ?? null,
    numero_missao: melhor?.missao ?? null,
    numero_impressao: melhor?.impressao ?? null,
    bloqueios: (melhor?.bloqueios ?? []) as unknown[],
    triangulo_vida: (todosTriangulosSocial?.vida as unknown) ?? null,
    triangulo_pessoal: (todosTriangulosSocial?.pessoal as unknown) ?? null,
    triangulo_social: (todosTriangulosSocial?.social as unknown) ?? null,
    triangulo_destino: (todosTriangulosSocial?.destino as unknown) ?? null,
    licoes_carmicas: (melhor?.licoesCarmicas ?? []) as unknown[],
    tendencias_ocultas: (melhor?.tendenciasOcultas ?? []) as unknown[],
    debitos_carmicos: (melhor?.debitosCarmicos ?? []) as unknown[],
    analise_texto: analysis.analise_texto?.startsWith('# Relatorio do Nome Social:')
      ? resumoAtualizado
      : analysis.analise_texto ?? resumoAtualizado,
    ...scoreFieldsSocial,
  });

  const avaliacaoVariacaoPropria =
    variacaoPropria && variacaoPropria.trim().length >= 2
      ? resultado.nomesCandidatos.find(
          c => c.nomeCompleto.trim().toLowerCase() === variacaoPropria.trim().toLowerCase()
        ) ?? analisarNomeSocial(variacaoPropria.trim(), dataNascimento, 'usuario')
      : null;

  const aviso = resultado.avisoSobrenomeExigido ?? null;
  const feedbackMensagem =
    aviso && aviso.precisouAcento
      ? NOME_MAGNETICO_COPY.drawerRefinamento.feedbackSobrenomeComAcentoTemplate
          .replace('{{sobrenome_escolhido}}', aviso.sobrenome)
          .replace('{{nota_nova}}', String(aviso.notaAlcancada))
      : NOME_MAGNETICO_COPY.drawerRefinamento.feedbackPadrao;

  const melhorNorm = (melhor?.nomeCompleto ?? '').trim().toLowerCase();

  // Enriquecimento com ResultPanelData para troca instantânea de modo na UI
  const melhorComPanel = melhor
    ? { ...melhor, panel: buildPanelData(melhor.nomeCompleto, dataNascimento, resultado.destino) }
    : null;

  const top3ComPanel = resultado.top3.map(c => ({
    ...c,
    panel: buildPanelData(c.nomeCompleto, dataNascimento, resultado.destino),
  }));

  const nossasSugestoes = resultado.nomesCandidatos
    .filter(c => c.origemSugerida === 'ia' && c.nomeCompleto.trim().toLowerCase() !== melhorNorm)
    .map(c => ({
      ...c,
      panel: buildPanelData(c.nomeCompleto, dataNascimento, resultado.destino),
    }));

  return new Response(
    JSON.stringify({
      melhorNome: melhorComPanel,
      top3: top3ComPanel,
      nossasSugestoes,
      avaliacaoVariacaoPropria,
      avisoSobrenomeExigido: aviso,
      feedbackMensagem,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
