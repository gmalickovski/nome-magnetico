import type { ChatCollectState } from './decide-live-bridge.js';
import { collectStateToRankingPatch } from './decide-live-bridge.js';
import type { CandidateSuggestion } from './chat-types.js';
import { chatSuggestionsToExportNames } from './chat-export-suggestions.js';

export function buildChatPdfAnalyzePayload(input: {
  birthName: string;
  birthDate: string;
  selectedSocialName: string;
  collect: ChatCollectState;
  /** Sugestões já exibidas no chat desta sessão (ordem cumulativa). */
  suggestions: CandidateSuggestion[];
}): Record<string, unknown> {
  const ranking = collectStateToRankingPatch(input.collect);
  const birthName = input.birthName.trim();
  const birthDate = input.birthDate.trim();
  const selected = input.selectedSocialName.trim();
  const exportNames = chatSuggestionsToExportNames(input.suggestions);

  return {
    product_type: 'nome_social',
    nome_completo: birthName,
    data_nascimento: birthDate,
    nome_social_principal: selected,
    nome_ja_escolhido: true,
    aceita_encurtar_apelido: Boolean(ranking.aceitaEncurtarOuApelido),
    onde_vai_usar: input.collect.ondeAssina.length > 0 ? input.collect.ondeAssina : undefined,
    assinatura_atual: ranking.assinaturaAtual ?? input.collect.nomeUsoBase ?? undefined,
    objetivo_apresentacao: input.collect.objetivoTexto.trim() || undefined,
    nomes_candidatos: exportNames.length > 0 ? exportNames : undefined,
    /** Com histórico vazio: não pedir ranking do motor (lista vazia explícita). */
    ranking_somente_chat: true,
    ranking_vazio_sem_autogeracao: exportNames.length === 0,
  };
}
