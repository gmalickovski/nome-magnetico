import { getArquetipo } from '../../backend/numerology/archetypes';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { avaliarNome } from '../../backend/numerology/score';
import { calcularTodosTriangulos, detectarBloqueios } from '../../backend/numerology/triangle';
import {
  analisarNomesSocial,
  extrairSobrenomes,
} from '../../backend/numerology/products/nome-social';
import { calcularCincoNumeros } from '../../backend/numerology/numbers';
import { buildBirthNamePanel } from '../../backend/numerology/birth-name-panel';
import { buildChatReadingSummary } from '../../backend/numerology/chat-reading-summary';
import { InteractiveDecisionEngine } from '../../shared/interactive-engine/engine';
import { LoopGuard, logAIUsage } from '../../backend/ai/loop-guard';
import { getClientIp, hashClientIp } from '../../backend/security/apiRateLimit';
import { sanitizeOutroText } from '../../shared/interactive-engine/questionnaire-adaptive';
import { determineNextStep } from '../../shared/interactive-engine/router';
import { buildProfilePalpiteText } from '../../shared/interactive-engine/chat-profile-copy';
import { computeRadarAxes } from '../../shared/interactive-engine/radar-axes';
import type { AreaFocoNomeMagnetico } from '../../shared/interactive-engine/copy';
import {
  profileToRankingOpcoes,
  type QuestionnaireProfile,
} from '../../shared/interactive-engine/questionnaire-map';
import { mapSubfocoToEnum } from '../../shared/interactive-engine/questionnaire-adaptive';

export interface ResultPanelData {
  arquetipo?: import('../../shared/archetype-summary').ArchetypeSummary;
  nomeExibido: string;
  score: number;
  potencial: number;
  destino: number;
  expressao: number;
  motivacao: number;
  missao: number;
  impressao: number;
  cincoNumeros: Array<{ label: string; sublabel: string; value: number | null; icon: string }>;
  trianguloVidaLinhas?: number[][];
  bloqueiosCount: number;
  bloqueiosCodigos: string[];
  vidaBloqueiosCodigos?: string[];
  compatibilidade: 'favoravel' | 'neutro' | 'desfavoravel';
  temBloqueiosVida: boolean;
  seloMetodo?: string;
}

const decideLiveSchema = z.object({
  nome_completo: z.string().min(2).max(150),
  data_nascimento: z.string().min(8).max(20),
  objetivo_texto: z.string().max(500).optional().default(''),
  area_foco_chip: z
    .enum([
      'prosperidade_financeira',
      'carreira_negocios',
      'relacionamentos_harmonia',
      'autoestima_expressao',
    ])
    .optional(),
  onde_assina: z
    .array(
      z.enum([
        'identidade_registro',
        'presenca_digital',
        'rotina_trabalho',
        'marca_autoria',
      ])
    )
    .max(4)
    .optional(),
  sobrenomes_obrigatorios: z.array(z.string().max(80)).max(10).optional(),
  sobrenomes_excluidos: z.array(z.string().max(80)).max(10).optional(),
  estilo_preferido: z
    .enum(['sobrenome_forte', 'ajuste_sutil', 'curto_direto', 'qualquer'])
    .optional(),
  subfoco_momento: z
    .enum([
      'reter_ganhos',
      'aumentar_renda',
      'organizar_estabilidade',
      'fechar_contratos',
      'lideranca_promocao',
      'novo_ciclo_profissional',
      'harmonia_afetiva',
      'paz_familiar',
      'novas_conexoes',
      'voz_seguranca',
      'foco_execucao',
      'autoconfianca_identidade',
    ])
    .optional(),
  palpite_status: z.enum(['acertou', 'parcial', 'nao']).optional(),
  sobrenomes_decididos: z.boolean().optional(),
  nome_uso_base: z.string().max(80).optional(),
  relacao_nome: z.string().max(40).optional(),
  onde_assina_raw: z.array(z.string().max(40)).max(5).optional(),
  estilo_presenca: z.array(z.string().max(40)).max(2).optional(),
  subfocos_ordenados: z.array(z.string().max(40)).max(2).optional(),
  abertura_mudanca: z.string().max(40).optional(),
  nome_artistico: z.string().max(80).optional(),
  contexto_leitura: z.array(z.string().max(120)).max(20).optional(),
  // DEV-303: perguntas novas do questionário
  preferencias_assinatura: z
    .array(z.enum(['manter_primeiro_nome', 'sem_acento', 'tanto_faz']))
    .max(3)
    .optional(),
  prioridade_conflito: z.enum(['nota_mais_alta', 'mudar_o_minimo']).optional(),
  area_foco_outro: z.string().max(60).optional(),
  // DEV-320: motivo, ramo artístico e outros usos
  motivo_harmonizacao: z.enum(['dia_a_dia', 'carreira', 'artistico', 'recomeco', 'bebe']).optional(),
  area_artistica: z
    .enum(['cantor', 'ator', 'personagem', 'criador_conteudo', 'escritor', 'dj_produtor', 'outra'])
    .optional(),
  area_artistica_outro: z.string().max(60).optional(),
  detalhe_artistico: z.array(z.string().max(40)).max(2).optional(),
  genero_persona: z.enum(['feminino', 'masculino', 'neutro']).optional(),
  imagem_artistica: z
    .array(z.enum(['marcante', 'sofisticada', 'divertida', 'misteriosa', 'popular']))
    .max(2)
    .optional(),
  tipo_nome_artistico: z.enum(['proximo', 'diferente', 'ambos']).optional(),
  // DEV-326: caminho do bebê (só o que o roteador precisa; sem nomes nem sobrenomes)
  bebe_situacao: z.enum(['nao_nasceu', 'nasceu_sem_registro', 'nasceu_registrado']).optional(),
  bebe_data_tipo: z.enum(['marcada', 'prevista']).optional(),
  bebe_sexo: z.enum(['menina', 'menino', 'indefinido']).optional(),
  bebe_dados_ok: z.boolean().optional(),
  bebe_estilos: z
    .array(z.enum(['classico', 'moderno', 'curto', 'biblico', 'internacional', 'tanto_faz']))
    .max(2)
    .optional(),
  outros_usos: z
    .array(
      z.enum(['empresa_cnpj', 'contratos', 'redes_sociais', 'registro_marca', 'documentos', 'nenhum_outro'])
    )
    .max(6)
    .optional(),
});

/** DEV-320: fluxo com motivo e ramo artístico. Desligar com `NM_CHAT_MOTIVO_ARTISTICO=false`. */
function isFluxoMotivoAtivo(): boolean {
  const raw = (process.env.NM_CHAT_MOTIVO_ARTISTICO ?? import.meta.env?.NM_CHAT_MOTIVO_ARTISTICO ?? '')
    .toString()
    .trim()
    .toLowerCase();
  return raw !== 'false' && raw !== '0' && raw !== 'off';
}

function normalizeDateToPtBr(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }
  return null;
}

function buildPanelData(nome: string, dataPtBr: string, baseDestino: number): ResultPanelData {
  const core = buildBirthNamePanel(nome, dataPtBr);
  const triangulos = calcularTodosTriangulos(nome.trim(), dataPtBr);
  const sequenciasVida = Object.keys(triangulos.vida.contagemSequencias ?? {});
  const destino = core.destino || baseDestino;

  const cincoNumerosList = [
    { label: 'Destino', sublabel: 'Caminho e aprendizado de vida', value: destino, icon: '🧭' },
    { label: 'Expressão', sublabel: 'Talentos e como você se projeta', value: core.expressao, icon: '✨' },
    { label: 'Motivação', sublabel: 'Desejos da alma e valores íntimos', value: core.motivacao, icon: '🔥' },
    { label: 'Missão', sublabel: 'Propósito maior e legado', value: core.missao, icon: '🌟' },
    { label: 'Impressão', sublabel: 'Primeira impressão que você causa', value: core.impressao, icon: '👁️' },
  ];

  return {
    nomeExibido: core.nomeExibido,
    arquetipo: getArquetipo(core.expressao),
    score: core.score,
    potencial: core.potencial,
    destino,
    expressao: core.expressao,
    motivacao: core.motivacao,
    missao: core.missao,
    impressao: core.impressao,
    cincoNumeros: cincoNumerosList,
    trianguloVidaLinhas: core.trianguloVidaLinhas,
    bloqueiosCount: core.bloqueiosCount,
    bloqueiosCodigos: core.bloqueiosCodigos,
    vidaBloqueiosCodigos: core.vidaBloqueiosCodigos,
    compatibilidade: core.compatibilidade,
    temBloqueiosVida: sequenciasVida.length > 0,
  };
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = decideLiveSchema.safeParse(rawBody);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const {
    nome_completo,
    data_nascimento,
    objetivo_texto,
    area_foco_chip,
    onde_assina,
    sobrenomes_obrigatorios,
    sobrenomes_excluidos,
    estilo_preferido,
    subfoco_momento,
    palpite_status,
    sobrenomes_decididos,
    nome_uso_base,
    relacao_nome,
    onde_assina_raw,
    estilo_presenca,
    subfocos_ordenados,
    abertura_mudanca,
    nome_artistico,
    contexto_leitura,
    preferencias_assinatura,
    prioridade_conflito,
    area_foco_outro,
    motivo_harmonizacao,
    area_artistica,
    area_artistica_outro,
    detalhe_artistico,
    genero_persona,
    imagem_artistica,
    tipo_nome_artistico,
    outros_usos,
    bebe_situacao,
    bebe_data_tipo,
    bebe_sexo,
    bebe_dados_ok,
    bebe_estilos,
  } = parsed.data;
  const fluxoMotivoAtivo = isFluxoMotivoAtivo();
  // Com o fluxo desligado, o motivo é ignorado (roteiro e motor da DEV-303).
  const motivo = fluxoMotivoAtivo ? motivo_harmonizacao ?? null : null;

  const dataPtBr = normalizeDateToPtBr(data_nascimento);
  if (!dataPtBr) {
    return new Response(JSON.stringify({ error: 'Data de nascimento inválida.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const nomeLimpo = nome_completo.trim();
    const avaliacaoHoje = avaliarNome(nomeLimpo, dataPtBr, { calcularPotencial: true });
    const triangulos = calcularTodosTriangulos(nomeLimpo, dataPtBr);
    const bloqueios = detectarBloqueios(triangulos);
    const sobrenomesDetectados = extrairSobrenomes(nomeLimpo);

    const questionnaireProfile: QuestionnaireProfile = {
      nomeUsoBase: nome_uso_base ?? null,
      sobrenomesObrigatorios: sobrenomes_obrigatorios ?? [],
      sobrenomesExcluidos: sobrenomes_excluidos ?? [],
      relacaoNome: relacao_nome ?? null,
      ondeAssinaRaw: onde_assina_raw ?? [],
      estiloPresenca: estilo_presenca ?? [],
      areaFoco: area_foco_chip ?? null,
      subfocosOrdenados: subfocos_ordenados ?? [],
      aberturaMudanca: abertura_mudanca ?? null,
      nomeArtistico: nome_artistico ?? null,
      contextoLeituraOutros: contexto_leitura ?? [],
      preferenciasAssinatura: preferencias_assinatura ?? [],
      prioridadeConflito: prioridade_conflito ?? null,
      areaFocoOutro: area_foco_outro ? sanitizeOutroText(area_foco_outro) || null : null,
      motivoHarmonizacao: motivo,
      areaArtistica: area_artistica ?? null,
      areaArtisticaOutro: area_artistica_outro ? sanitizeOutroText(area_artistica_outro) || null : null,
      detalheArtistico: detalhe_artistico ?? [],
      generoPersona: genero_persona ?? null,
      imagemArtistica: imagem_artistica ?? [],
      tipoNomeArtistico: tipo_nome_artistico ?? null,
      outrosUsos: outros_usos ?? [],
    };

    const rankingOpcoes = profileToRankingOpcoes(questionnaireProfile, {
      estiloPreferido: estilo_preferido,
    });

    const resultadoSocial = analisarNomesSocial([], nomeLimpo, dataPtBr, rankingOpcoes);

    const notaHoje = avaliacaoHoje.score_v3;
    const potencial = Math.max(
      avaliacaoHoje.potencial ?? notaHoje,
      resultadoSocial.melhorNome?.score ?? notaHoje
    );
    const destino = resultadoSocial.destino;
    const sequenciasVida = Object.keys(triangulos.vida.contagemSequencias ?? {});
    const bloqueiosCodigos =
      sequenciasVida.length > 0
        ? sequenciasVida
        : bloqueios.map(b => b.codigo);
    const bloqueioPrincipal = bloqueiosCodigos[0] ?? null;

    // Roteador determinístico (código)
    const routerDecision = determineNextStep({
      nomeCompleto: nomeLimpo,
      dataNascimento: dataPtBr,
      nomeUsoDefinido: Boolean(nome_uso_base?.trim()),
      sobrenomesDecididos: Boolean(sobrenomes_decididos),
      relacaoNome: relacao_nome ?? null,
      ondeAssinaDecidido: Boolean(onde_assina_raw?.length || onde_assina?.length),
      estiloPresencaDecidido: Boolean(estilo_presenca?.length),
      areaFoco: (area_foco_chip as AreaFocoNomeMagnetico) ?? null,
      subfocoDecidido: Boolean(subfocos_ordenados?.length),
      aberturaMudanca: abertura_mudanca ?? null,
      ondeAssinaRaw: onde_assina_raw ?? [],
      preferenciasDecididas: Boolean(preferencias_assinatura?.length),
      prioridadeConflito: prioridade_conflito ?? null,
      fluxoMotivoAtivo,
      motivoHarmonizacao: motivo,
      areaArtistica: area_artistica ?? null,
      detalheArtisticoDecidido: Boolean(detalhe_artistico?.length),
      generoPersona: genero_persona ?? null,
      imagemArtisticaDecidida: Boolean(imagem_artistica?.length),
      tipoNomeArtistico: tipo_nome_artistico ?? null,
      outrosUsosDecididos: Boolean(outros_usos?.length),
      bebeSituacao: bebe_situacao ?? null,
      bebeDataTipo: bebe_data_tipo ?? null,
      bebeSexo: bebe_sexo ?? null,
      bebeDadosDecididos: Boolean(bebe_dados_ok),
      bebeEstiloDecidido: Boolean(bebe_estilos?.length),
      palpiteStatus: palpite_status ?? null,
      estiloPreferido: estilo_preferido ?? null,
      detalheInformado: objetivo_texto,
    });

    // DEV-303: teto de custo por visitante/usuário, guarda de tentativas e registro de uso.
    // Chave sem IP puro: `u:<usuário>` ou `ip:<hash>`.
    const userId = locals.user?.id;
    const budgetKey = userId
      ? `u:${userId}`
      : `ip:${hashClientIp(getClientIp(request, clientAddress))}`;

    // Motor JEV
    const engine = new InteractiveDecisionEngine('nome-magnetico');
    const decision = await engine.evaluate(
      {
      nome_completo: nomeLimpo,
      numero_destino: destino,
      nota_hoje: notaHoje,
      potencial,
      bloqueios_triangulos: bloqueiosCodigos,
      relato_consulente: objetivo_texto,
      area_foco_chip,
      onde_assina_chips: onde_assina,
      estilo_preferido_chip: estilo_preferido,
      subfoco_momento_chip: subfoco_momento,
      },
      {
        budgetKey,
        guard: new LoopGuard(),
        onUsage: (usage) => {
          void logAIUsage({
            userId: userId ?? null,
            analysisId: null,
            provider: usage.provider,
            model: usage.model,
            task: 'jev-decision',
            tokensInput: usage.tokensInput,
            tokensOutput: usage.tokensOutput,
            attemptNumber: usage.attemptNumber,
            similarToPrevious: false,
          });
        },
      },
    );

    // Palpite de perfil: só no passo palpite, sem números (copy a partir das respostas)
    let reading = '';
    if (routerDecision.nextStep === 'palpite') {
      reading = buildProfilePalpiteText({
        nomeCompleto: nomeLimpo,
        areaFoco:
          motivo === 'artistico'
            ? null
            : (area_foco_chip as AreaFocoNomeMagnetico) ?? decision.areaFoco,
        subfocoMomento: subfoco_momento ?? decision.subfocoMomento,
        ondeAssina: onde_assina ?? [],
        artistico:
          motivo === 'artistico'
            ? {
                areaArtistica: area_artistica ?? null,
                areaArtisticaOutro: area_artistica_outro
                  ? sanitizeOutroText(area_artistica_outro) || null
                  : null,
                detalheArtistico: detalhe_artistico ?? [],
                generoPersona: genero_persona ?? null,
                imagemArtistica: imagem_artistica ?? [],
                tipoNomeArtistico: tipo_nome_artistico ?? null,
              }
            : undefined,
        sobrenomesObrigatorios: sobrenomes_obrigatorios,
        sobrenomesExcluidos: sobrenomes_excluidos,
        relatoUsuario: [objetivo_texto, ...(contexto_leitura ?? [])].filter(Boolean).join(' '),
        alertaComplianceLegal: decision.alertaComplianceLegal,
        textoCorrecao:
          (palpite_status === 'nao' || palpite_status === 'parcial') && objetivo_texto
            ? objetivo_texto
            : undefined,
      });
    }

    // Painel de Resultado Base (Original)
    const basePanel = buildPanelData(nomeLimpo, dataPtBr, destino);
    const readingSummary = buildChatReadingSummary(nomeLimpo, dataPtBr);

    // Sugestões Enriquecidas com seu respectivo panel (Seção 6C)
    const vistosPreview = new Set<string>();
    const previewTop3Raw = [
      ...(resultadoSocial.melhorNome ? [resultadoSocial.melhorNome] : []),
      ...resultadoSocial.top3,
    ]
      .filter((c) => {
        const k = c.nomeCompleto.trim().toLowerCase();
        if (vistosPreview.has(k)) return false;
        vistosPreview.add(k);
        return true;
      });
    // DEV-301 (R3a): a sugestão de maior nota sempre entra nas 3 do preview.
    const previewVisiveis = previewTop3Raw.slice(0, 3);
    // DEV-317: os 2 selos (Principal e Maior nota) sempre entram nas 3 do preview.
    for (const destaque of [previewTop3Raw.find((c) => c.principal === true), previewTop3Raw.find((c) => c.maiorNota === true)]) {
      if (!destaque || previewVisiveis.includes(destaque) || previewVisiveis.length === 0) continue;
      const idx = [...previewVisiveis].reverse().findIndex((c) => c.maiorNota !== true && c.principal !== true);
      if (idx >= 0) previewVisiveis[previewVisiveis.length - 1 - idx] = destaque;
    }

    const previewTop3 = previewVisiveis.map(c => {
      const candPanel = buildPanelData(c.nomeCompleto, dataPtBr, destino);
      return {
        ...c,
        panel: candPanel,
      };
    });

    // Radar com 5 eixos
    const radarAxes = computeRadarAxes({
      nomeCompleto: nomeLimpo,
      dataNascimento: dataPtBr,
      notaHoje,
      potencial,
      areaFoco: area_foco_chip,
      subfocoMomento:
        subfoco_momento ??
        (subfocos_ordenados?.[0] ? mapSubfocoToEnum(subfocos_ordenados[0]) : undefined),
      ondeVaiUsar: onde_assina,
      sobrenomesObrigatorios: sobrenomes_obrigatorios,
      sobrenomesExcluidos: sobrenomes_excluidos,
      estiloPreferido: estilo_preferido ?? rankingOpcoes.estiloPreferido,
      objetivoTexto: objetivo_texto,
      palpiteStatus: palpite_status,
    });

    // Telemetria sanitizada (sem nome, sem relato, sem chaves): provider, motivo do fallback, tokens e latência.
    const jevTelemetry = decision.telemetry
      ? {
          providerPath: decision.providerPath ?? [],
          fallbackReason: decision.telemetry.fallbackReason ?? null,
          budgetDenial: decision.telemetry.budgetDenial ?? null,
          attempts: decision.telemetry.attempts,
          tokens: decision.telemetry.tokens,
          latencyMs: decision.telemetry.latencyMs,
        }
      : null;
    console.info('[api/decide-live] jev', JSON.stringify({ providerUsed: decision.providerUsed, ...jevTelemetry }));

    return new Response(
      JSON.stringify({
        notaHoje,
        potencial,
        destino,
        bloqueioPrincipal,
        temBloqueiosVida: sequenciasVida.length > 0,
        sequenciasVida,
        trianguloVidaLinhas: triangulos.vida.linhas,
        sobrenomesDetectados,
        previewTop3,
        semOpcoesElegiveis: resultadoSocial.semOpcoesElegiveis ?? false,
        scoreNascimento: resultadoSocial.scoreNascimento ?? notaHoje,
        scoreMinimoSugestao: resultadoSocial.scoreMinimoSugestao,
        avisoSobrenomeExigido: resultadoSocial.avisoSobrenomeExigido ?? null,
        providerUsed: decision.providerUsed,
        jevTelemetry,
        escopoPronto: decision.escopoPronto,
        areaFoco: decision.areaFoco,
        ondeAssina: decision.ondeAssina,
        estiloPresenca: decision.estiloPresenca,
        subfocoMomento: decision.subfocoMomento,
        alertaComplianceLegal: decision.alertaComplianceLegal,
        palpiteTexto: decision.palpiteTexto,
        recomendacaoOpcoesTexto: decision.recomendacaoOpcoesTexto,
        perguntaSubfoco: decision.perguntaSubfoco,
        diagramNodes: decision.diagramNodes,
        reading,
        panel: basePanel,
        readingSummary,
        radarAxes,
        remaining: routerDecision.remainingSteps,
        next_step: routerDecision.nextStep,
        fluxoMotivoAtivo,
        promptSugestao: routerDecision.promptSugestao,
        eyebrow: routerDecision.eyebrow,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[api/decide-live] Erro:', err);
    return new Response(
      JSON.stringify({ error: 'Não foi possível calcular a leitura ao vivo.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
