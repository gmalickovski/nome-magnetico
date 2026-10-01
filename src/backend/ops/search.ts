export function searchToken(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}@.+_\- ]/gu, '')
    .trim()
    .slice(0, 120);
}

export function quoteFilter(value: string): string {
  return `"${value.replace(/"/g, '')}"`;
}
