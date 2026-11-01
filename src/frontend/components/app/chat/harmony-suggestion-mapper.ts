import type { CandidateSuggestion } from './chat-types.js';
import type { HarmonySuggestionCardData } from '../../landing/ProductResultFrame.js';

function mapCompatibilidade(raw: string): HarmonySuggestionCardData['compatibilidade'] {
  const n = raw.toLowerCase();
  if (n.includes('favor') || n.includes('total') || n.includes('complement')) return 'favoravel';
  if (n.includes('neutr') || n.includes('aceit')) return 'neutro';
  return 'desfavoravel';
}

export function mapCandidateToHarmonySuggestion(
  c: CandidateSuggestion,
): HarmonySuggestionCardData {
  const p = c.panel;
  return {
    nome: c.nome,
    score: c.score,
    compatibilidade: mapCompatibilidade(c.compatibilidade),
    expressao: c.expressao ?? p.expressao,
    destino: p.destino,
    motivacao: p.motivacao,
    impressao: p.impressao,
    missao: p.missao,
    bloqueios: c.bloqueiosRestantes,
  };
}
