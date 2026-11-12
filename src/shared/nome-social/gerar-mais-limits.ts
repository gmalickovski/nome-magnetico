/**
 * DEV-275 — Teto de "Gerar mais" (9 opções, 2 pedidos extras de 3).
 */

export const NOME_SOCIAL_SUGESTOES_INICIAIS = 3;
export const NOME_SOCIAL_SUGESTOES_POR_RODADA = 3;
export const NOME_SOCIAL_MAX_PEDIDOS_GERAR_MAIS = 2;
export const NOME_SOCIAL_MAX_SUGESTOES_TOTAL = 9;

export function podePedirGerarMais(totalJaExibidos: number): boolean {
  return validarPedidoGerarMais(totalJaExibidos).ok;
}

export function limiteNovosNestaRodada(totalJaExibidos: number): number {
  const restante = NOME_SOCIAL_MAX_SUGESTOES_TOTAL - totalJaExibidos;
  return Math.max(0, Math.min(NOME_SOCIAL_SUGESTOES_POR_RODADA, restante));
}

export type ValidacaoGerarMais =
  | { ok: true; limiteNovos: number }
  | { ok: false; codigo: 'LIMITE_GERAR_MAIS' | 'LIMITE_TOTAL_SUGESTOES'; mensagem: string };

export function validarPedidoGerarMais(totalJaExibidos: number): ValidacaoGerarMais {
  if (totalJaExibidos >= NOME_SOCIAL_MAX_SUGESTOES_TOTAL) {
    return {
      ok: false,
      codigo: 'LIMITE_TOTAL_SUGESTOES',
      mensagem:
        'Você já viu o máximo de sugestões desta rodada. Ajuste suas preferências para receber outras combinações.',
    };
  }

  const rodadasExtras =
    Math.floor(totalJaExibidos / NOME_SOCIAL_SUGESTOES_POR_RODADA) - 1;
  if (rodadasExtras >= NOME_SOCIAL_MAX_PEDIDOS_GERAR_MAIS) {
    return {
      ok: false,
      codigo: 'LIMITE_GERAR_MAIS',
      mensagem:
        'Você já usou os dois pedidos extras de sugestões. Ajuste suas preferências para explorar outras combinações.',
    };
  }

  const limiteNovos = limiteNovosNestaRodada(totalJaExibidos);
  if (limiteNovos <= 0) {
    return {
      ok: false,
      codigo: 'LIMITE_TOTAL_SUGESTOES',
      mensagem:
        'Não há espaço para novas sugestões nesta rodada. Ajuste suas preferências para recalcular.',
    };
  }
  return { ok: true, limiteNovos };
}
