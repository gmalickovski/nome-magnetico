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
import { InteractiveDecisionEngine } from '../../shared/interactive-engine/engine';
import { determineNextStep } from '../../shared/interactive-engine/router';
import { writeHypothesis } from '../../shared/interactive-engine/writer';
import { applyCorrectionJudge } from '../../shared/interactive-engine/judge';
import { computeRadarAxes } from '../../shared/interactive-engine/radar-axes';
import type { AreaFocoNomeMagnetico } from '../../shared/interactive-engine/copy';

export interface ResultPanelData {
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
});

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
    compatibilidade: core.compatibilidade,
    temBloqueiosVida: sequenciasVida.length > 0,
  };
}

export const POST: APIRoute = async ({ request }) => {
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
  } = parsed.data;

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

    const resultadoSocial = analisarNomesSocial([], nomeLimpo, dataPtBr, {
      ondeVaiUsar: onde_assina,
      sobrenomesObrigatorios: sobrenomes_obrigatorios,
      sobrenomesExcluidos: sobrenomes_excluidos,
      estiloPreferido: estilo_preferido,
      aceitaEncurtarOuApelido: estilo_preferido === 'curto_direto',
    });

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
      sobrenomesDecididos: Boolean(sobrenomes_decididos),
      ondeVaiUsar: onde_assina,
      areaFoco: (area_foco_chip as AreaFocoNomeMagnetico) ?? null,
      subfocoMomento: subfoco_momento ?? null,
      palpiteStatus: palpite_status ?? null,
      estiloPreferido: estilo_preferido ?? null,
      detalheInformado: objetivo_texto,
    });

    // Motor JEV
    const engine = new InteractiveDecisionEngine('nome-magnetico');
    const decision = await engine.evaluate({
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
    });

    // LLM Escritor ou Juiz de Correção
    let reading = decision.palpiteTexto;
    if (palpite_status === 'nao' && objetivo_texto) {
      const judgeRes = applyCorrectionJudge({
        textoCorrecao: objetivo_texto,
        destino,
        notaHoje,
        potencial,
        areaFocoAtual: area_foco_chip,
      });
      reading = judgeRes.leituraAjustada;
    } else if (area_foco_chip) {
      reading = await writeHypothesis({
        areaFoco: area_foco_chip as AreaFocoNomeMagnetico,
        destino,
        notaHoje,
        potencial,
        bloqueio: bloqueioPrincipal,
        relatoUsuario: objetivo_texto,
        alertaComplianceLegal: decision.alertaComplianceLegal,
      });
    }

    // Painel de Resultado Base (Original)
    const basePanel = buildPanelData(nomeLimpo, dataPtBr, destino);

    // Sugestões Enriquecidas com seu respectivo panel (Seção 6C)
    const previewTop3Raw = [
      ...(resultadoSocial.melhorNome ? [resultadoSocial.melhorNome] : []),
      ...resultadoSocial.top3,
    ].slice(0, 3);

    const previewTop3 = previewTop3Raw.map(c => {
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
      areaFoco: area_foco_chip,
      subfocoMomento: subfoco_momento,
      ondeVaiUsar: onde_assina,
      sobrenomesObrigatorios: sobrenomes_obrigatorios,
      sobrenomesExcluidos: sobrenomes_excluidos,
      estiloPreferido: estilo_preferido,
      objetivoTexto: objetivo_texto,
      notaHoje,
      potencial,
      palpiteStatus: palpite_status,
    });

    console.info('[api/decide-live] providerUsed', decision.providerUsed);

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
        avisoSobrenomeExigido: resultadoSocial.avisoSobrenomeExigido ?? null,
        providerUsed: decision.providerUsed,
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
        radarAxes,
        remaining: routerDecision.remainingSteps,
        next_step: routerDecision.nextStep,
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
