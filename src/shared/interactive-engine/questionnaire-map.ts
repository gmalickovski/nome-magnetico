/**
 * Mapeia respostas do questionário para filtros/ranking do gerador (não altera fórmula do score).
 */

import type { EstiloAssinaturaPreferido } from './copy';
import {
  mapOndeAssinaToApi,
  mapSubfocoToEnum,
  type QuestionnaireStepId,
} from './questionnaire-adaptive';
import { profileToRankingOpcoesArtistico } from './ramos/artistico';

export { profileToRankingOpcoesArtistico };

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
  /** DEV-302: afinidades do perfil (só desempatam entre sugestões válidas). */
  afinidades?: { estilo?: string[]; area?: string | null; subfocos?: string[] };
  /** DEV-303: preferências moles. Nunca relaxam zero bloqueio nem a nota mínima. */
  manterPrimeiroNome?: boolean;
  acentoNaAssinatura?: 'prefere_sem';
  prioridadeConflito?: 'nota' | 'mudanca';
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
  /** DEV-303 */
  preferenciasAssinatura?: string[];
  prioridadeConflito?: string | null;
  areaFocoOutro?: string | null;
  /** DEV-320 */
  motivoHarmonizacao?: string | null;
  areaArtistica?: string | null;
  areaArtisticaOutro?: string | null;
  detalheArtistico?: string[];
  generoPersona?: string | null;
  imagemArtistica?: string[];
  tipoNomeArtistico?: string | null;
  outrosUsos?: string[];
  /** DEV-328 · caminho do bebê */
  bebeMae?: string | null;
  bebePai?: string | null;
  bebeSituacao?: string | null;
  bebeDataTipo?: string | null;
  bebeSexo?: string | null;
  bebeData?: string | null;
  bebeSobrenomes?: string[];
  bebeNomesPais?: string[];
  bebeNomeRegistrado?: string | null;
  bebeEstilos?: string[];
}

/** DEV-320/DEV-328: perfil do chat guardado junto da análise (`frequencias_numeros.perfilChat`). */
export interface PerfilChatPersistido {
  motivo?: string;
  areaArtistica?: string;
  areaArtisticaOutro?: string;
  detalheArtistico?: string[];
  generoPersona?: string;
  imagemArtistica?: string[];
  tipoNomeArtistico?: string;
  outrosUsos?: string[];
  bebeMae?: string;
  bebePai?: string;
  bebeSituacao?: string;
  bebeDataTipo?: string;
  bebeSexo?: string;
  bebeData?: string;
  bebeSobrenomes?: string[];
  bebeNomesPais?: string[];
  bebeNomeRegistrado?: string;
  bebeEstilos?: string[];
}

export function profileToPerfilChat(profile: QuestionnaireProfile): PerfilChatPersistido | undefined {
  if (!profile.motivoHarmonizacao) return undefined;
  const lista = (v?: string[]) => (v && v.length > 0 ? v : undefined);
  const texto = (v?: string | null) => {
    const trimmed = v?.trim();
    return trimmed ? trimmed : undefined;
  };
  return {
    motivo: profile.motivoHarmonizacao,
    areaArtistica: texto(profile.areaArtistica),
    areaArtisticaOutro: texto(profile.areaArtisticaOutro),
    detalheArtistico: lista(profile.detalheArtistico),
    generoPersona: texto(profile.generoPersona),
    imagemArtistica: lista(profile.imagemArtistica),
    tipoNomeArtistico: texto(profile.tipoNomeArtistico),
    outrosUsos: lista(profile.outrosUsos),
    bebeMae: texto(profile.bebeMae),
    bebePai: texto(profile.bebePai),
    bebeSituacao: texto(profile.bebeSituacao),
    bebeDataTipo: texto(profile.bebeDataTipo),
    bebeSexo: texto(profile.bebeSexo),
    bebeData: texto(profile.bebeData),
    bebeSobrenomes: lista(profile.bebeSobrenomes),
    bebeNomesPais: lista(profile.bebeNomesPais),
    bebeNomeRegistrado: texto(profile.bebeNomeRegistrado),
    bebeEstilos: lista(profile.bebeEstilos),
  };
}

export function mapAberturaToEstilo(
  abertura: string | null,
  relacaoNome: string | null,
  nomeArtistico?: string | null
): EstiloAssinaturaPreferido {
  const ousado =
    abertura === 'o_que_fizer_sentido' ||
    abertura === 'tirar_trocar_sobrenome' ||
    relacaoNome === 'nao_representa';

  if (abertura === 'quase_nada') return 'ajuste_sutil';
  if (abertura === 'acento_ou_letra') return 'ajuste_sutil';
  if (abertura === 'tirar_trocar_sobrenome') return 'sobrenome_forte';
  // DEV-303: quem tem nome artístico prioriza a forma curta.
  if (nomeArtistico?.trim()) return 'curto_direto';
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

/** DEV-303: "Se for preciso escolher" explícito, ou inferido de "quase nada" e de contratos. */
export function resolvePrioridadeConflito(
  profile: QuestionnaireProfile,
  restricaoLegal: boolean
): 'nota' | 'mudanca' | undefined {
  if (profile.prioridadeConflito === 'nota_mais_alta') return 'nota';
  if (profile.prioridadeConflito === 'mudar_o_minimo') return 'mudanca';
  if (profile.aberturaMudanca === 'quase_nada' || restricaoLegal) return 'mudanca';
  return undefined;
}

export function profileToAfinidades(
  profile: QuestionnaireProfile,
): RankingOpcoesPatch['afinidades'] | undefined {
  const estilo = profile.estiloPresenca.filter(Boolean);
  const subfocos = profile.subfocosOrdenados.filter(Boolean);
  if (estilo.length === 0 && !profile.areaFoco && subfocos.length === 0) return undefined;
  return {
    estilo: estilo.length > 0 ? estilo : undefined,
    area: profile.areaFoco ?? undefined,
    subfocos: subfocos.length > 0 ? subfocos : undefined,
  };
}

export function profileToRankingOpcoes(
  profile: QuestionnaireProfile,
  extras?: Partial<RankingOpcoesPatch>
): RankingOpcoesPatch {
  if (profile.motivoHarmonizacao === 'artistico') {
    return profileToRankingOpcoesArtistico(profile, extras);
  }
  const ondeApi = mapOndeAssinaToApi(profile.ondeAssinaRaw);
  const estilo = mapAberturaToEstilo(
    profile.aberturaMudanca,
    profile.relacaoNome,
    profile.nomeArtistico
  );
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
    aceitaEncurtarOuApelido:
      aceitaEncurtarPorAbertura(profile.aberturaMudanca, profile.relacaoNome) ||
      (Boolean(profile.nomeArtistico?.trim()) &&
        !legal &&
        profile.aberturaMudanca !== 'quase_nada' &&
        profile.aberturaMudanca !== 'acento_ou_letra'),
    assinaturaAtual,
    restricaoDocumentosLegais: legal || undefined,
    maxNivelGeracao: maxNivel,
    afinidades: profileToAfinidades(profile),
    manterPrimeiroNome: profile.preferenciasAssinatura?.includes('manter_primeiro_nome') || undefined,
    acentoNaAssinatura: profile.preferenciasAssinatura?.includes('sem_acento') ? 'prefere_sem' : undefined,
    prioridadeConflito: resolvePrioridadeConflito(profile, legal),
    ...extras,
  };
}

/** DEV-304: "Só o primeiro nome" vale apenas quando nenhum sobrenome foi marcado junto. */
export function selecionouSoPrimeiroNome(selectedLabels: string[], todosSobrenomes: string[]): boolean {
  const sel = new Set(selectedLabels.map((x) => x.toLowerCase()));
  if (!sel.has('só o primeiro nome')) return false;
  return !todosSobrenomes.some((sob) => sel.has(sob.toLowerCase()));
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
