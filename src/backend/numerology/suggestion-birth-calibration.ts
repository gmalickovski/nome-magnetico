/**
 * Calibração DEV-275 — distribuição de ganho sobre nascimento (só motor determinístico).
 */

import {
  analisarNomeSocial,
  gerarCandidatosComNivel,
} from './products/nome-social';
import { passaGanhoMinimo } from './suggestion-birth-invariant';

export interface CalibracaoGanhoLinha {
  limiarGanho: number;
  amostrasComCandidato: number;
  mediaDeltaMelhor: number;
  medianaDeltaMelhor: number;
  mediaOpcoesAcimaLimiar: number;
}

export interface FixtureCalibracao {
  nomeNascimento: string;
  dataNascimento: string;
}

export function scoreNascimentoMotor(nomeNascimento: string, dataNascimento: string): number {
  return analisarNomeSocial(nomeNascimento.trim(), dataNascimento, 'usuario').score;
}

/** Fixtures sintéticas — sem dados de clientes. */
export function fixturesCalibracaoGanho(): FixtureCalibracao[] {
  const nomes = [
    'Ana Paula Ferreira Lima',
    'Guilherme Malickovski Correa',
    'Juliana Martins Rocha',
    'Lucas Henrique Barbosa',
    'Maria da Silva Santos',
    'Pedro Augusto Mendes',
    'Fernanda Costa Oliveira',
    'Rafael Souza Almeida',
    'Camila Dias Nunes',
    'Bruno Carvalho Ribeiro',
    'Patrícia Luz Monteiro',
    'Diego Pinto Gomes',
  ];
  const datas = [
    '01/01/1990',
    '14/02/1990',
    '18/03/1992',
    '27/04/1991',
    '23/07/1988',
    '11/11/1985',
    '05/06/1993',
    '19/09/1987',
    '03/12/1991',
    '22/08/1989',
    '16/04/1994',
    '30/07/1986',
  ];
  return nomes.map((nomeNascimento, i) => ({
    nomeNascimento,
    dataNascimento: datas[i % datas.length]!,
  }));
}

const LIMIARES_CALIBRACAO = [0, 1, 2, 3, 5] as const;

function mediana(vals: number[]): number {
  if (vals.length === 0) return 0;
  const s = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function calibrarDistribuicaoGanhoSobreNascimento(
  fixtures: FixtureCalibracao[] = fixturesCalibracaoGanho(),
): CalibracaoGanhoLinha[] {
  const deltasMelhor: number[] = [];
  const contagensPorLimiar: Record<number, number[]> = Object.fromEntries(
    LIMIARES_CALIBRACAO.map((l) => [l, [] as number[]]),
  );

  for (const fx of fixtures) {
    const base = scoreNascimentoMotor(fx.nomeNascimento, fx.dataNascimento);
    const candidatosNomes = gerarCandidatosComNivel(fx.nomeNascimento).map((c) => c.nome);
    const scores = candidatosNomes.map((nome) =>
      analisarNomeSocial(nome, fx.dataNascimento, 'ia').score,
    );
    const melhor = scores.length ? Math.max(...scores) : base;
    deltasMelhor.push(melhor - base);

    for (const limiar of LIMIARES_CALIBRACAO) {
      const acima = scores.filter((s) => passaGanhoMinimo(s, base, limiar)).length;
      contagensPorLimiar[limiar]!.push(acima);
    }
  }

  const media = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return LIMIARES_CALIBRACAO.map((limiarGanho) => ({
    limiarGanho,
    amostrasComCandidato: fixtures.length,
    mediaDeltaMelhor: Math.round(media(deltasMelhor) * 100) / 100,
    medianaDeltaMelhor: mediana(deltasMelhor),
    mediaOpcoesAcimaLimiar: Math.round(media(contagensPorLimiar[limiarGanho]!) * 100) / 100,
  }));
}

export function formatarTabelaCalibracaoGanho(linhas: CalibracaoGanhoLinha[]): string {
  const header =
    '| Limiar ganho (pts) | Amostras | Média Δ melhor | Mediana Δ melhor | Média opções acima do limiar |';
  const sep = '|---|---:|---:|---:|---:|';
  const body = linhas
    .map(
      (r) =>
        `| ${r.limiarGanho} | ${r.amostrasComCandidato} | ${r.mediaDeltaMelhor} | ${r.medianaDeltaMelhor} | ${r.mediaOpcoesAcimaLimiar} |`,
    )
    .join('\n');
  return `${header}\n${sep}\n${body}`;
}
