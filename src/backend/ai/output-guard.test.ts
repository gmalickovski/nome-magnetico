import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COPY_PROIBIDA,
  encontrarCopyProibida,
  extrairNomesSugeridos,
  filtrarCandidatasOfertaveis,
  removerFrasesProibidas,
  validarNomesSugeridos,
} from './output-guard.ts';

/**
 * DEV-304 · guarda da saída da IA: nomes só da lista do motor e vocabulário proibido.
 */

describe('DEV-304 · vocabulário proibido', () => {
  it('acha radiestesia, pêndulo, "incompatível", prazo de entrega e preço', () => {
    assert.deepEqual(encontrarCopyProibida('A leitura usa radiestesia.'), ['radiestesia']);
    assert.deepEqual(encontrarCopyProibida('Use o pêndulo sobre o nome.'), ['radiestesia']);
    assert.deepEqual(encontrarCopyProibida('Essa combinação é incompatível com o Destino.'), ['incompativel']);
    assert.deepEqual(encontrarCopyProibida('Nomes incompatíveis geram atrito.'), ['incompativel']);
    assert.deepEqual(encontrarCopyProibida('Você recebe a entrega em 24 horas.'), ['prazo_entrega']);
    assert.deepEqual(encontrarCopyProibida('Faremos a revisão individual da sua análise.'), ['prazo_entrega']);
    assert.deepEqual(encontrarCopyProibida('Um relatório de R$150 de valor.'), ['preco']);
  });

  it('não confunde linguagem legítima: "Tensão Vibracional", 24 horas por dia, acesso imediato', () => {
    const legitimo = [
      'A combinação gera Tensão Vibracional com o seu Destino.',
      'O nome é um campo de frequência ativo 24 horas por dia, 7 dias por semana.',
      'O acesso é imediato e você faz a análise na hora.',
      'Observe os sinais nos primeiros 30, 60 e 90 dias.',
    ].join('\n');
    assert.deepEqual(encontrarCopyProibida(legitimo), []);
  });

  it('cada regra tem id único e regex', () => {
    const ids = COPY_PROIBIDA.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('remove só as frases problemáticas, mantém o resto do parágrafo e os títulos', () => {
    const texto = [
      '## ✨ 1. Perfil Energético',
      '',
      'Seu nome tem uma energia firme. Essa vibração é incompatível com a anterior. Você ganha clareza.',
      '',
      'Outro parágrafo limpo.',
    ].join('\n');
    const limpo = removerFrasesProibidas(texto);
    assert.equal(encontrarCopyProibida(limpo).length, 0);
    assert.match(limpo, /## ✨ 1\. Perfil Energético/);
    assert.match(limpo, /Seu nome tem uma energia firme\. Você ganha clareza\./);
    assert.match(limpo, /Outro parágrafo limpo\./);
  });

  it('parágrafo inteiro proibido vira linha vazia, sem derrubar o texto', () => {
    const limpo = removerFrasesProibidas('Antes.\n\nUse radiestesia.\n\nDepois.');
    assert.equal(encontrarCopyProibida(limpo).length, 0);
    assert.match(limpo, /Antes\./);
    assert.match(limpo, /Depois\./);
  });
});

describe('DEV-304 · nomes que a IA apresenta', () => {
  const resposta = [
    '### ✨ Nome: Ana Silva',
    'Por que este nome é magnético: …',
    '### 🔮 Nome: **Aná Lima**',
    '### 🌟 Nome: [Ana Líma]',
  ].join('\n');

  it('extrai os nomes dos títulos "Nome:", sem emoji, negrito ou colchetes', () => {
    assert.deepEqual(extrairNomesSugeridos(resposta), ['Ana Silva', 'Aná Lima', 'Ana Líma']);
  });

  it('aceita só nomes da lista oferecida, com os mesmos acentos', () => {
    const ok = validarNomesSugeridos(resposta, ['Ana Silva', 'Aná Lima', 'Ana Líma']);
    assert.equal(ok.ok, true);
    assert.equal(ok.apresentados, 3);
  });

  it('recusa nome inventado ou com acento trocado (o acento muda a nota)', () => {
    const inventado = validarNomesSugeridos(resposta, ['Ana Silva', 'Aná Lima']);
    assert.equal(inventado.ok, false);
    assert.deepEqual(inventado.invalidos, ['Ana Líma']);

    const acentoTrocado = validarNomesSugeridos('### ✨ Nome: Ana Lima', ['Aná Lima']);
    assert.equal(acentoTrocado.ok, false);
  });

  it('maiúsculas e espaços extras não contam como nome novo', () => {
    assert.equal(validarNomesSugeridos('### ✨ Nome:   ana   SILVA ', ['Ana Silva']).ok, true);
  });

  it('texto sem nenhum título "Nome:" apresenta 0 nomes', () => {
    const r = validarNomesSugeridos('Só prosa, sem títulos.', ['Ana Silva']);
    assert.equal(r.apresentados, 0);
    assert.equal(r.ok, true);
  });
});

describe('DEV-304 · candidatas que podem ir para a IA', () => {
  const candidatas = [
    { nome: 'Ana Silva', score: 90, temBloqueio: false },
    { nome: 'Ana Lima', score: 95, temBloqueio: true },
    { nome: 'Aná Lima', score: 69, temBloqueio: false },
    { nome: 'Anã Lima', score: 71, temBloqueio: false },
    { nome: 'Ana Souza', score: 60, temBloqueio: false },
  ];

  it('nascimento 50: valem as sem bloqueio com nota 70 ou mais', () => {
    assert.deepEqual(
      filtrarCandidatasOfertaveis(candidatas, 50).map((c) => c.nome),
      ['Ana Silva', 'Anã Lima'],
    );
  });

  it('nascimento 90: só acima do nascimento, nunca igual', () => {
    assert.deepEqual(filtrarCandidatasOfertaveis(candidatas, 90), []);
    assert.deepEqual(
      filtrarCandidatasOfertaveis(candidatas, 89).map((c) => c.nome),
      ['Ana Silva'],
    );
  });
});
