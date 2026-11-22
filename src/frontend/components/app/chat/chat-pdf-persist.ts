import type { ChatCollectState } from './decide-live-bridge.js';
import { collectStateToPerfilChat, collectStateToRankingPatch } from './decide-live-bridge.js';
import type { CandidateSuggestion } from './chat-types.js';
import { chatSuggestionsToExportNames } from './chat-export-suggestions.js';
import type {
  NomeArtisticoItemPersistido,
  NomeBebeItemPersistido,
  NomesArtisticosPersistidos,
  NomesBebePersistidos,
} from '../../../../shared/chat-analysis-persist.js';

function mapArtisticPersistItem(
  s: CandidateSuggestion,
  secao: 'proximo' | 'novo',
): NomeArtisticoItemPersistido {
  const explicacao = s.explicacao ?? s.destaque;
  return {
    nome: s.nome,
    nota: s.score,
    expressao: s.expressao || s.panel.expressao || 1,
    ...(typeof s.afinidade === 'number' ? { afinidade: s.afinidade } : {}),
    ...(explicacao ? { explicacao } : {}),
    ...(s.tecnica ? { tecnica: s.tecnica } : {}),
    secao,
  };
}

function buildNomesArtisticosPersist(
  suggestions: CandidateSuggestion[],
  escolhido: string,
): NomesArtisticosPersistidos {
  const proximos = suggestions
    .filter((s) => s.secao === 'proximo')
    .map((s) => mapArtisticPersistItem(s, 'proximo'));
  const novos = suggestions
    .filter((s) => s.secao === 'novo')
    .map((s) => mapArtisticPersistItem(s, 'novo'));
  return { proximos, novos, escolhido };
}

function resolveBebeBloqueios(s: CandidateSuggestion): string[] {
  if (s.bloqueiosCodigos && s.bloqueiosCodigos.length > 0) {
    return s.bloqueiosCodigos;
  }
  return s.panel?.bloqueios?.map((b) => b.codigo).filter(Boolean) ?? [];
}

function mapBebePersistItem(
  s: CandidateSuggestion,
  grupo: 'seu' | 'menina' | 'menino' | 'neutro',
): NomeBebeItemPersistido {
  return {
    nome: s.nome,
    nota: s.score,
    expressao: s.expressao || s.panel.expressao || 1,
    bloqueios: resolveBebeBloqueios(s),
    ...(typeof s.diasBons === 'number' ? { diasBons: s.diasBons } : {}),
    ...(typeof s.diasTotal === 'number' ? { diasTotal: s.diasTotal } : {}),
    grupo,
  };
}

function buildNomesBebePersist(
  suggestions: CandidateSuggestion[],
  janela: { dias: number; centro: string } | null,
  escolhido: string,
): NomesBebePersistidos {
  const seusNomes = suggestions
    .filter((s) => s.grupoBebe === 'seu')
    .map((s) => mapBebePersistItem(s, 'seu'));
  const sugestoes = suggestions
    .filter(
      (s): s is CandidateSuggestion & { grupoBebe: 'menina' | 'menino' | 'neutro' } =>
        s.grupoBebe === 'menina' || s.grupoBebe === 'menino' || s.grupoBebe === 'neutro',
    )
    .map((s) => mapBebePersistItem(s, s.grupoBebe));
  return {
    seusNomes,
    sugestoes,
    janela: janela ?? null,
    escolhido,
  };
}

export function buildChatPdfAnalyzePayload(input: {
  birthName: string;
  birthDate: string;
  selectedSocialName: string;
  collect: ChatCollectState;
  /** Sugestões já exibidas no chat desta sessão (ordem cumulativa). */
  suggestions: CandidateSuggestion[];
  /** DEV-328: janela de datas retornada pelo endpoint do bebê. */
  babyJanela?: { dias: number; centro: string } | null;
}): Record<string, unknown> {
  const ranking = collectStateToRankingPatch(input.collect);
  const birthName = input.birthName.trim();
  const birthDate = input.birthDate.trim();
  const selected = input.selectedSocialName.trim();
  const exportNames = chatSuggestionsToExportNames(input.suggestions);
  const motivo = input.collect.motivoHarmonizacao;

  return {
    product_type: 'nome_social',
    nome_completo: birthName,
    data_nascimento: birthDate,
    nome_social_principal: selected,
    nome_ja_escolhido: true,
    aceita_encurtar_apelido: Boolean(ranking.aceitaEncurtarOuApelido),
    area_foco: input.collect.areaFoco || undefined,
    onde_vai_usar: input.collect.ondeAssina.length > 0 ? input.collect.ondeAssina : undefined,
    assinatura_atual: ranking.assinaturaAtual ?? input.collect.nomeUsoBase ?? undefined,
    objetivo_apresentacao: input.collect.objetivoTexto.trim() || undefined,
    nomes_candidatos: exportNames.length > 0 ? exportNames : undefined,
    nomes_manuais: input.suggestions.filter(s => s.origem === 'manual').map(s => s.nome),
    /** Com histórico vazio: não pedir ranking do motor (lista vazia explícita). */
    ranking_somente_chat: true,
    ranking_vazio_sem_autogeracao: exportNames.length === 0,
    // DEV-320 / DEV-328
    perfil_chat: collectStateToPerfilChat(input.collect),
    ...(motivo === 'artistico'
      ? { nomes_artisticos: buildNomesArtisticosPersist(input.suggestions, selected) }
      : {}),
    ...(motivo === 'bebe'
      ? { nomes_bebe: buildNomesBebePersist(input.suggestions, input.babyJanela ?? null, selected) }
      : {}),
  };
}
