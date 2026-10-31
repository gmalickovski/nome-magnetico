/**
 * Cálculo dos números principais da numerologia cabalística.
 */

import {
  calcularValor,
  reduzirNumero,
  ehVogal,
  ehConsoante,
  extrairLetras,
} from './core';

export interface CincoNumeros {
  expressao: number;
  destino: number;
  motivacao: number;
  impressao: number;
  missao: number;
}

/**
 * Auxiliar para decompor data de nascimento (DD/MM/AAAA ou DDMMAAAA)
 */
function extrairPartesData(dataNascimento: string): { dia: number; mes: number; ano: number } | null {
  const limpo = dataNascimento.trim();
  if (limpo.includes('/') || limpo.includes('-')) {
    const partes = limpo.split(/[\/\-]/);
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10);
      const ano = parseInt(partes[2], 10);
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
        return { dia, mes, ano };
      }
    }
  }
  const digitos = limpo.replace(/\D/g, '');
  if (digitos.length === 8) {
    const dia = parseInt(digitos.slice(0, 2), 10);
    const mes = parseInt(digitos.slice(2, 4), 10);
    const ano = parseInt(digitos.slice(4, 8), 10);
    return { dia, mes, ano };
  }
  return null;
}

/**
 * 1. Número de Expressão: todas as letras do nome completo.
 * DEV-260 (regra 2/4): Se o resultado reduzido for 2 ou 4, recalcula reduzindo cada palavra
 * separadamente (mantendo 11 e 22 em cada palavra) e soma/reduz de novo mantendo 11/22.
 */
export function calcularExpressao(nomeCompleto: string): number {
  const letras = extrairLetras(nomeCompleto);
  const soma = letras.reduce((acc, l) => acc + calcularValor(l), 0);
  const inicial = reduzirNumero(soma, true);

  if (inicial === 2 || inicial === 4) {
    const palavras = nomeCompleto.trim().split(/\s+/).filter(Boolean);
    if (palavras.length > 1) {
      const somaPartes = palavras.reduce((acc, palavra) => {
        const lts = extrairLetras(palavra);
        const s = lts.reduce((a, l) => a + calcularValor(l), 0);
        return acc + reduzirNumero(s, true);
      }, 0);
      return reduzirNumero(somaPartes, true);
    }
  }

  return inicial;
}

/**
 * 2. Número de Destino: soma dos dígitos da data de nascimento.
 * DEV-260 (regra 2/4): Se o resultado reduzido for 2 ou 4, recalcula reduzindo dia, mês e ano
 * separadamente (mantendo 11 e 22 em cada parte) e soma/reduz de novo mantendo 11/22.
 */
export function calcularDestino(dataNascimento: string): number {
  // Aceita formato DD/MM/AAAA ou DDMMAAAA
  const digitos = dataNascimento.replace(/\D/g, '');
  const soma = digitos.split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  const inicial = reduzirNumero(soma, true);

  if (inicial === 2 || inicial === 4) {
    const partes = extrairPartesData(dataNascimento);
    if (partes) {
      const diaRed = reduzirNumero(partes.dia, true);
      const mesRed = reduzirNumero(partes.mes, true);
      const anoRed = reduzirNumero(partes.ano, true);
      return reduzirNumero(diaRed + mesRed + anoRed, true);
    }
  }

  return inicial;
}

/**
 * 3. Número de Motivação/Alma: apenas vogais do nome completo.
 * DEV-260 (regra 2/4): Se o resultado reduzido for 2 ou 4, recalcula reduzindo cada palavra
 * separadamente (mantendo 11 e 22 em cada palavra) e soma/reduz de novo mantendo 11/22.
 */
export function calcularMotivacao(nomeCompleto: string): number {
  const letras = extrairLetras(nomeCompleto);
  const vogais = letras.filter(l => ehVogal(l));
  const soma = vogais.reduce((acc, l) => acc + calcularValor(l), 0);
  const inicial = reduzirNumero(soma, true);

  if (inicial === 2 || inicial === 4) {
    const palavras = nomeCompleto.trim().split(/\s+/).filter(Boolean);
    if (palavras.length > 1) {
      const somaPartes = palavras.reduce((acc, palavra) => {
        const vgs = extrairLetras(palavra).filter(l => ehVogal(l));
        const s = vgs.reduce((a, l) => a + calcularValor(l), 0);
        return acc + (s > 0 ? reduzirNumero(s, true) : 0);
      }, 0);
      return reduzirNumero(somaPartes, true);
    }
  }

  return inicial;
}

/**
 * 4. Número de Impressão: apenas consoantes do nome completo.
 *    ATENÇÃO: Não existe Impressão 11 e 22 — masters NÃO são preservados (sempre 1–9).
 *    Não usa a regra do 2/4.
 */
export function calcularImpressao(nomeCompleto: string): number {
  const letras = extrairLetras(nomeCompleto);
  const consoantes = letras.filter(l => ehConsoante(l));
  const soma = consoantes.reduce((acc, l) => acc + calcularValor(l), 0);
  return reduzirNumero(soma, false);
}

/**
 * 5. Número de Missão/Vocação: Destino + Expressão.
 *    Preserva masters 11 e 22.
 *    Não usa a regra do 2/4.
 */
export function calcularMissao(nomeCompleto: string, dataNascimento: string): number {
  const expressao = calcularExpressao(nomeCompleto);
  const destino = calcularDestino(dataNascimento);
  return reduzirNumero(expressao + destino, true);
}

/**
 * Calcula todos os números de uma vez.
 */
export function calcularCincoNumeros(
  nomeCompleto: string,
  dataNascimento: string
): CincoNumeros {
  return {
    expressao: calcularExpressao(nomeCompleto),
    destino: calcularDestino(dataNascimento),
    motivacao: calcularMotivacao(nomeCompleto),
    impressao: calcularImpressao(nomeCompleto),
    missao: calcularMissao(nomeCompleto, dataNascimento),
  };
}
