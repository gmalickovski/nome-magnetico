export const NOME_SOCIAL_MAX_MANUAIS = 5;

/** Mesma chave usada nas sugestões: acentos e grafias que mudam o cálculo são preservados. */
export function normalizarChaveNome(nome: string): string {
  return nome.trim().toLowerCase();
}

export function validarNomeManual(nome: string): string | null {
  const trimmed = nome.trim();
  if (trimmed.length < 2 || nome.length > 150) return 'Informe um nome entre 2 e 150 caracteres.';
  if (/\u030A/u.test(nome.normalize('NFD'))) return 'Use uma grafia sem anel diacrítico.';
  if (/\p{N}/u.test(nome)) return 'Use um nome sem números.';
  if (!/^[\p{Script=Latin}\p{M} .'\u2019-]+$/u.test(nome) || !/\p{L}{2}/u.test(trimmed.normalize('NFC'))) {
    return 'Use letras, espaços, pontos de iniciais, apóstrofos ou hífens, com pelo menos uma palavra.';
  }
  return null;
}
