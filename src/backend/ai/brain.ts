/**
 * Brain — orquestra todas as chamadas de IA com Loop Guard.
 * Ponto central de entrada para análises de IA.
 */

import { LoopGuard, getUserTokensToday, logAIUsage } from './loop-guard';
import {
  encontrarCopyProibida,
  filtrarCandidatasOfertaveis,
  removerFrasesProibidas,
  validarNomesSugeridos,
} from './output-guard';
import { callAI, streamAI, getActiveProvider } from './router';
import { SYSTEM_KABBALISTIC } from './prompts/system-kabbalistic';
import { buildAnalysisPrompt, type AnalysisPromptParams } from './prompts/analysis-prompt';
import { buildSuggestionsPrompt, type SuggestionsPromptParams } from './prompts/suggestions-prompt';
import { buildGuidePrompt, type GuidePromptParams } from './prompts/guide-prompt';
import { buildBabyAnalysisPrompt, type BabyPromptParams } from './prompts/baby-prompt';
import { buildCompanyAnalysisPrompt, type CompanyPromptParams } from './prompts/company-prompt';
import { buildSocialAnalysisPrompt, type SocialPromptParams } from './prompts/social-prompt';
import {
  SYSTEM_ARTISTIC_NAMES,
  buildArtisticNamesPrompt,
  type ArtisticNamesPromptParams,
} from './prompts/artistic-prompt';
import { getModel, type AITask } from './config/models';
import { getArquetipo } from '../numerology/archetypes';
import { calcularTodosTriangulos, detectarBloqueios } from '../numerology/triangle';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from '../numerology/karmic';
import { calcularCincoNumeros } from '../numerology/numbers';
import { logError } from '../utils/error-logger';

// ================================================================
// HELPER INTERNO
// ================================================================

/** A saída da IA foi recusada pelas regras do produto: a tentativa é refeita. */
export class OutputRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutputRejectedError';
  }
}

/** Teto de tokens por usuário em 24h (soma de `ai_usage`). `0` desliga. */
const DEFAULT_MAX_TOKENS_PER_USER_DAY = 500_000;

function readMaxTokensPerUserDay(): number {
  const raw = process.env.AI_MAX_TOKENS_PER_USER_DAY?.trim();
  if (!raw) return DEFAULT_MAX_TOKENS_PER_USER_DAY;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : DEFAULT_MAX_TOKENS_PER_USER_DAY;
}

/**
 * DEV-304: o LoopGuard limita tentativas e tokens de UMA chamada. O teto diário por usuário
 * (`getUserTokensToday`) existia e nunca era usado. Falha aberta se o banco não responder.
 */
async function assertUserWithinTokenCap(
  userId: string | null,
  task: AITask,
  analysisId: string | null
): Promise<void> {
  if (!userId) return;
  const cap = readMaxTokensPerUserDay();
  if (cap <= 0) return;
  const usados = await getUserTokensToday(userId);
  if (usados < cap) return;
  await logError({
    type: 'ai_loop',
    severity: 'warning',
    userId,
    analysisId,
    message: `${task}: limite diário de tokens de IA do usuário atingido`,
    details: { task, tokensUsados24h: usados, teto: cap },
  });
  throw new Error('USER_TOKEN_LIMIT');
}

/**
 * Vocabulário proibido (radiestesia, "incompatível", prazo de entrega, preço): refaz a tentativa.
 * Na última, remove só as frases problemáticas em vez de perder a análise inteira.
 */
function validarCopyDaIA(content: string, attempt: number): string {
  const achadas = encontrarCopyProibida(content);
  if (achadas.length === 0) return content;
  if (attempt >= 3) {
    console.warn(`[Brain] Copy proibida (${achadas.join(', ')}) removida na última tentativa`);
    return removerFrasesProibidas(content);
  }
  throw new OutputRejectedError(`copy proibida: ${achadas.join(', ')}`);
}

type OutputValidator = (content: string, attempt: number) => string;

async function runWithGuard(
  buildPrompt: () => string,
  task: AITask,
  userId: string | null,
  analysisId: string | null,
  systemPromptOverride?: string,
  validateOutput?: OutputValidator
): Promise<string> {
  // Textos para o cliente passam pela guarda de vocabulário; o polimento de suporte é texto do agente.
  const validate: OutputValidator | undefined =
    validateOutput ?? (task === 'support_polish' ? undefined : validarCopyDaIA);
  await assertUserWithinTokenCap(userId, task, analysisId);

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

      return validate ? validate(response.content, attempt) : response.content;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number; response?: { status?: number } } | null)?.status
        ?? (err as { status?: number; response?: { status?: number } } | null)?.response?.status;
      const lowerMessage = message.toLowerCase();

      // Groq indisponível → fallback imediato para OpenAI (não gastar 3 retries).
      // Cobre: rate limit (429/TPD), modelo descontinuado (404/model_not_found),
      // auth inválida e sinais explícitos de providers/groq.ts.
      const isGroqFallback = provider === 'groq' && (
        message === 'GROQ_RATE_LIMITED' ||
        message === 'GROQ_UNAVAILABLE' ||
        status === 429 ||
        status === 404 ||
        status === 401 ||
        status === 403 ||
        lowerMessage.includes('429') ||
        lowerMessage.includes('rate_limit') ||
        lowerMessage.includes('rate limit') ||
        lowerMessage.includes('quota') ||
        lowerMessage.includes('model_not_found') ||
        lowerMessage.includes('does not exist') ||
        lowerMessage.includes('decommissioned') ||
        lowerMessage.includes('not have access')
      );

      if (isGroqFallback) {
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
          return validate ? validate(fallback.content, attempt) : fallback.content;
        } catch (fallbackErr) {
          // Saída recusada pelas regras do produto: refaz a tentativa em vez de falhar o provider.
          if (fallbackErr instanceof OutputRejectedError) {
            console.warn(`[Brain] Tentativa ${attempt} recusada: ${fallbackErr.message}`);
            continue;
          }
          const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          console.error(`[Brain] Fallback OpenAI também falhou: ${fallbackMsg.slice(0, 200)}`);
          // Mantém QUOTA_EXCEEDED para rate-limit; demais casos preservam contexto.
          if (message === 'GROQ_RATE_LIMITED' || status === 429) {
            throw new Error('QUOTA_EXCEEDED');
          }
          throw new Error(`Groq e OpenAI falharam: ${fallbackMsg}`);
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
  analysisId: string | null,
  opcoes?: { scoreNascimento?: number }
): Promise<string> {
  // DEV-304: a IA só vê candidatas que o motor poderia oferecer (zero bloqueio e nota mínima)...
  const candidatas =
    opcoes?.scoreNascimento === undefined
      ? params.variacoesCandidatas.filter((c) => !c.temBloqueio)
      : filtrarCandidatasOfertaveis(params.variacoesCandidatas, opcoes.scoreNascimento);
  if (candidatas.length === 0) throw new Error('NO_OFFERABLE_CANDIDATES');

  const paramsOfertaveis = { ...params, variacoesCandidatas: candidatas };
  // ...e só pode apresentar os nomes que recebeu (o prompt usa as 8 primeiras).
  const permitidos = candidatas.slice(0, 8).map((c) => c.nome);

  return runWithGuard(
    () => buildSuggestionsPrompt(paramsOfertaveis),
    'suggestions',
    userId,
    analysisId,
    undefined,
    (content, attempt) => {
      const nomes = validarNomesSugeridos(content, permitidos);
      if (!nomes.ok || nomes.apresentados === 0) {
        throw new OutputRejectedError(
          nomes.apresentados === 0
            ? 'nenhum nome apresentado no formato esperado'
            : `nomes fora da lista oferecida: ${nomes.invalidos.join(', ')}`
        );
      }
      return validarCopyDaIA(content, attempt);
    }
  );
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

// ================================================================
// NOME ARTÍSTICO (DEV-321)
// ================================================================

/**
 * Ideias de nome artístico totalmente novo. A IA só sugere; o motor
 * (`products/nome-artistico`) valida cada ideia pelo cálculo cabalístico.
 * Sempre pelo LoopGuard. Se a IA falhar, quem chama usa o banco determinístico.
 */
export async function generateArtisticNameIdeas(
  params: ArtisticNamesPromptParams,
  userId: string | null,
  analysisId: string | null
): Promise<string[]> {
  const bruto = await runWithGuard(
    () => buildArtisticNamesPrompt(params),
    'artistic_names',
    userId,
    analysisId,
    SYSTEM_ARTISTIC_NAMES,
    (content) => {
      const nomes = extrairNomesJson(content);
      if (nomes.length === 0) throw new OutputRejectedError('nenhuma ideia de nome no formato JSON esperado');
      return content;
    }
  );
  return extrairNomesJson(bruto);
}

/** Lê `{"nomes": [...]}` mesmo quando a IA envolve o JSON em cerca de código ou texto. */
export function extrairNomesJson(content: string): string[] {
  const inicio = content.indexOf('{');
  const fim = content.lastIndexOf('}');
  if (inicio < 0 || fim <= inicio) return [];
  try {
    const dados = JSON.parse(content.slice(inicio, fim + 1)) as { nomes?: unknown };
    return Array.isArray(dados.nomes)
      ? dados.nomes.filter((n): n is string => typeof n === 'string').slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
