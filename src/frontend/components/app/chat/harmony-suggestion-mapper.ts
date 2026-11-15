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
  const vidaCodigos = Array.isArray(p.vidaBloqueiosCodigos)
    ? p.vidaBloqueiosCodigos
    : (p.bloqueios ?? []).some((b) => Array.isArray(b.triangulos))
      ? (p.bloqueios ?? [])
          .filter((b) => Array.isArray(b.triangulos) && b.triangulos.includes('vida'))
          .map((b) => b.codigo)
          .filter(Boolean)
      : c.bloqueiosRestantes === 0
        ? []
        : undefined;

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
    vidaBloqueiosCodigos: vidaCodigos,
  };
}
