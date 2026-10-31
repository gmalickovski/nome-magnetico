/**
 * Primitivas tipadas do Motor Interativo System One (TypeSafe AI JEV · @typesafe-ai/sdk)
 *
 * Referência oficial:
 * - @typesafe-ai/sdk v0.7.0 (`choice`, `score`, `noul`, `box`, `image`, `withAssets`, `Image`)
 * - Skill oficial TypeSafe AI (`jev-1.14.0`):
 *   1. Judgments from Jev, decisions in code (tabela de decisão em TypeScript).
 *   2. Companion Noul para validar o caso nulo de um Choice ou de um Box (`>= 0.7` sim / `<= 0.3` não).
 *   3. Chaves de opções semânticos e descritivos (`prosperidade_financeira`, `sobrenome_forte`, etc.).
 *   4. Níveis de `score` descritos como situações observáveis completas.
 *   5. Primitiva `box` (`model: 'jev-preview'`) para localizar coordenadas normalizadas (`top`, `bottom`, `left`, `right`) em ativos visuais.
 */

import {
  box as sdkBox,
  choice as sdkChoice,
  Image as SdkImage,
  image as sdkImage,
  noul as sdkNoul,
  score as sdkScore,
  withAssets as sdkWithAssets,
  type BoxCoordinates,
  type BoxQuestion,
  type BoxResponse,
  type ChoiceCriteria,
  type ChoiceQuestion,
  type ChoiceResponse,
  type EntryType,
  type NoulQuestion,
  type NoulResponse,
  type ScoreCriteria,
  type ScoreQuestion,
  type ScoreResponse,
} from '@typesafe-ai/sdk';

export type {
  BoxCoordinates,
  BoxQuestion,
  BoxResponse,
  ChoiceCriteria,
  ChoiceQuestion,
  ChoiceResponse,
  EntryType,
  NoulQuestion,
  NoulResponse,
  ScoreCriteria,
  ScoreQuestion,
  ScoreResponse,
};

export { SdkImage as Image, sdkImage as image, sdkWithAssets as withAssets };

export type BrandPresetId = 'nome-magnetico' | 'studio-mlk';

export type EstiloAssinaturaPreferido =
  | 'sobrenome_forte'
  | 'ajuste_sutil'
  | 'curto_direto'
  | 'qualquer';

export type MotivoRefinamentoAssinatura =
  | 'forcar_sobrenome'
  | 'preferir_sem_acento'
  | 'preferir_nome_curto'
  | 'preferir_nome_completo'
  | 'testar_variacao_propria';

export type AreaFocoNomeMagnetico =
  | 'prosperidade_financeira'
  | 'carreira_negocios'
  | 'relacionamentos_harmonia'
  | 'autoestima_expressao';

export type OndeAssinaCanal =
  | 'identidade_registro'
  | 'presenca_digital'
  | 'rotina_trabalho'
  | 'marca_autoria';

export type SubfocoMomento =
  | 'reter_ganhos'
  | 'aumentar_renda'
  | 'organizar_estabilidade'
  | 'fechar_contratos'
  | 'lideranca_promocao'
  | 'novo_ciclo_profissional'
  | 'harmonia_afetiva'
  | 'paz_familiar'
  | 'novas_conexoes'
  | 'voz_seguranca'
  | 'foco_execucao'
  | 'autoconfianca_identidade';

export type DiagramNodeKind = 'origem' | 'reflexo' | 'ajuste' | 'alvo';

export interface DiagramNodeSpec {
  id: string;
  kind: DiagramNodeKind;
  eyebrow: string;
  /** Entre 4 e 6 palavras, zero travessões */
  label: string;
}

export interface SubfocoOptionSpec {
  value: SubfocoMomento;
  label: string;
}

export interface SubfocoQuestionSpec {
  prompt: string;
  options: SubfocoOptionSpec[];
}

export interface SignatureBoxInspectionResult {
  providerUsed: 'typesafe-jev' | 'deterministic';
  hasVisibleSignature: boolean;
  hasVisibleSignatureConfidence: number;
  box: BoxCoordinates;
  model: string;
}

/**
 * Helper declarativo `choice` compatível com o contrato oficial `@typesafe-ai/sdk`
 * (mapa `{ chave_semantica: descricao }`) e também com lista `readonly string[]`.
 */
export function choice<const T extends ChoiceCriteria>(
  instructions: EntryType,
  criteria: T
): ChoiceQuestion<T>;
export function choice<const T extends readonly string[]>(
  instructions: EntryType,
  options: T
): ChoiceQuestion<{ [K in T[number]]: null }>;
export function choice(
  instructions: EntryType,
  criteriaOrOptions: ChoiceCriteria | readonly string[]
): ChoiceQuestion {
  if (Array.isArray(criteriaOrOptions)) {
    const mapped: ChoiceCriteria = {};
    for (const item of criteriaOrOptions) {
      mapped[String(item)] = null;
    }
    return sdkChoice(instructions, mapped);
  }
  return sdkChoice(instructions, criteriaOrOptions as ChoiceCriteria);
}

/**
 * Helper declarativo `score` compatível com o contrato oficial `@typesafe-ai/sdk`
 * (rubrica ordenada de situações) e também com escala numérica `(prompt, min, max)`.
 */
export function score<const T extends ScoreCriteria>(
  instructions: EntryType,
  criteria: T
): ScoreQuestion<T>;
export function score(
  instructions: EntryType,
  min?: number,
  max?: number
): ScoreQuestion<readonly [EntryType, EntryType, ...EntryType[]]>;
export function score(
  instructions: EntryType,
  criteriaOrMin?: ScoreCriteria | number,
  max?: number
): ScoreQuestion {
  if (Array.isArray(criteriaOrMin)) {
    return sdkScore(instructions, criteriaOrMin as ScoreCriteria);
  }
  const low = typeof criteriaOrMin === 'number' ? criteriaOrMin : 0;
  const high = typeof max === 'number' ? max : 2;
  const count = Math.max(2, high - low + 1);
  const levels: EntryType[] = [];
  for (let i = 0; i < count; i++) {
    levels.push(`Nivel ${low + i} na escala de ${low} a ${high}`);
  }
  return sdkScore(instructions, levels as unknown as ScoreCriteria);
}

/**
 * Helper declarativo `noul` oficial `@typesafe-ai/sdk` para probabilidade calibrada [0..1].
 * Permite descrever explicitamente os critérios `true` e `false` como situações concretas.
 */
export function noul(
  instructions: NonNullable<EntryType>,
  criteria?: NoulQuestion['criteria']
): NoulQuestion {
  return sdkNoul(instructions, criteria);
}

/**
 * Helper declarativo `box` oficial `@typesafe-ai/sdk` (`jev-preview`) para localizar
 * coordenadas (`top`, `bottom`, `left`, `right` em [0..1]) de um elemento visual (ex: assinatura).
 */
export function box(instructions?: EntryType): BoxQuestion {
  return sdkBox(instructions);
}

/**
 * Valida se o rótulo de um nó do diagrama possui entre 4 e 6 palavras e zero travessões.
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
