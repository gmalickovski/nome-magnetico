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

/** Ordem cumulativa: mantém rodadas anteriores e acrescenta novas (dedupe por nome). */
export function mergeChatSuggestionsCumulative(
  previous: CandidateSuggestion[],
  incoming: CandidateSuggestion[],
): CandidateSuggestion[] {
  const byKey = new Map<string, CandidateSuggestion>();
  for (const s of previous) {
    const key = s.nome.trim().toLowerCase();
    if (key.length >= 2) byKey.set(key, s);
  }
  for (const s of incoming) {
    const key = s.nome.trim().toLowerCase();
    if (key.length >= 2) byKey.set(key, s);
  }
  const order: CandidateSuggestion[] = [];
  const seen = new Set<string>();
  for (const s of [...previous, ...incoming]) {
    const key = s.nome.trim().toLowerCase();
    if (key.length < 2 || seen.has(key)) continue;
    seen.add(key);
    order.push(byKey.get(key)!);
  }
  return order;
}

export function chatSuggestionsExportFingerprint(names: string[]): string {
  return names.map((n) => n.trim().toLowerCase()).join('\u001f');
}
