/**
 * Cliente do ramo artístico do chat (DEV-321).
 *
 * Tudo que é específico do nome artístico no front mora aqui e em `SuggestionPicker`
 * (seções). O `NomeSocialChat.tsx` só decide quando chamar. Comunicação com o backend
 * somente via fetch para `/api/artistic-names`.
 */

import type { CandidateSuggestion } from './chat-types.js';
import { mapCandidate, type ChatCollectState } from './decide-live-bridge.js';

export const NOTICE_CRIANDO_NOMES_ARTISTICOS = 'Estou criando os nomes artísticos para você...';

export function isRamoArtisticoCollect(collect: Pick<ChatCollectState, 'motivoHarmonizacao' | 'fluxoMotivoAtivo'>): boolean {
  return collect.motivoHarmonizacao === 'artistico';
}

export function buildArtisticNamesBody(
  nomeNascimento: string,
  dataNascimento: string,
  collect: ChatCollectState,
  excluir: string[] = [],
): Record<string, unknown> {
  const prefs = collect.preferenciasAssinatura ?? [];
  return {
    nome_completo: nomeNascimento.trim(),
    data_nascimento: dataNascimento.trim(),
    area_artistica: collect.areaArtistica ?? undefined,
    area_artistica_outro: collect.areaArtisticaOutro ?? undefined,
    detalhe_artistico: collect.detalheArtistico?.length ? collect.detalheArtistico : undefined,
    genero_persona: collect.generoPersona ?? undefined,
    imagem_artistica: collect.imagemArtistica?.length ? collect.imagemArtistica : undefined,
    tipo_nome_artistico: collect.tipoNomeArtistico ?? 'ambos',
    sobrenomes_excluidos: collect.sobrenomesExcluidos.length > 0 ? collect.sobrenomesExcluidos : undefined,
    manter_primeiro_nome: prefs.includes('manter_primeiro_nome') || undefined,
    sem_acento: prefs.includes('sem_acento') || undefined,
    excluir: excluir.length > 0 ? excluir : undefined,
  };
}

export interface RawArtisticNamesResponse {
  proximos?: Array<Record<string, unknown> & { nomeCompleto: string }>;
  novos?: Array<Record<string, unknown> & { nomeCompleto: string }>;
  semProximos?: boolean;
  semNovos?: boolean;
  providerUsed?: string;
  error?: string;
}

export function mapArtisticNamesToCandidates(raw: RawArtisticNamesResponse): CandidateSuggestion[] {
  return [...(raw.proximos ?? []), ...(raw.novos ?? [])].map((r) => ({
    ...mapCandidate(r),
    origem: 'gerado' as const,
  }));
}

/** Aviso quando uma das seções pedidas não teve nenhum nome válido. */
export function artisticNamesNotice(raw: RawArtisticNamesResponse, tipo: string | null): string | null {
  const faltaNovos = raw.semNovos === true;
  const faltaProximos = raw.semProximos === true;
  if (faltaNovos && faltaProximos) {
    return 'Com o que você pediu, nenhum nome ficou sem bloqueios e com boa harmonia com o seu mapa. Ajuste suas preferências para explorar outras combinações.';
  }
  if (faltaNovos) {
    return 'Não encontramos nomes totalmente novos que combinem com o seu mapa e com o que você pediu. Tente outro tom ou outra imagem.';
  }
  if (faltaProximos && tipo !== 'diferente') {
    return 'Não encontramos nomes próximos do seu que combinem com o seu mapa. Veja os nomes novos ou ajuste suas preferências.';
  }
  return null;
}

export interface SecoesArtisticas {
  proximos: CandidateSuggestion[];
  novos: CandidateSuggestion[];
  outros: CandidateSuggestion[];
}

export function dividirPorSecao(lista: CandidateSuggestion[]): SecoesArtisticas {
  return {
    proximos: lista.filter((s) => s.secao === 'proximo'),
    novos: lista.filter((s) => s.secao === 'novo'),
    outros: lista.filter((s) => s.secao !== 'proximo' && s.secao !== 'novo'),
  };
}

export function temSecoesArtisticas(lista: CandidateSuggestion[]): boolean {
  return lista.some((s) => s.secao === 'proximo' || s.secao === 'novo');
}
