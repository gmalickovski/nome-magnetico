/**
 * Potencial máximo de assinatura para o CTA do PDF gratuito (DEV-275).
 * Mesma amostra do motor determinístico que a análise paga (gerador + analisarNomeSocial).
 */
import { isScoreV3 } from '../score-version';
import {
  analisarNomeSocial,
  gerarCandidatosComNivel,
} from './nome-social';

export type PotencialAssinaturaPdfGratuito = {
  /** Nota v3 do nome de nascimento, sem arredondamento de exibição. */
  notaBase: number;
  /** Maior nota entre candidatos elegíveis; null se nenhum supera a base. */
  potencialMax: number | null;
  /** false quando o motor v3 está desligado (bloco não deve aparecer). */
  calculado: boolean;
};

/** Comparação estrita, sem arredondar para cima (ex.: 66.4 vs 66.4). */
export function notaEstritamenteMaiorQueBase(potencialMax: number, notaBase: number): boolean {
  return potencialMax > notaBase;
}

/**
 * Elegível no padrão da análise paga sem entrevista: gerador determinístico,
 * sem sequência no Triângulo da Vida e nota estritamente acima do nascimento.
 */
export function calcularPotencialAssinaturaPdfGratuito(
  nomeNascimento: string,
  dataNascimento: string,
): PotencialAssinaturaPdfGratuito {
  if (!isScoreV3()) {
    return { notaBase: 0, potencialMax: null, calculado: false };
  }

  const nasc = nomeNascimento.trim();
  if (nasc.length < 2) {
    return { notaBase: 0, potencialMax: null, calculado: false };
  }

  const notaBase = analisarNomeSocial(nasc, dataNascimento, 'usuario').score;
  let potencialMax: number | null = null;

  for (const { nome } of gerarCandidatosComNivel(nasc)) {
    const analise = analisarNomeSocial(nome, dataNascimento, 'ia');
    if (!analise.semSequenciaVida) continue;
    if (analise.score <= notaBase) continue;
    if (potencialMax === null || analise.score > potencialMax) {
      potencialMax = analise.score;
    }
  }

  return { notaBase, potencialMax, calculado: true };
}

/**
 * Referência de paridade com a análise paga nas mesmas entradas (candidatos do gerador).
 */
export function potencialMaximoGeradorParidade(
  nomeNascimento: string,
  dataNascimento: string,
): number | null {
  return calcularPotencialAssinaturaPdfGratuito(nomeNascimento, dataNascimento).potencialMax;
}
