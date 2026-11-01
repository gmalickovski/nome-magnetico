/**
 * Resumo numerológico serializável para o painel lateral do chat (DEV-235).
 * Espelha os blocos de NomeSocialResultado / analyze-live.
 */

import { ARCANOS, type Arcano } from './arcanos';
import {
  calcularDebitosCarmicos,
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  mapearFrequencias,
} from './karmic';
import { calcularDestino, calcularExpressao, calcularMotivacao } from './numbers';
import { calcularTodosTriangulos, detectarBloqueios } from './triangle';
import type { Bloqueio } from './triangle';

export type ChatArcanoSummary = Pick<
  Arcano,
  'numero' | 'nome' | 'palavraChave' | 'descricao' | 'desafio'
>;

export interface ChatReadingSummary {
  nomeExibido: string;
  triangulos: ReturnType<typeof calcularTodosTriangulos>;
  bloqueios: Bloqueio[];
  licoesCarmicas: ReturnType<typeof detectarLicoesCarmicas>;
  tendenciasOcultas: ReturnType<typeof detectarTendenciasOcultas>;
  debitosCarmicos: ReturnType<typeof calcularDebitosCarmicos>;
  frequencias: Record<number, number>;
  arcanos: Record<number, ChatArcanoSummary>;
}

function pickArcanosForTriangulos(
  triangulos: ReturnType<typeof calcularTodosTriangulos>
): Record<number, ChatArcanoSummary> {
  const ids = new Set<number>();
  for (const t of Object.values(triangulos)) {
    if (t.arcanoRegente != null) ids.add(t.arcanoRegente);
    for (const n of t.arcanosDoMinantes ?? []) ids.add(n);
    for (const n of t.arcanosDePassagem ?? []) ids.add(n);
    if (t.arcanoAtual?.numero != null) ids.add(t.arcanoAtual.numero);
  }

  const out: Record<number, ChatArcanoSummary> = {};
  for (const id of ids) {
    const a = ARCANOS[id];
    if (!a) continue;
    out[id] = {
      numero: a.numero,
      nome: a.nome,
      palavraChave: a.palavraChave,
      descricao: a.descricao,
      desafio: a.desafio,
    };
  }
  return out;
}

export function buildChatReadingSummary(
  nomeCompleto: string,
  dataNascimentoPtBr: string
): ChatReadingSummary {
  const nomeExibido = nomeCompleto.trim();
  const triangulos = calcularTodosTriangulos(nomeExibido, dataNascimentoPtBr);
  const bloqueios = detectarBloqueios(triangulos);
  const expressao = calcularExpressao(nomeExibido);
  const destino = calcularDestino(dataNascimentoPtBr);
  const motivacao = calcularMotivacao(nomeExibido);

  return {
    nomeExibido,
    triangulos,
    bloqueios,
    licoesCarmicas: detectarLicoesCarmicas(nomeExibido),
    tendenciasOcultas: detectarTendenciasOcultas(nomeExibido),
    debitosCarmicos: calcularDebitosCarmicos(
      dataNascimentoPtBr,
      destino,
      motivacao,
      expressao
    ),
    frequencias: mapearFrequencias(nomeExibido),
    arcanos: pickArcanosForTriangulos(triangulos),
  };
}
