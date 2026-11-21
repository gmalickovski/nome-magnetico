/**
 * Avaliação neutra de um nome candidato livre (DEV-321).
 *
 * Usada por produtos que avaliam nomes que não nascem do nome de nascimento
 * (nome artístico novo e, no futuro, o caminho do bebê no chat). Não depende de
 * nenhum produto: só do núcleo numerológico. O motor do Nome Social e o do bebê
 * (`nome-bebe.ts`) não usam este módulo, para que mudar um não interfira no outro.
 */

import { calcularTodosTriangulos, detectarBloqueios, type Bloqueio } from '../../triangle';
import {
  calcularDestino,
  calcularExpressao,
  calcularImpressao,
  calcularMissao,
  calcularMotivacao,
} from '../../numbers';
import {
  calcularDebitosCarmicos,
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  type DebitoCarmicoInfo,
  type LicaoCarmica,
  type TendenciaOculta,
} from '../../karmic';
import { avaliarCompatibilidade } from '../../harmonization';
import { avaliarNome, calcularScoreV1SemOcorrenciasExtras } from '../../score';
import { isScoreV3 } from '../../score-version';

/** Piso absoluto de nota para sugerir um nome livre (mesmo piso do motor v4, DEV-301). */
export const NOTA_MINIMA_NOME_LIVRE = 70;

export interface AvaliacaoCandidato {
  nomeCompleto: string;
  expressao: number;
  motivacao: number;
  missao: number;
  impressao: number;
  destino: number;
  bloqueios: Bloqueio[];
  temBloqueio: boolean;
  compatibilidade: 'favoravel' | 'neutro' | 'desfavoravel';
  score: number;
  licoesCarmicas: LicaoCarmica[];
  tendenciasOcultas: TendenciaOculta[];
  debitosCarmicos: DebitoCarmicoInfo[];
}

/** Calcula os 5 números, os 4 triângulos, bloqueios, karma, compatibilidade e nota. */
export function avaliarCandidatoLivre(nomeCompleto: string, dataNascimento: string): AvaliacaoCandidato {
  const nome = nomeCompleto.trim().replace(/\s+/g, ' ');
  const todos = calcularTodosTriangulos(nome, dataNascimento);
  const bloqueios = detectarBloqueios(todos);
  const expressao = calcularExpressao(nome);
  const motivacao = calcularMotivacao(nome);
  const missao = calcularMissao(nome, dataNascimento);
  const impressao = calcularImpressao(nome);
  const destino = calcularDestino(dataNascimento);
  const licoesCarmicas = detectarLicoesCarmicas(nome);
  const tendenciasOcultas = detectarTendenciasOcultas(nome);
  const debitosCarmicos = calcularDebitosCarmicos(dataNascimento, destino, motivacao, expressao);
  const compatibilidade = avaliarCompatibilidade(expressao, destino);
  const score = isScoreV3()
    ? avaliarNome(nome, dataNascimento).score_v3
    : calcularScoreV1SemOcorrenciasExtras({
        bloqueios,
        licoesCarmicas: licoesCarmicas.length,
        tendenciasOcultas: tendenciasOcultas.length,
        debitosCarmicos,
        compatibilidade,
      });
  return {
    nomeCompleto: nome,
    expressao,
    motivacao,
    missao,
    impressao,
    destino,
    bloqueios,
    temBloqueio: bloqueios.length > 0,
    compatibilidade,
    score,
    licoesCarmicas,
    tendenciasOcultas,
    debitosCarmicos,
  };
}

/** Zero bloqueio, sem tensão vibracional e nota mínima. */
export function candidatoOfertavel(a: AvaliacaoCandidato, notaMinima = NOTA_MINIMA_NOME_LIVRE): boolean {
  return !a.temBloqueio && a.compatibilidade !== 'desfavoravel' && a.score >= notaMinima;
}
