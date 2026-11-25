export function buildSavedAnalysisPanelHref(id: string): string {
  return `/app/analises?id=${encodeURIComponent(id)}&painel=1`;
}
