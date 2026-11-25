export interface ChatPathOption {
  id: string;
  label: string;
}

const CAMINHO_ALIAS_MAP: Record<string, string> = {
  social: 'dia_a_dia',
  nome_social: 'dia_a_dia',
  harmonizar: 'dia_a_dia',
  dia_a_dia: 'dia_a_dia',
  artistico: 'artistico',
  nome_artistico: 'artistico',
  bebe: 'bebe',
  nome_bebe: 'bebe',
};

/**
 * Resolve o parâmetro `?caminho=` da URL para uma das opções válidas de `MOTIVO_HARMONIZACAO_OPTIONS`.
 */
export function resolveInitialChatPath<T extends ChatPathOption>(
  param: string | null | undefined,
  options: ReadonlyArray<T>,
): T | null {
  const raw = param?.trim().toLowerCase();
  if (!raw) return null;
  const normalizedId = CAMINHO_ALIAS_MAP[raw] ?? raw;
  return options.find((opt) => opt.id === normalizedId) ?? null;
}
