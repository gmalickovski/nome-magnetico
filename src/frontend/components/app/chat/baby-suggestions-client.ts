/**
 * Cliente do caminho do bebê no chat (DEV-326).
 *
 * Tudo que é específico do bebê no front mora aqui, em `ramos/bebe.ts`, em `BabyDataForm` e nas
 * seções do `SuggestionPicker`. O `NomeSocialChat.tsx` só decide quando chamar. Comunicação com o
 * backend somente via fetch para `/api/baby-names`.
 */

import type { CandidateSuggestion } from './chat-types.js';
import { mapCandidate, type ChatCollectState } from './decide-live-bridge.js';
import type { GrupoBebeChat } from '../../../../shared/interactive-engine/ramos/bebe.js';

export const NOTICE_CALCULANDO_NOMES_BEBE = 'Estou calculando os nomes para o bebê...';

export function isRamoBebeCollect(collect: Pick<ChatCollectState, 'motivoHarmonizacao'>): boolean {
  return collect.motivoHarmonizacao === 'bebe';
}

export function buildBabyNamesBody(collect: ChatCollectState, excluir: string[] = []): Record<string, unknown> {
  const registrado = collect.bebeSituacao === 'nasceu_registrado';
  return {
    situacao: collect.bebeSituacao ?? 'nao_nasceu',
    data_tipo: collect.bebeDataTipo ?? undefined,
    data: collect.bebeData ?? '',
    sexo: collect.bebeSexo ?? 'indefinido',
    sobrenomes: registrado ? [] : (collect.bebeSobrenomes ?? []),
    nomes_pais: registrado ? [] : (collect.bebeNomesPais ?? []),
    nome_registrado: registrado ? (collect.bebeNomeRegistrado ?? undefined) : undefined,
    estilos: collect.bebeEstilos?.length ? collect.bebeEstilos : undefined,
    excluir: excluir.length > 0 ? excluir : undefined,
  };
}

export interface RawBabyNamesResponse {
  seusNomes?: Array<Record<string, unknown> & { nomeCompleto: string }>;
  sugestoes?: Array<Record<string, unknown> & { nomeCompleto: string }>;
  semSugestoes?: boolean;
  gruposSemSugestoes?: Array<'menina' | 'menino' | 'neutro'>;
  motivoSemSugestoes?: 'sobrenomes_bloqueiam' | 'regras' | 'data_invalida' | null;
  nomesPaisIgnorados?: string[];
  janela?: { dias: number; centro: string } | null;
  error?: string;
}

export function mapBabyNamesToCandidates(raw: RawBabyNamesResponse): CandidateSuggestion[] {
  return [...(raw.seusNomes ?? []), ...(raw.sugestoes ?? [])].map((r) => ({
    ...mapCandidate(r),
    origem: 'gerado' as const,
  }));
}

/** Avisos depois do cálculo: sobrenome que bloqueia, nomes ignorados, sem sugestões. */
export function babyNamesNotice(raw: RawBabyNamesResponse, situacao: string | null | undefined): string | null {
  if (situacao === 'nasceu_registrado') return null;
  const partes: string[] = [];
  if ((raw.nomesPaisIgnorados ?? []).length > 0) {
    partes.push(
      `Não consegui ler: ${(raw.nomesPaisIgnorados ?? []).join(', ')}. Use só letras, até 5 nomes, separados por vírgula.`,
    );
  }
  if (raw.semSugestoes) {
    partes.push(
      raw.motivoSemSugestoes === 'sobrenomes_bloqueiam'
        ? 'Com esses sobrenomes, todos os nomes que testei formam uma sequência que pede atenção no mapa do bebê. Veja a leitura dos nomes que vocês pensaram ou confira a grafia dos sobrenomes.'
        : 'Não encontrei nomes que combinem com o mapa do bebê dentro do que você pediu. Tente outro estilo.',
    );
  }
  // O sexo escolhido ficou sem nenhuma sugestão (os sobrenomes bloqueiam quase todos os nomes).
  const faltantes = (raw.gruposSemSugestoes ?? []).filter((g) => g === 'menina' || g === 'menino');
  if (!raw.semSugestoes && faltantes.length > 0) {
    partes.push(
      `Não encontrei nomes de ${faltantes[0] === 'menina' ? 'menina' : 'menino'} que combinem com o mapa do bebê com esses sobrenomes. Veja as outras sugestões ou confira a grafia dos sobrenomes.`,
    );
  }
  return partes.length > 0 ? partes.join(' ') : null;
}

export interface SecoesBebe {
  seu: CandidateSuggestion[];
  menina: CandidateSuggestion[];
  menino: CandidateSuggestion[];
  neutro: CandidateSuggestion[];
  outros: CandidateSuggestion[];
}

export const ORDEM_SECOES_BEBE: readonly GrupoBebeChat[] = ['seu', 'menina', 'menino', 'neutro'];

export function dividirPorGrupoBebe(lista: CandidateSuggestion[]): SecoesBebe {
  const por = (g: GrupoBebeChat) => lista.filter((s) => s.grupoBebe === g);
  return {
    seu: por('seu'),
    menina: por('menina'),
    menino: por('menino'),
    neutro: por('neutro'),
    outros: lista.filter((s) => !s.grupoBebe),
  };
}

export function temSecoesBebe(lista: CandidateSuggestion[]): boolean {
  return lista.some((s) => Boolean(s.grupoBebe));
}
