/**
 * Brain — orquestra todas as chamadas de IA com Loop Guard.
 * Ponto central de entrada para análises de IA.
 */

import { LoopGuard, logAIUsage } from './loop-guard';
import { callAI, streamAI, getActiveProvider } from './router';
import { SYSTEM_KABBALISTIC } from './prompts/system-kabbalistic';
import { buildAnalysisPrompt, type AnalysisPromptParams } from './prompts/analysis-prompt';
import { buildSuggestionsPrompt, type SuggestionsPromptParams } from './prompts/suggestions-prompt';
import { buildGuidePrompt, type GuidePromptParams } from './prompts/guide-prompt';
import { buildBabyAnalysisPrompt, type BabyPromptParams } from './prompts/baby-prompt';
import { buildCompanyAnalysisPrompt, type CompanyPromptParams } from './prompts/company-prompt';
import { buildSocialAnalysisPrompt, type SocialPromptParams } from './prompts/social-prompt';
import { getModel, type AITask } from './config/models';
import { getArquetipo } from '../numerology/archetypes';
import { calcularTodosTriangulos, detectarBloqueios } from '../numerology/triangle';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from '../numerology/karmic';
import { calcularCincoNumeros } from '../numerology/numbers';
import { logError } from '../utils/error-logger';

// ================================================================
// HELPER INTERNO
// ================================================================

async function runWithGuard(
  buildPrompt: () => string,
  task: AITask,
  userId: string | null,
  analysisId: string | null,
  systemPromptOverride?: string
): Promise<string> {
  const guard = new LoopGuard();
  const provider = await getActiveProvider(task);
  const model = getModel(provider, task);
  const systemPrompt = systemPromptOverride ?? SYSTEM_KABBALISTIC;

  for (let attempt = 1; attempt <= 3; attempt++) {
    guard.canAttempt(attempt);

    try {
      const userPrompt = buildPrompt();
      const response = await callAI(systemPrompt, userPrompt, task, provider);

      guard.recordResponse(response.content, response.tokensInput + response.tokensOutput);

      await logAIUsage({
        userId,
        analysisId,
        provider,
        model,
        task,
        tokensInput: response.tokensInput,
        tokensOutput: response.tokensOutput,
        attemptNumber: attempt,
        similarToPrevious: false,
      });

      return response.content;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number; response?: { status?: number } } | null)?.status
        ?? (err as { status?: number; response?: { status?: number } } | null)?.response?.status;
      const lowerMessage = message.toLowerCase();

      // Groq atingiu limite diário (TPD) → fallback automático para OpenAI.
      // Antes dependia só de `message === 'GROQ_RATE_LIMITED'` (conversão feita em
      // providers/groq.ts) ou de string-matching frágil — se qualquer uma dessas
      // camadas falhasse (ex: instanceof quebrado por dependência duplicada), caía
      // no retry genérico contra o próprio Groq 3x, inútil pra um limite diário, e
      // a análise nunca terminava. Agora checa `status` 429 direto também.
      const isGroqRateLimit = provider === 'groq' && (
        message === 'GROQ_RATE_LIMITED' ||
        status === 429 ||
        lowerMessage.includes('429') ||
        lowerMessage.includes('rate_limit') ||
        lowerMessage.includes('rate limit') ||
        lowerMessage.includes('quota')
      );

      if (isGroqRateLimit) {
        console.warn(`[Brain] Groq indisponível (${message.slice(0, 160)}) — fallback automático para OpenAI`);
        try {
          const userPrompt = buildPrompt();
          const fallback = await callAI(systemPrompt, userPrompt, task, 'openai');
          guard.recordResponse(fallback.content, fallback.tokensInput + fallback.tokensOutput);
          await logAIUsage({
            userId,
            analysisId,
            provider: 'openai',
            model: getModel('openai', task),
            task,
            tokensInput: fallback.tokensInput,
            tokensOutput: fallback.tokensOutput,
            attemptNumber: attempt,
            similarToPrevious: false,
          });
          return fallback.content;
        } catch {
          throw new Error('QUOTA_EXCEEDED');
        }
      }

      if (message.includes('Loop Guard')) {
        await logError({
          type: 'ai_loop',
          severity: 'error',
          userId,
          analysisId,
          message,
          details: { task, provider, model, attempt },
        });
        throw err;
      }
      console.warn(`[Brain] Tentativa ${attempt} falhou: ${message}`);
      if (attempt === 3) {
        await logError({
          type: 'ai_timeout',
          severity: 'critical',
          userId,
          analysisId,
          message: `${task} falhou após 3 tentativas: ${message}`,
          details: { task, provider, model },
        });
        throw new Error(`${task} falhou após 3 tentativas: ${message}`);
      }
    }
  }

  throw new Error(`Brain: ${task} não concluído`);
}

// ================================================================
// NOME MAGNÉTICO PESSOAL
// ================================================================

/**
 * Gera a análise numerológica completa (sem streaming).
 */
export async function generateAnalysis(
  params: AnalysisPromptParams,
  userId: string | null,
  analysisId: string | null
): Promise<string> {
  const paramsWithArquetipo = {
    ...params,
    arquetipo: getArquetipo(params.cincoNumeros.expressao),
  };
  return runWithGuard(() => buildAnalysisPrompt(paramsWithArquetipo), 'analysis', userId, analysisId);
}

/**
 * Gera a análise com streaming (Server-Sent Events).
 */
export async function* streamAnalysis(
  params: AnalysisPromptParams,
  userId: string | null,
  analysisId: string | null
): AsyncGenerator<string, void, unknown> {
  const guard = new LoopGuard();
  const task = 'analysis';
  const provider = await getActiveProvider(task);

  guard.canAttempt(1);

  const userPrompt = buildAnalysisPrompt(params);
  let fullContent = '';

  for await (const chunk of streamAI(SYSTEM_KABBALISTIC, userPrompt, task, provider)) {
    fullContent += chunk;
    yield chunk;
  }

  guard.recordResponse(fullContent, Math.ceil(fullContent.length / 4));

  await logAIUsage({
    userId,
    analysisId,
    provider,
    model: getModel(provider, task),
    task,
    tokensInput: 0,
    tokensOutput: Math.ceil(fullContent.length / 4),
    attemptNumber: 1,
    similarToPrevious: false,
  });
}

/**
 * Gera sugestões de nomes magnéticos.
 */
export async function generateSuggestions(
  params: SuggestionsPromptParams,
  userId: string | null,
  analysisId: string | null
): Promise<string> {
  return runWithGuard(() => buildSuggestionsPrompt(params), 'suggestions', userId, analysisId);
}

/**
 * Gera o guia de implementação do nome magnético.
 */
export async function generateGuide(
  params: GuidePromptParams,
  userId: string | null,
  analysisId: string | null
): Promise<string> {
  return runWithGuard(() => buildGuidePrompt(params), 'guide', userId, analysisId);
}

// ================================================================
// NOME DO BEBÊ
// ================================================================

/**
 * Gera análise IA para seleção de nome de bebê.
 */
export async function generateBabyAnalysis(
  params: BabyPromptParams,
  userId: string | null,
  analysisId: string | null
): Promise<string> {
  const expressaoBebe = params.resultado.melhorNome?.expressao ?? params.resultado.destino;
  const paramsWithArquetipo = {
    ...params,
    arquetipo: getArquetipo(expressaoBebe),
  };
  return runWithGuard(() => buildBabyAnalysisPrompt(paramsWithArquetipo), 'analysis', userId, analysisId);
}

// ================================================================
// NOME DE EMPRESA
// ================================================================

/**
 * Gera análise IA para seleção de nome empresarial.
 */
export async function generateCompanyAnalysis(
  params: CompanyPromptParams,
  userId: string | null,
  analysisId: string | null
): Promise<string> {
  const expressaoEmpresa = params.resultado.melhorNome?.expressao;
  const paramsWithArquetipo = expressaoEmpresa
    ? { ...params, arquetipo: getArquetipo(expressaoEmpresa) }
    : params;
  return runWithGuard(() => buildCompanyAnalysisPrompt(paramsWithArquetipo), 'analysis', userId, analysisId);
}

// ================================================================
// NOME SOCIAL (novo fluxo)
// ================================================================

/**
 * Gera análise IA para seleção de nome social.
 */
export async function generateSocialAnalysis(
  params: SocialPromptParams,
  userId: string | null,
  analysisId: string | null
): Promise<string> {
  const expressaoMelhorNome = params.resultado.melhorNome?.expressao ?? params.resultado.destino;
  const nomeNasc   = params.resultado.nomeNascimento;
  const dataRaw    = params.resultado.dataNascimento;
  const melhorNome = params.resultado.melhorNome;

  const todosTriangulos   = calcularTodosTriangulos(nomeNasc, dataRaw);
  const cincoNasc         = calcularCincoNumeros(nomeNasc, dataRaw);
  const bloqueiosNascList = detectarBloqueios(todosTriangulos);
  const licoesNascList    = detectarLicoesCarmicas(nomeNasc);
  const tendenciasNascList = detectarTendenciasOcultas(nomeNasc);
  const debitosNascList   = calcularDebitosCarmicos(dataRaw, cincoNasc.destino, cincoNasc.motivacao, cincoNasc.expressao);

  let comparacaoHarmonizacao: SocialPromptParams['comparacaoHarmonizacao'];
  if (melhorNome) {
    const cincoSocial          = calcularCincoNumeros(melhorNome.nomeCompleto, dataRaw);
    const licoesSocialList     = detectarLicoesCarmicas(melhorNome.nomeCompleto);
    const tendenciasSocialList = detectarTendenciasOcultas(melhorNome.nomeCompleto);
    const debitosSocialList    = calcularDebitosCarmicos(dataRaw, cincoSocial.destino, cincoSocial.motivacao, cincoSocial.expressao);
    const bloqueiosSocialList  = melhorNome.bloqueios;

    comparacaoHarmonizacao = {
      expressaoNasc: cincoNasc.expressao,  expressaoSocial: cincoSocial.expressao,
      motivacaoNasc: cincoNasc.motivacao,  motivacaoSocial: cincoSocial.motivacao,
      impressaoNasc: cincoNasc.impressao,  impressaoSocial: cincoSocial.impressao,
      missaoNasc:    cincoNasc.missao,     missaoSocial:    cincoSocial.missao,
      bloqueiosAntes:  bloqueiosNascList.length,
      bloqueiosDepois: bloqueiosSocialList.length,
      bloqueiosEliminados: bloqueiosNascList
        .filter(b => !bloqueiosSocialList.some(bh => bh.codigo === b.codigo))
        .map(b => b.titulo ?? b.codigo),
      licoesAntes:      licoesNascList.length,
      licoesDepois:     licoesSocialList.length,
      licoesEliminadas: licoesNascList.filter(l => !licoesSocialList.some(ls => ls.numero === l.numero)).map(l => l.numero),
      licoesNovas:      licoesSocialList.filter(l => !licoesNascList.some(ln => ln.numero === l.numero)).map(l => l.numero),
      tendenciasAntes:       tendenciasNascList.length,
      tendenciasDepois:      tendenciasSocialList.length,
      tendenciasNeutralizadas: tendenciasNascList.filter(t => !tendenciasSocialList.some(ts => ts.numero === t.numero)).map(t => t.numero),
      tendenciasNovas:         tendenciasSocialList.filter(t => !tendenciasNascList.some(tn => tn.numero === t.numero)).map(t => t.numero),
      debitosAntes:    debitosNascList.length,
      debitosDepois:   debitosSocialList.length,
      debitosAliviados: debitosNascList
        .filter(d => !d.fixo && !debitosSocialList.some(ds => ds.numero === d.numero))
        .map(d => d.numero),
      debitosFixos: debitosNascList.filter(d => d.fixo).map(d => d.numero),
    };
  }

  const paramsWithArquetipo = {
    ...params,
    arquetipo: getArquetipo(expressaoMelhorNome),
    arcanoAtual: todosTriangulos.vida.arcanoAtual,
    comparacaoHarmonizacao,
  };
  return runWithGuard(() => buildSocialAnalysisPrompt(paramsWithArquetipo), 'analysis', userId, analysisId);
}

// ================================================================
// SUPORTE — POLIMENTO DE RESPOSTA
// ================================================================

const SYSTEM_SUPPORT_POLISH = `Você é especialista em comunicação ao cliente do Nome Magnético, plataforma premium de numerologia cabalística. Polir mensagens de suporte escritas por agentes humanos antes de enviá-las por e-mail ao cliente.

REGRAS OBRIGATÓRIAS:
1. Mantenha TODA a informação, instruções e orientações do agente — não omita nada
2. Corrija gramática, pontuação e clareza
3. Tom: profissional, empático e acolhedor — condizente com serviço espiritual premium
4. Se não houver saudação, comece com "Olá, [nome do cliente],"
5. Se não houver encerramento, finalize com "Atenciosamente,\nEquipe Nome Magnético"
6. Português brasileiro correto e natural
7. Retorne APENAS o texto melhorado — sem aspas externas, sem explicações adicionais`;

/**
 * Polir resposta do agente de suporte antes de enviar ao cliente.
 * Chamada de sistema (user_id = null) — registrada em ai_usage com task = 'support_polish'.
 */
export async function generateSupportPolish(
  mensagem: string,
  nomeCliente: string = 'Cliente',
): Promise<string> {
  const userPrompt = `Nome do cliente: ${nomeCliente}\n\nTexto do agente para polir:\n\n${mensagem}`;
  return runWithGuard(() => userPrompt, 'support_polish', null, null, SYSTEM_SUPPORT_POLISH);
}
