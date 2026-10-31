/**
 * Painel do nome de nascimento — mesmo score da análise oficial (avaliarNome · score_v3).
 * Usado em decide-live, SSR do chat e testes.
 */

import { avaliarNome } from './score';
import { calcularTodosTriangulos, detectarBloqueios } from './triangle';
import { calcularCincoNumeros } from './numbers';
import { avaliarCompatibilidade, type TipoCompatibilidade } from './harmonization';

export interface BirthNamePanelData {
  nomeExibido: string;
  score: number;
  potencial: number;
  destino: number;
  expressao: number;
  motivacao: number;
  missao: number;
  impressao: number;
  bloqueiosCount: number;
  bloqueiosCodigos: string[];
  compatibilidade: TipoCompatibilidade;
  trianguloVidaLinhas: number[][];
}

/** Payload serializável para o chat (ResultPanelData). */
export interface ClientBirthNamePanel {
  nome: string;
  score: number;
  expressao: number;
  destino: number;
  motivacao: number;
  missao: number;
  impressao: number;
  potencial: number;
  bloqueiosCount: number;
  bloqueios: Array<{ codigo: string; titulo: string }>;
  trianguloVida: { topo: number; base: number[] };
  compatibilidade?: string;
}

export function buildBirthNamePanel(nome: string, dataPtBr: string): BirthNamePanelData {
  const nomeLimpo = nome.trim();
  const avaliacao = avaliarNome(nomeLimpo, dataPtBr, { calcularPotencial: true });
  const triangulos = calcularTodosTriangulos(nomeLimpo, dataPtBr);
  const bloqueios = detectarBloqueios(triangulos);
  const cinco = calcularCincoNumeros(nomeLimpo, dataPtBr);
  const destino = cinco.destino ?? 0;

  return {
    nomeExibido: nomeLimpo,
    score: avaliacao.score_v3,
    potencial: avaliacao.potencial ?? avaliacao.score_v3,
    destino,
    expressao: cinco.expressao,
    motivacao: cinco.motivacao,
    missao: cinco.missao,
    impressao: cinco.impressao,
    bloqueiosCount: bloqueios.length,
    bloqueiosCodigos: bloqueios.map((b) => b.codigo),
    compatibilidade: avaliarCompatibilidade(cinco.expressao, destino),
    trianguloVidaLinhas: triangulos.vida.linhas,
  };
}

export function toClientBirthNamePanel(panel: BirthNamePanelData): ClientBirthNamePanel {
  return {
    nome: panel.nomeExibido,
    score: panel.score,
    expressao: panel.expressao,
    destino: panel.destino,
    motivacao: panel.motivacao,
    missao: panel.missao,
    impressao: panel.impressao,
    potencial: panel.potencial,
    bloqueiosCount: panel.bloqueiosCount,
    bloqueios: panel.bloqueiosCodigos.map((codigo) => ({
      codigo,
      titulo: `Sequência ${codigo}`,
    })),
    trianguloVida: {
      topo: panel.trianguloVidaLinhas[0]?.[0] ?? 0,
      base: panel.trianguloVidaLinhas[0]?.slice(1) ?? [],
    },
    compatibilidade: panel.compatibilidade,
  };
}

export function buildClientBirthNamePanel(nome: string, dataPtBr: string): ClientBirthNamePanel {
  return toClientBirthNamePanel(buildBirthNamePanel(nome, dataPtBr));
}
