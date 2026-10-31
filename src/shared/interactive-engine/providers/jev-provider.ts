/**
 * Provider System One oficial (@typesafe-ai/sdk · JEV) com Cadeia de 3 Níveis 100% Transparente:
 *
 * 1º Nível (Preferencial): TypeSafe JEV (`@typesafe-ai/sdk`, `TYPESAFE_API_KEY`)
 *    - Usa `client.systemOne({ state, questions })` com `noul`, `score`, `choice` (e `box` em `jev-preview`).
 * 2º Nível (Fallback Oficial Transparente): OpenAI Structured Outputs (`OPENAI_API_KEY`, `json_schema` strict)
 *    - Acionado automaticamente se `TYPESAFE_API_KEY` estiver vazia ou se a conta TypeSafe retornar
 *      erro de saldo/crédito ou timeout (`401 / 402 / 403 / 429 / 5xx`).
 * 3º Nível (Fallback Determinístico Local em 0 ms):
 *    - Garante funcionamento ininterrupto em testes, CI ou oscilação de rede.
 */

import { Image, TypeSafeClient } from '@typesafe-ai/sdk';
import {
  buildNomeMagneticoJevQuestions,
  buildSignatureBoxQuestions,
} from '../presets/nome-magnetico';
import type {
  AreaFocoNomeMagnetico,
  EstiloAssinaturaPreferido,
  OndeAssinaCanal,
  SignatureBoxInspectionResult,
  SubfocoMomento,
} from '../primitives';

export interface JevDecisionInputState {
  nome_completo: string;
  numero_destino: number;
  nota_hoje: number;
  potencial: number;
  bloqueios_triangulos: string[];
  relato_consulente: string;
  area_foco_chip?: AreaFocoNomeMagnetico;
  onde_assina_chips?: OndeAssinaCanal[];
  estilo_preferido_chip?: EstiloAssinaturaPreferido;
  subfoco_momento_chip?: SubfocoMomento;
}

export interface JevDecisionResult {
  providerUsed: 'typesafe-jev' | 'openai-structured' | 'deterministic';
  escopoPronto: boolean;
  escopoConfidence: number;
  clarezaRelatoScore: number;
  areaFoco: AreaFocoNomeMagnetico;
  ondeAssina: OndeAssinaCanal;
  estiloPresenca: Exclude<EstiloAssinaturaPreferido, 'qualquer'>;
  subfocoMomento: SubfocoMomento;
  alertaComplianceLegal: boolean;
}

const CLINICAL_KEYWORDS_REGEX =
  /\b(depress[aã]o|ansiedade(\s+cl[ií]nica)?|p[aâ]nico|c[aâ]ncer|diabetes|hipertens[aã]o|doen[cç]a|enfermidade|cura(\s+m[eé]dica)?|tratamento\s+m[eé]dico|psiqui[aá]tr|rem[eé]dio|medicamento|sintoma\s+f[ií]sico|dor(\s+cr[oô]nica|\s+f[ií]sica)?|suic[ií]d|terapia\s+m[eé]dica|diagn[oó]stico\s+m[eé]dico)\b/i;

function getEnvKey(name: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  const fromImportMeta =
    typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env
      ? (import.meta as unknown as { env: Record<string, string> }).env[name]
      : undefined;
  const val = (fromProcess || fromImportMeta || '').trim();
  return val.length > 0 ? val : undefined;
}

/**
 * Nível 1 (Preferencial): TypeSafe JEV (@typesafe-ai/sdk)
 */
async function evaluateWithTypeSafeJev(
  state: JevDecisionInputState,
  apiKey: string
): Promise<JevDecisionResult> {
  const client = new TypeSafeClient({
    apiKey,
    defaultModel: 'jev-latest',
    timeout: 1500,
    retry: { maxRetries: 0 },
  });

  const questions = buildNomeMagneticoJevQuestions();

  const response = await client.systemOne({
    state: {
      nome_atual: state.nome_completo,
      numero_destino: state.numero_destino,
      nota_hoje: state.nota_hoje,
      potencial: state.potencial,
      bloqueios_triangulos: state.bloqueios_triangulos,
      relato_consulente: state.relato_consulente,
      area_foco_chip: state.area_foco_chip ?? null,
      onde_assina_chips: state.onde_assina_chips ?? [],
    },
    questions,
  });

  const det = evaluateDeterministically(state);
  const noulEscopo = response.answers.escopo_pronto.noul;
  const noulLegal = response.answers.alerta_compliance_legal.noul;
  const clarezaScore = response.answers.clareza_relato.score;

  return {
    providerUsed: 'typesafe-jev',
    // Companion Noul best practice (TypeSafe skill): >= 0.7 yes, <= 0.3 no
    escopoPronto: noulEscopo >= 0.7 || Boolean(state.area_foco_chip),
    escopoConfidence: noulEscopo,
    clarezaRelatoScore: typeof clarezaScore === 'number' ? clarezaScore : det.clarezaRelatoScore,
    areaFoco: state.area_foco_chip ?? (response.answers.area_foco.choice as AreaFocoNomeMagnetico),
    ondeAssina: state.onde_assina_chips?.[0] ?? (response.answers.onde_assina.choice as OndeAssinaCanal),
    estiloPresenca:
      state.estilo_preferido_chip && state.estilo_preferido_chip !== 'qualquer'
        ? state.estilo_preferido_chip
        : (response.answers.estilo_presenca.choice as Exclude<EstiloAssinaturaPreferido, 'qualquer'>),
    subfocoMomento: state.subfoco_momento_chip ?? (response.answers.subfoco_momento.choice as SubfocoMomento),
    alertaComplianceLegal: det.alertaComplianceLegal || noulLegal >= 0.5,
  };
}

/**
 * Nível 2 (Fallback Oficial Transparente): OpenAI Structured Outputs (json_schema strict)
 * Avalia exatamente o mesmo state e as mesmas questions quando TYPESAFE_API_KEY não estiver definida
 * ou quando a conta TypeSafe estiver sem créditos (HTTP 401/402/403/429/5xx).
 */
async function evaluateWithOpenAIStructuredOutputs(
  state: JevDecisionInputState,
  openAiKey: string
): Promise<JevDecisionResult> {
  const model = getEnvKey('OPENAI_DECIDE_MODEL') || 'gpt-4o-mini';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1800);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content:
              'Você é um motor de decisão System 1 (compatível com TypeSafe JEV). Avalie o state fornecido e responda estritamente no schema JSON com as decisões tipadas (choice, score e noul).',
          },
          {
            role: 'user',
            content: JSON.stringify({
              state: {
                nome_atual: state.nome_completo,
                numero_destino: state.numero_destino,
                nota_hoje: state.nota_hoje,
                potencial: state.potencial,
                bloqueios_triangulos: state.bloqueios_triangulos,
                relato_consulente: state.relato_consulente,
                area_foco_chip: state.area_foco_chip ?? null,
                onde_assina_chips: state.onde_assina_chips ?? [],
              },
            }),
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'system_one_decisions',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: [
                'escopo_pronto_noul',
                'clareza_relato_score',
                'area_foco',
                'onde_assina',
                'estilo_presenca',
                'subfoco_momento',
                'alerta_compliance_legal_noul',
              ],
              properties: {
                escopo_pronto_noul: {
                  type: 'number',
                  description: 'Probabilidade de 0 a 1 de o relato já ter contexto suficiente.',
                },
                clareza_relato_score: {
                  type: 'number',
                  description: 'Nível de detalhamento do relato de 0 (vazio) a 2 (detalhado).',
                },
                area_foco: {
                  type: 'string',
                  enum: [
                    'prosperidade_financeira',
                    'carreira_negocios',
                    'relacionamentos_harmonia',
                    'autoestima_expressao',
                  ],
                },
                onde_assina: {
                  type: 'string',
                  enum: [
                    'identidade_registro',
                    'presenca_digital',
                    'rotina_trabalho',
                    'marca_autoria',
                  ],
                },
                estilo_presenca: {
                  type: 'string',
                  enum: ['sobrenome_forte', 'ajuste_sutil', 'curto_direto'],
                },
                subfoco_momento: {
                  type: 'string',
                  enum: [
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
                  ],
                },
                alerta_compliance_legal_noul: {
                  type: 'number',
                  description:
                    'Probabilidade de 0 a 1 de o relato mencionar doença física/mental, diagnóstico médico ou pedir cura.',
                },
              },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI HTTP ${res.status}`);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    const det = evaluateDeterministically(state);

    return {
      providerUsed: 'openai-structured',
      escopoPronto:
        Number(parsed.escopo_pronto_noul) >= 0.7 ||
        Boolean(state.area_foco_chip) ||
        state.relato_consulente.trim().length >= 12,
      escopoConfidence: Number(parsed.escopo_pronto_noul) || det.escopoConfidence,
      clarezaRelatoScore:
        typeof parsed.clareza_relato_score === 'number'
          ? parsed.clareza_relato_score
          : det.clarezaRelatoScore,
      areaFoco: state.area_foco_chip ?? parsed.area_foco ?? det.areaFoco,
      ondeAssina: state.onde_assina_chips?.[0] ?? parsed.onde_assina ?? det.ondeAssina,
      estiloPresenca:
        state.estilo_preferido_chip && state.estilo_preferido_chip !== 'qualquer'
          ? state.estilo_preferido_chip
          : parsed.estilo_presenca ?? det.estiloPresenca,
      subfocoMomento: state.subfoco_momento_chip ?? parsed.subfoco_momento ?? det.subfocoMomento,
      alertaComplianceLegal:
        det.alertaComplianceLegal || Number(parsed.alerta_compliance_legal_noul) >= 0.5,
    };
  } finally {
    clearTimeout(timer);
  }
}

function inferSubfocoDeterministically(
  text: string,
  areaFoco: AreaFocoNomeMagnetico
): SubfocoMomento {
  if (areaFoco === 'prosperidade_financeira') {
    if (/(d[ií]vida|aperto|pend[eê]ncia|organizar|quitar)/.test(text)) return 'organizar_estabilidade';
    if (/(aumentar|ganhar mais|nova renda|novos ganhos|faturar)/.test(text)) return 'aumentar_renda';
    return 'reter_ganhos';
  }
  if (areaFoco === 'carreira_negocios') {
    if (/(cargo|promo[cç][aã]o|lideran[cç]a|reconhecimento|chefe)/.test(text)) return 'lideranca_promocao';
    if (/(transi[cç][aã]o|mudar de [aá]rea|novo ciclo|destravar projeto)/.test(text)) return 'novo_ciclo_profissional';
    return 'fechar_contratos';
  }
  if (areaFoco === 'relacionamentos_harmonia') {
    if (/(fam[ií]lia|casa|filh|pais|lar)/.test(text)) return 'paz_familiar';
    if (/(atrair|conhecer|novas conex[oõ]es|solteir|reciproc)/.test(text)) return 'novas_conexoes';
    return 'harmonia_afetiva';
  }
  if (/(ideia|papel|adiar|procrastin|execu|concluir)/.test(text)) return 'foco_execucao';
  if (/(orgulho|hist[oó]ria|identidade|pertencimento)/.test(text)) return 'autoconfianca_identidade';
  return 'voz_seguranca';
}

/**
 * Nível 3 (Fallback Determinístico Local em 0 ms): garante que o sistema nunca falhe nem em testes/offline.
 */
export function evaluateDeterministically(state: JevDecisionInputState): JevDecisionResult {
  const text = (state.relato_consulente || '').toLowerCase();
  const alertaComplianceLegal = CLINICAL_KEYWORDS_REGEX.test(text);

  let areaFoco: AreaFocoNomeMagnetico = state.area_foco_chip ?? 'carreira_negocios';
  if (!state.area_foco_chip) {
    if (/(dinheiro|financ|renda|d[ií]vida|pagar|conta|prosper|lucro|reserva|ganho)/.test(text)) {
      areaFoco = 'prosperidade_financeira';
    } else if (/(amor|casamento|relacionamento|fam[ií]lia|parceir|afeto|casa|filh)/.test(text)) {
      areaFoco = 'relacionamentos_harmonia';
    } else if (/(confian[cç]a|autoestima|timidez|inseguran[cç]a|falar|express|clareza|prop[oó]sito)/.test(text)) {
      areaFoco = 'autoestima_expressao';
    } else if (/(trabalh|carreira|neg[oó]cio|client|contrato|venda|empresa|cargo|promo[cç][aã]o)/.test(text)) {
      areaFoco = 'carreira_negocios';
    }
  }

  const ondeAssina: OndeAssinaCanal =
    state.onde_assina_chips?.[0] ??
    (/(instagram|linkedin|whatsapp|rede|digital)/.test(text)
      ? 'presenca_digital'
      : /(documento|gov|rg|cart[oó]rio)/.test(text)
        ? 'identidade_registro'
        : /(arte|autoral|cria[cç][aã]o|livro|marca pessoal)/.test(text)
          ? 'marca_autoria'
          : 'rotina_trabalho');

  const estiloPresenca: Exclude<EstiloAssinaturaPreferido, 'qualquer'> =
    state.estilo_preferido_chip && state.estilo_preferido_chip !== 'qualquer'
      ? state.estilo_preferido_chip
      : ondeAssina === 'presenca_digital' || ondeAssina === 'marca_autoria'
        ? 'curto_direto'
        : 'sobrenome_forte';

  const trimmedLen = text.trim().length;
  const hasEnoughInput = Boolean(state.area_foco_chip) || trimmedLen >= 8;
  const clarezaRelatoScore = trimmedLen >= 35 ? 2 : hasEnoughInput ? 1 : 0;

  return {
    providerUsed: 'deterministic',
    escopoPronto: hasEnoughInput,
    escopoConfidence: hasEnoughInput ? 0.85 : 0.25,
    clarezaRelatoScore,
    areaFoco,
    ondeAssina,
    estiloPresenca,
    subfocoMomento: state.subfoco_momento_chip ?? inferSubfocoDeterministically(text, areaFoco),
    alertaComplianceLegal,
  };
}

/**
 * Ponto único de entrada da Camada 2:
 * 1º tenta TypeSafe JEV (se TYPESAFE_API_KEY existir)
 * 2º cai automaticamente para OpenAI Structured Outputs (se OPENAI_API_KEY existir e houver texto livre para analisar)
 * 3º cai para avaliação determinística em 0 ms
 */
export async function runJevDecision(state: JevDecisionInputState): Promise<JevDecisionResult> {
  const typesafeKey = getEnvKey('TYPESAFE_API_KEY');
  if (typesafeKey) {
    try {
      return await evaluateWithTypeSafeJev(state, typesafeKey);
    } catch {
      // Se a conta TypeSafe retornar 401/402/403 (sem créditos) ou timeout, segue para o Fallback Oficial OpenAI
    }
  }

  const openAiKey = getEnvKey('OPENAI_API_KEY');
  if (openAiKey && state.relato_consulente.trim().length >= 6) {
    try {
      return await evaluateWithOpenAIStructuredOutputs(state, openAiKey);
    } catch {
      // Se a rede oscilar, cai para o determinístico em 0 ms
    }
  }

  return evaluateDeterministically(state);
}

/**
 * Uso oficial da primitiva `box` (`@typesafe-ai/sdk` v0.7.0 · `model: 'jev-preview'`)
 * com companion `noul` (`assinatura_visivel`) para localizar coordenadas normalizadas
 * (`top`, `bottom`, `left`, `right` em [0..1]) de uma assinatura em imagem PNG/JPEG.
 */
export async function locateSignatureBoxWithJev(
  imageBase64: string
): Promise<SignatureBoxInspectionResult> {
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/i, '').trim();
  const typesafeKey = getEnvKey('TYPESAFE_API_KEY');

  if (typesafeKey && cleanBase64.length > 16) {
    try {
      const client = new TypeSafeClient({
        apiKey: typesafeKey,
        defaultHeaders: { 'TypeSafe-Danger-Zone-Images': 'true' },
        timeout: 2500,
        retry: { maxRetries: 0 },
      });
      const asset = Image.fromBase64(cleanBase64);
      const questions = buildSignatureBoxQuestions();
      const response = await client.systemOne({
        state: asset,
        questions,
        model: 'jev-preview',
      });

      const visivelNoul = response.answers.assinatura_visivel.noul;
      return {
        providerUsed: 'typesafe-jev',
        hasVisibleSignature: visivelNoul >= 0.7,
        hasVisibleSignatureConfidence: visivelNoul,
        box: response.answers.regiao_assinatura.box,
        model: response.model,
      };
    } catch {
      // Fallback determinístico caso a conta TypeSafe esteja sem créditos ou offline
    }
  }

  const hasContent = cleanBase64.length > 16;
  return {
    providerUsed: 'deterministic',
    hasVisibleSignature: hasContent,
    hasVisibleSignatureConfidence: hasContent ? 0.85 : 0.1,
    box: {
      top: 0.18,
      bottom: 0.82,
      left: 0.12,
      right: 0.88,
    },
    model: 'deterministic-box-fallback',
  };
}
