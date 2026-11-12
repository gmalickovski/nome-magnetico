import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NOME_SOCIAL_MAX_SUGESTOES_TOTAL,
  validarPedidoGerarMais,
} from './gerar-mais-limits.ts';

describe('DEV-275 · teto gerar mais (9 opções, 2 pedidos extras)', () => {
  it('permite pedidos até completar 9 sugestões', () => {
    assert.equal(validarPedidoGerarMais(3).ok, true);
    assert.equal(validarPedidoGerarMais(6).ok, true);
  });

  it('bloqueia após 9 sugestões ou 2 pedidos extras', () => {
    const noTeto = validarPedidoGerarMais(NOME_SOCIAL_MAX_SUGESTOES_TOTAL);
    assert.equal(noTeto.ok, false);
    if (!noTeto.ok) assert.equal(noTeto.codigo, 'LIMITE_TOTAL_SUGESTOES');

    const aposDoisPedidos = validarPedidoGerarMais(9);
    assert.equal(aposDoisPedidos.ok, false);
  });
});
