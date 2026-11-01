/**
 * Núcleo de numerologia cabalística.
 * Portado do index.html original.
 */

// Tabela de conversão letra → número (numerologia cabalística)
export const TABELA_CONVERSAO: Record<string, number> = {
  A: 1, I: 1, Q: 1, J: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5,
  U: 6, V: 6, W: 6, X: 6, Ç: 6, // DEV-260: X = 6 (regra do curso)
  O: 7, Z: 7,
  F: 8, P: 8,
};

// Diacríticos (modificadores)
const DIACRITICO_AGUDO = '\u0301';        // ´ → +2
const DIACRITICO_TIL = '\u0303';         // ~ → +3
const DIACRITICO_GRAVE = '\u0300';       // ` → ×2
const DIACRITICO_TREMA = '\u0308';       // ¨ → ×2
const DIACRITICO_CIRCUNFLEXO = '\u0302'; // ^ → +7
const DIACRITICO_ANEL = '\u030A';        // ° (ex.: Å) → +7

// Apóstrofos (' e ’): somam +2 na letra anterior (ex.: D'Angelo = 30)
const APOSTROFOS = /['\u2019]/g;
const APOSTROFO_SOMA = 2;

/**
 * Calcula o valor numerológico de uma única letra.
 * Aplica os modificadores de acento conforme as regras cabalísticas.
 */
export function calcularValor(letra: string): number {
  // Apóstrofo(s) colados na letra (ver extrairLetras): +2 cada, na letra anterior.
  const apostrofos = (letra.match(APOSTROFOS) ?? []).length;
  const bonusApostrofo = apostrofos * APOSTROFO_SOMA;
  letra = letra.replace(APOSTROFOS, '');
  if (!letra) return 0;

  if (letra.normalize('NFC').toUpperCase() === 'Ç') return 6 + bonusApostrofo;

  const decomposto = letra.normalize('NFD');
  const base = decomposto.charAt(0).toUpperCase();

  let valor = TABELA_CONVERSAO[base] ?? 0;

  if (decomposto.length > 1) {
    const diacritico = decomposto.charAt(1);
    switch (diacritico) {
      case DIACRITICO_AGUDO:
        valor += 2;
        break;
      case DIACRITICO_TIL:
        valor += 3;
        break;
      case DIACRITICO_GRAVE:
        valor *= 2;
        break;
      case DIACRITICO_TREMA:
        valor *= 2;
        break;
      case DIACRITICO_CIRCUNFLEXO:
        valor += 7;
        break;
      case DIACRITICO_ANEL:
        valor += 7;
        break;
    }
  }

  // Letra sem valor na tabela (símbolo, dígito) não recebe bônus de apóstrofo.
  return valor > 0 ? valor + bonusApostrofo : 0;
}

/**
 * Reduz um número somando seus dígitos, preservando masters 11 e 22 se solicitado.
 */
export function reduzirNumero(n: number, preservarMasters = false): number {
  if (n === undefined || n === null || isNaN(n)) return 0;
  let numero = Math.floor(n);

  while (numero > 9 && !(preservarMasters && (numero === 11 || numero === 22))) {
    numero = String(numero)
      .split('')
      .reduce((acc, d) => acc + parseInt(d, 10), 0);
  }

  return numero;
}

/**
 * Verifica se uma letra é vogal (para cálculo de Motivação/Alma).
 */
export function ehVogal(letra: string): boolean {
  const base = letra.normalize('NFD').charAt(0).toUpperCase();
  return ['A', 'E', 'I', 'O', 'U'].includes(base);
}

/**
 * Verifica se uma letra é consoante (para cálculo de Missão/Impressão).
 */
export function ehConsoante(letra: string): boolean {
  const base = letra.normalize('NFD').charAt(0).toUpperCase();
  return /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇÑ]$/i.test(base) && !ehVogal(letra);
}

/**
 * Extrai apenas letras (sem espaços) do nome completo.
 * Apóstrofos ficam colados na letra anterior (ex.: "D'"), para somar +2 nela.
 */
export function extrairLetras(nome: string): string[] {
  const letras: string[] = [];
  for (const ch of nome.normalize('NFC').replace(/\s+/g, '')) {
    if (/['\u2019]/.test(ch)) {
      // DEV-260: apóstrofo gruda na letra anterior (calcularValor soma +2). Sem letra antes, descarta.
      if (letras.length > 0) letras[letras.length - 1] += ch;
      continue;
    }
    letras.push(ch);
  }
  return letras;
}

/**
 * Extrai apenas o primeiro nome.
 */
export function extrairPrimeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

/**
 * Calcula a idade com base na data de nascimento (DD/MM/AAAA)
 */
export function calcularIdade(dataNascimento: string): number {
  if (!dataNascimento) return 0;
  const partes = dataNascimento.split('/');
  if (partes.length !== 3) return 0;
  
  const [dia, mes, ano] = partes.map(Number);
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return 0;

  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  
  const mesAtual = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();
  
  if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
    idade--;
  }
  
  return idade;
}
