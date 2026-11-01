import type { ChatCollectState } from './decide-live-bridge.js';
import { collectStateToRankingPatch } from './decide-live-bridge.js';

export function buildChatPdfAnalyzePayload(input: {
  birthName: string;
  birthDate: string;
  selectedSocialName: string;
  collect: ChatCollectState;
}): Record<string, unknown> {
  const ranking = collectStateToRankingPatch(input.collect);
  const birthName = input.birthName.trim();
  const birthDate = input.birthDate.trim();
  const selected = input.selectedSocialName.trim();

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
  };
}
