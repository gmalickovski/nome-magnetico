/**
 * Avaliação Contínua e Debounce de Digitação (DEV-235 · Seção 5A).
 * Atualiza o radar pentagonal e o preview do resumo em tempo real enquanto o consulente digita.
 */

import { computeRadarAxes, type RadarAxis, type ProfileInputForRadar } from './radar-axes';

export interface LiveScoreResult {
  radarAxes: RadarAxis[];
  previewLinhaResumo?: string;
  inferredFocus?: string;
}

export function evaluateLiveTyping(
  text: string,
  baseProfile: ProfileInputForRadar
): LiveScoreResult {
  const limpo = text.trim();
  const lower = limpo.toLowerCase();

  let inferredFocus = baseProfile.areaFoco ?? undefined;
  if (lower.includes('dinheiro') || lower.includes('renda') || lower.includes('financ')) {
    inferredFocus = 'prosperidade_financeira';
  } else if (lower.includes('trabalh') || lower.includes('contrat') || lower.includes('client') || lower.includes('venda')) {
    inferredFocus = 'carreira_negocios';
  } else if (lower.includes('relac') || lower.includes('casal') || lower.includes('famil')) {
    inferredFocus = 'relacionamentos_harmonia';
  } else if (lower.includes('confian') || lower.includes('express') || lower.includes('presen')) {
    inferredFocus = 'autoestima_expressao';
  }

  const updatedProfile: ProfileInputForRadar = {
    ...baseProfile,
    objetivoTexto: limpo,
    areaFoco: inferredFocus ?? baseProfile.areaFoco,
  };

  const radarAxes = computeRadarAxes(updatedProfile);

  let previewLinhaResumo: string | undefined;
  if (limpo.length > 5) {
    previewLinhaResumo = limpo.length > 45 ? `${limpo.slice(0, 42)}...` : limpo;
  }

  return {
    radarAxes,
    previewLinhaResumo,
    inferredFocus,
  };
}
