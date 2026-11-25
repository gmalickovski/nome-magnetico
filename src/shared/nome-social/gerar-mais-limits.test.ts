import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NOME_SOCIAL_MAX_SUGESTOES_TOTAL,
  validarPedidoGerarMais,
} from './gerar-mais-limits.ts';

describe('DEV-305 · 3 opções de início, +3 por pedido (2 pedidos), teto de 9', () => {
  it('permite pedidos até completar 9 sugestões', () => {
    assert.equal(validarPedidoGerarMais(3).ok, true);
    assert.equal(validarPedidoGerarMais(6).ok, true);
    assert.equal(validarPedidoGerarMais(6).ok && (validarPedidoGerarMais(6) as {limiteNovos:number}).limiteNovos, 3);
  });

  it('bloqueia após 9 sugestões', () => {
    const noTeto = validarPedidoGerarMais(NOME_SOCIAL_MAX_SUGESTOES_TOTAL);
    assert.equal(noTeto.ok, false);
    if (!noTeto.ok) assert.equal(noTeto.codigo, 'LIMITE_TOTAL_SUGESTOES');

    const aposDoisPedidos = validarPedidoGerarMais(9);
    assert.equal(aposDoisPedidos.ok, false);
  });
});
