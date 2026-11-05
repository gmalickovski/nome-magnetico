import type { CandidateSuggestion } from './chat-types.js';

/** Ordem cumulativa do chat (3 iniciais + rodadas “ver mais”), sem duplicatas por nome. */
export function chatSuggestionsToExportNames(suggestions: CandidateSuggestion[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of suggestions) {
    const nome = s.nome.trim();
    if (nome.length < 2) continue;
    const key = nome.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(nome);
  }
  return out;
}
