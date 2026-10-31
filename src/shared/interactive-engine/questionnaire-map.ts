/**
 * Mapeia respostas do questionário para filtros/ranking do gerador (não altera fórmula do score).
 */

import type { EstiloAssinaturaPreferido } from './copy';
import {
  mapOndeAssinaToApi,
  mapSubfocoToEnum,
  type QuestionnaireStepId,
} from './questionnaire-adaptive';

/** Campos aceitos pelo ranking/filtro de nome-social (não alteram fórmula do score). */
export interface RankingOpcoesPatch {
  ondeVaiUsar?: string[];
  sobrenomesObrigatorios?: string[];
  sobrenomesExcluidos?: string[];
  estiloPreferido?: EstiloAssinaturaPreferido;
  aceitaEncurtarOuApelido?: boolean;
  assinaturaAtual?: string;
  restricaoDocumentosLegais?: boolean;
  maxNivelGeracao?: number;
}

export interface QuestionnaireProfile {
  nomeUsoBase: string | null;
  sobrenomesObrigatorios: string[];
  sobrenomesExcluidos: string[];
  relacaoNome: string | null;
  ondeAssinaRaw: string[];
  estiloPresenca: string[];
  areaFoco: string | null;
  subfocosOrdenados: string[];
  aberturaMudanca: string | null;
  nomeArtistico: string | null;
  contextoLeituraOutros: string[];
}

export function mapAberturaToEstilo(
  abertura: string | null,
  relacaoNome: string | null
): EstiloAssinaturaPreferido {
  const ousado =
    abertura === 'o_que_fizer_sentido' ||
    abertura === 'tirar_trocar_sobrenome' ||
    relacaoNome === 'nao_representa';

  if (abertura === 'quase_nada') return 'ajuste_sutil';
  if (abertura === 'acento_ou_letra') return 'ajuste_sutil';
  if (abertura === 'tirar_trocar_sobrenome') return 'sobrenome_forte';
  if (ousado) return 'qualquer';
  return 'ajuste_sutil';
}

export function aceitaEncurtarPorAbertura(
  abertura: string | null,
  relacaoNome: string | null
): boolean {
  return (
    abertura === 'o_que_fizer_sentido' ||
    relacaoNome === 'nao_representa' ||
    abertura === 'tirar_trocar_sobrenome'
  );
}

export function restricaoDocumentosLegais(ondeAssinaRaw: string[]): boolean {
  return ondeAssinaRaw.includes('contratos_documentos');
}

export function maxNivelGeracaoPorAbertura(
  abertura: string | null,
  relacaoNome: string | null,
  restricaoLegal: boolean
): number | undefined {
  if (restricaoLegal) return 85;
  if (abertura === 'quase_nada') return 50;
  if (abertura === 'acento_ou_letra') return 85;
  if (abertura === 'tirar_trocar_sobrenome') return 120;
  if (abertura === 'o_que_fizer_sentido' || relacaoNome === 'nao_representa') {
    return undefined;
  }
  return 120;
}

export function profileToRankingOpcoes(
  profile: QuestionnaireProfile,
  extras?: Partial<RankingOpcoesPatch>
): RankingOpcoesPatch {
  const ondeApi = mapOndeAssinaToApi(profile.ondeAssinaRaw);
  const estilo = mapAberturaToEstilo(profile.aberturaMudanca, profile.relacaoNome);
  const legal = restricaoDocumentosLegais(profile.ondeAssinaRaw);
  const maxNivel = maxNivelGeracaoPorAbertura(
    profile.aberturaMudanca,
    profile.relacaoNome,
    legal
  );

  const assinaturaAtual = profile.nomeUsoBase?.trim() || undefined;

  return {
    ondeVaiUsar: ondeApi,
    sobrenomesObrigatorios:
      profile.sobrenomesObrigatorios.length > 0 ? profile.sobrenomesObrigatorios : undefined,
    sobrenomesExcluidos:
      profile.sobrenomesExcluidos.length > 0 ? profile.sobrenomesExcluidos : undefined,
    estiloPreferido: estilo,
    aceitaEncurtarOuApelido: aceitaEncurtarPorAbertura(
      profile.aberturaMudanca,
      profile.relacaoNome
    ),
    assinaturaAtual,
    restricaoDocumentosLegais: legal || undefined,
    maxNivelGeracao: maxNivel,
    ...extras,
  };
}

export function applySobrenomesUsoSelection(
  selectedLabels: string[],
  todosSobrenomes: string[]
): { obrigatorios: string[]; excluidos: string[] } {
  const selSet = new Set(selectedLabels.map((s) => s.toLowerCase()));
  const obrigatorios: string[] = [];
  const excluidos: string[] = [];
  for (const sob of todosSobrenomes) {
    if (selSet.has(sob.toLowerCase())) obrigatorios.push(sob);
    else excluidos.push(sob);
  }
  return { obrigatorios, excluidos };
}

export function mergeContextoLeitura(
  prev: string[],
  stepId: QuestionnaireStepId,
  otherText?: string
): string[] {
  if (!otherText?.trim()) return prev;
  const snippet = `${stepId}:${otherText.trim().slice(0, 60)}`;
  if (prev.includes(snippet)) return prev;
  return [...prev, snippet];
}
