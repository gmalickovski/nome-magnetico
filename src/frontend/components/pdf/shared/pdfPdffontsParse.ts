/**
 * Parser da saída de `pdffonts` (Poppler).
 * Colunas: name | type | emb | sub | uni | object ID
 * Não usar split simples — o tipo ocupa uma ou duas colunas (ex.: "CID TrueType").
 */

export function parsePdffontsEmbColumn(line: string): { name: string; embedded: boolean } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('name ') || trimmed.startsWith('-')) return null;

  const tail = trimmed.match(/\s(yes|no)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/i);
  if (!tail) return null;

  const emb = tail[1].toLowerCase() === 'yes';
  let name = trimmed.slice(0, trimmed.indexOf(tail[0])).trim();
  name = name
    .replace(/\s+(CID\s+TrueType|TrueType|Type\s+1|Type\s+\d+|CID\s+\S+)\s*$/i, '')
    .trim();
  if (!name) return null;

  return { name, embedded: emb };
}

export function parsePdffontsEmbeddedFontNames(stdout: string): string[] {
  const embedded: string[] = [];
  for (const line of stdout.split('\n')) {
    const parsed = parsePdffontsEmbColumn(line);
    if (parsed?.embedded) embedded.push(parsed.name);
  }
  return embedded;
}
