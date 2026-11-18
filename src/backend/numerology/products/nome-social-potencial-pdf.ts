/**
 * Potencial máximo de assinatura para o CTA do PDF gratuito (DEV-275).
 *
 * Diferente de `avaliacaoV3.potencial` (`calcularPotencialV3`): aquele é o maior score v3
 * entre todas as variantes do gerador (pode incluir candidatos com sequência na Vida e
 * não exige ganho acima do nascimento). Aqui usamos o mesmo gerador + `analisarNomeSocial`,
 * mas só candidatos elegíveis na análise paga padrão: `semSequenciaVida` e score > nota base.
 *
 * Quando existe ganho elegível, o valor costuma coincidir com `calcularPotencialV3`; quando não
 * há opção acima da base, o V3 permanece no teto do nascimento e `potencialMax` fica null.
 */
import { isScoreV3 } from '../score-version';
import { motivoNaoOfertavel } from '../suggestion-birth-invariant';
import { calcularPotencialV3 } from '../score';
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
 * sem bloqueios (4 triângulos) e nota >= max(70, nascimento + 1) (DEV-301).
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

  // DEV-317: etapa 4 só quando as etapas 1 a 3 não acham opção (mesma regra da análise paga).
  for (const [incluirEtapa4, semPiso] of [[false, false], [true, false], [true, true]] as const) {
    for (const { nome } of gerarCandidatosComNivel(nasc, incluirEtapa4)) {
      const analise = analisarNomeSocial(nome, dataNascimento, 'ia');
      if (!analise.semSequenciaVida) continue;
      if (motivoNaoOfertavel(analise, notaBase, undefined, { semPiso }) !== null) continue;
      if (potencialMax === null || analise.score > potencialMax) {
        potencialMax = analise.score;
      }
    }
    if (potencialMax !== null) break;
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

/** Referência explícita ao potencial V3 já usado no modal e APIs. */
export function potencialV3Existente(nomeNascimento: string, dataNascimento: string): number {
  return calcularPotencialV3(nomeNascimento.trim(), dataNascimento);
}
