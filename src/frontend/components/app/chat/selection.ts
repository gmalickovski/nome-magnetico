/**
 * DEV-235 · Lógica pura de seleção alternável (toggle) para os cards de sugestão.
 * - Clicar no card selecionado desmarca (null) e o painel volta ao nome de nascimento (base).
 * - Clicar em outro card seleciona a nova sugestão e atualiza o painel para ela.
 */

export function toggleSelection(
  currentSelectedId: string | null,
  clickedId: string
): string | null {
  if (currentSelectedId === clickedId) {
    return null;
  }
  return clickedId;
}

export function isSelected(
  currentSelectedId: string | null,
  candidateId: string
): boolean {
  return currentSelectedId === candidateId;
}
