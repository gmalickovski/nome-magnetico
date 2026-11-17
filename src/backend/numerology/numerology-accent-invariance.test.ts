import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { calcularValor, extrairLetras } from './core.ts';
import { calcularExpressao, calcularImpressao, calcularMotivacao } from './numbers.ts';
import { calcularTodosTriangulos, detectarBloqueios } from './triangle.ts';
import { avaliarNome } from './score.ts';
import { analisarNomeSocial } from './products/nome-social.ts';
import { buildClientBirthNamePanel } from './birth-name-panel.ts';
import {
  NOME_SOCIAL_MAX_PEDIDOS_GERAR_MAIS,
  NOME_SOCIAL_MAX_SUGESTOES_TOTAL,
  NOME_SOCIAL_SUGESTOES_INICIAIS,
  NOME_SOCIAL_SUGESTOES_POR_RODADA,
  validarPedidoGerarMais,
} from '../../shared/nome-social/gerar-mais-limits.ts';
import { NOME_SOCIAL_MAX_MANUAIS, validarNomeManual } from '../../shared/nome-social/manual-name-limits.ts';

/**
 * DEV-301 · o motor v4 NÃO pode mudar o cálculo numerológico.
 * Valores abaixo vieram de `origin/main` (263ae67), antes do motor v4: soma pela tabela
 * (agudo +2, til +3, grave/trema ×2, circunflexo/anel +7), Expressão, Motivação,
 * Impressão, bloqueios e nota v3. Uma comparação diferencial de 5.691 combinações
 * (813 nomes × 7 datas) entre main e a branch deu resultado idêntico.
 */

const DATA = '14/02/1990';

const GOLDEN = [
  { nome: 'Larissa Barbosa Oliveira', soma: 58, expressao: 22, motivacao: 9, impressao: 4, v3: 37, bloqueios: 6 },
  { nome: 'Lárissa Barbosa Oliveira', soma: 60, expressao: 6, motivacao: 11, impressao: 4, v3: 70, bloqueios: 4 }, // agudo +2
  { nome: 'Làrissa Barbosa Oliveira', soma: 59, expressao: 5, motivacao: 1, impressao: 4, v3: 17, bloqueios: 7 }, // grave ×2
  { nome: 'Lârissa Barbosa Oliveira', soma: 65, expressao: 11, motivacao: 7, impressao: 4, v3: 31, bloqueios: 8 }, // circunflexo +7
  { nome: 'Lãrissa Barbosa Oliveira', soma: 61, expressao: 7, motivacao: 3, impressao: 4, v3: 44, bloqueios: 6 }, // til +3
  { nome: 'Lärissa Barbosa Oliveira', soma: 59, expressao: 5, motivacao: 1, impressao: 4, v3: 17, bloqueios: 7 }, // trema ×2
  { nome: 'Lårissa Barbosa Oliveira', soma: 65, expressao: 11, motivacao: 7, impressao: 4, v3: 31, bloqueios: 8 }, // anel +7
] as const;

const ENVS = ['SCORE_VERSION', 'NOME_SOCIAL_MOTOR_V4', 'NOME_SOCIAL_GANHO_MINIMO_PONTOS'] as const;
const salvo: Record<string, string | undefined> = {};

before(() => {
  for (const k of ENVS) salvo[k] = process.env[k];
  process.env.SCORE_VERSION = 'v3';
  delete process.env.NOME_SOCIAL_MOTOR_V4;
  delete process.env.NOME_SOCIAL_GANHO_MINIMO_PONTOS;
});

after(() => {
  for (const k of ENVS) {
    if (salvo[k] === undefined) delete process.env[k];
    else process.env[k] = salvo[k];
  }
});

describe('DEV-301 · tabela de valores e acentos continuam iguais', () => {
  it('valor por letra: agudo +2, til +3, grave ×2, trema ×2, circunflexo +7, anel +7', () => {
    assert.equal(calcularValor('A'), 1);
    assert.equal(calcularValor('á'), 3);
    assert.equal(calcularValor('ã'), 4);
    assert.equal(calcularValor('à'), 2);
    assert.equal(calcularValor('ä'), 2);
    assert.equal(calcularValor('â'), 8);
    assert.equal(calcularValor('å'), 8);
    assert.equal(calcularValor('é'), 7);
    assert.equal(calcularValor('õ'), 10);
    assert.equal(calcularValor('ü'), 12);
    assert.equal(calcularValor('Ç'), 6);
  });

  for (const g of GOLDEN) {
    it(`${g.nome}: soma, números, bloqueios e nota v3 iguais à main`, () => {
      const soma = extrairLetras(g.nome).reduce((acc, l) => acc + calcularValor(l), 0);
      assert.equal(soma, g.soma, 'soma pela tabela');
      assert.equal(calcularExpressao(g.nome), g.expressao, 'Expressão');
      assert.equal(calcularMotivacao(g.nome), g.motivacao, 'Motivação');
      assert.equal(calcularImpressao(g.nome), g.impressao, 'Impressão');
      assert.equal(detectarBloqueios(calcularTodosTriangulos(g.nome, DATA)).length, g.bloqueios, 'bloqueios');
      assert.equal(avaliarNome(g.nome, DATA).score_v3, g.v3, 'nota v3');
      assert.equal(analisarNomeSocial(g.nome, DATA, 'usuario').score, g.v3, 'nota do motor Nome Social');
    });
  }

  it('um único acento muda a nota (37 → 70) exatamente como antes', () => {
    const sem = avaliarNome('Larissa Barbosa Oliveira', DATA).score_v3;
    const com = avaliarNome('Lárissa Barbosa Oliveira', DATA).score_v3;
    assert.equal(sem, 37);
    assert.equal(com, 70);
  });
});

describe('DEV-301 · limites mantidos: 9 sugestões automáticas e 5 nomes manuais', () => {
  it('6 iniciais + 1 pedido de 3 = 9', () => {
    assert.equal(NOME_SOCIAL_SUGESTOES_INICIAIS, 6);
    assert.equal(NOME_SOCIAL_SUGESTOES_POR_RODADA, 3);
    assert.equal(NOME_SOCIAL_MAX_PEDIDOS_GERAR_MAIS, 1);
    assert.equal(NOME_SOCIAL_MAX_SUGESTOES_TOTAL, 9);
    assert.equal(validarPedidoGerarMais(6).ok, true);
    assert.equal(validarPedidoGerarMais(9).ok, false);
  });

  it('máximo de 5 nomes manuais, cota separada das 9 automáticas', () => {
    assert.equal(NOME_SOCIAL_MAX_MANUAIS, 5);
  });

  it('nome manual é avaliado pelo cálculo normal mesmo com bloqueio ou nota baixa (v4 não bloqueia)', () => {
    const manual = 'Làrissa Barbosa Oliveira'; // nota 17 e 7 bloqueios: o usuário pode testar
    assert.equal(validarNomeManual(manual), null);
    const painel = buildClientBirthNamePanel(manual, DATA);
    assert.equal(painel.score, 17);
    assert.equal(painel.bloqueiosCount > 0, true);
    assert.equal(painel.expressao, 5);
  });
});
