import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcularValor, extrairLetras, reduzirNumero } from './core';
import {
  calcularExpressao,
  calcularDestino,
  calcularMotivacao,
  calcularImpressao,
  calcularMissao,
} from './numbers';
import {
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  calcularDebitosCarmicos,
} from './karmic';
import { avaliarCompatibilidade, TABELA_HARMONIZACAO, harmonizarNome } from './harmonization';
import { gerarNomesMagneticos } from './suggestions';

describe('DEV-260: Regras de Numerologia do Curso', () => {
  it('tabela de conversão: X vale 6, Å soma +7, D\'Angelo soma 30', () => {
    assert.equal(calcularValor('X'), 6, 'X deve valer 6');
    assert.equal(calcularValor('x'), 6, 'x deve valer 6');
    assert.equal(calcularValor('Å'), 8, 'Å deve somar 1 (A) + 7 (anel) = 8');
    assert.equal(calcularValor('Ç'), 6, 'Ç deve valer 6');

    // D'Angelo soma 30: D'(4+2=6) + A(1) + n(5) + g(3) + e(5) + l(3) + o(7) = 30
    const letrasDAngelo = extrairLetras("D'Angelo");
    const somaDAngelo = letrasDAngelo.reduce((acc, l) => acc + calcularValor(l), 0);
    assert.equal(somaDAngelo, 30, "D'Angelo deve somar 30");

    // Também com apóstrofo tipográfico ’
    const letrasDAngeloCurly = extrairLetras('D’Angelo');
    const somaDAngeloCurly = letrasDAngeloCurly.reduce((acc, l) => acc + calcularValor(l), 0);
    assert.equal(somaDAngeloCurly, 30, 'D’Angelo (curvo) deve somar 30');
  });

  it('casos do curso: Maria Rocha, Fábio Costa, Adriana Gomes, Ana Elias', () => {
    assert.equal(calcularMotivacao('Maria Rocha'), 11, 'Maria Rocha → Motivação 11');
    assert.equal(calcularImpressao('Fábio Costa'), 2, 'Fábio Costa → Impressão 2');
    assert.equal(calcularImpressao('Adriana Gomes'), 3, 'Adriana Gomes → Impressão 3');
    assert.equal(calcularImpressao('Ana Elias'), 2, 'Ana Elias → Impressão 2');
  });

  it('casos do curso: Antônio Araújo → soma 57, Expressão 3, Motivação 4, Impressão 8', () => {
    const letras = extrairLetras('Antônio Araújo');
    const soma = letras.reduce((acc, l) => acc + calcularValor(l), 0);
    assert.equal(soma, 57, 'Antônio Araújo soma 57');
    assert.equal(calcularExpressao('Antônio Araújo'), 3, 'Antônio Araújo → Expressão 3');
    assert.equal(calcularMotivacao('Antônio Araújo'), 4, 'Antônio Araújo → Motivação 4');
    assert.equal(calcularImpressao('Antônio Araújo'), 8, 'Antônio Araújo → Impressão 8');
  });

  it('casos do curso: Maria Araújo e Júlia Serafim → Expressão 11, Maria Bonifacio → Motivação 11', () => {
    assert.equal(calcularExpressao('Maria Araújo'), 11, 'Maria Araújo → Expressão 11');
    assert.equal(calcularExpressao('Júlia Serafim'), 11, 'Júlia Serafim → Expressão 11');
    assert.equal(calcularMotivacao('Maria Bonifacio'), 11, 'Maria Bonifacio → Motivação 11');
  });

  it('casos do curso: Destinos com regra 2/4 e sem 2/4', () => {
    assert.equal(calcularDestino('21/10/1962'), 22, '21/10/1962 → Destino 22');
    assert.equal(calcularDestino('29/02/1971'), 22, '29/02/1971 → Destino 22 (recalculado por partes 11+2+9=22)');
    assert.equal(calcularDestino('01/08/1948'), 4, '01/08/1948 → Destino 4 (recalculado por partes 1+8+22=31->4)');
    assert.equal(calcularDestino('01/05/1970'), 5, '01/05/1970 → Destino 5');
  });

  it('casos do curso: Marcos Pereira Rodrigues, 30/01/1980', () => {
    const nome = 'Marcos Pereira Rodrigues';
    const data = '30/01/1980';
    assert.equal(calcularExpressao(nome), 5, 'Expressão 5');
    assert.equal(calcularDestino(data), 22, 'Destino 22');
    assert.equal(calcularMissao(nome, data), 9, 'Missão 9 (Destino 22 + Expressão 5 = 27 -> 9)');

    const licoes = detectarLicoesCarmicas(nome);
    const numsLicoes = licoes.map(l => l.numero);
    assert.ok(numsLicoes.includes(9), 'Deve incluir Lição Kármica 9');
  });

  it('casos do curso: Ana Lúcia Coelho, 15/06/1971', () => {
    const nome = 'Ana Lúcia Coelho';
    const data = '15/06/1971';
    assert.equal(calcularMissao(nome, data), 11, 'Missão 11 (Destino 3 + Expressão 8 = 11)');

    const licoes = detectarLicoesCarmicas(nome);
    const numsLicoes = licoes.map(l => l.numero).sort((a, b) => a - b);
    assert.deepEqual(numsLicoes, [2, 4, 6, 9], 'Lições Kármicas: 2, 4, 6, 9');
  });

  it('casos do curso: dívidas cármicas de João Alves Ferreira e Maria Alice dos Santos', () => {
    // João Alves Ferreira, 14/01/1969 → dívidas 13 e 14
    const dJoao = calcularDestino('14/01/1969');
    const mJoao = calcularMotivacao('João Alves Ferreira');
    const eJoao = calcularExpressao('João Alves Ferreira');
    const debitosJoao = calcularDebitosCarmicos('14/01/1969', dJoao, mJoao, eJoao);
    const numsJoao = debitosJoao.map(d => d.numero).sort((a, b) => a - b);
    assert.deepEqual(numsJoao, [13, 14], 'João Alves Ferreira → dívidas 13 e 14');

    // Maria Alice dos Santos, 16/02/1952 → dívidas 16 (acentuada) e 14
    const dMaria = calcularDestino('16/02/1952');
    const mMaria = calcularMotivacao('Maria Alice dos Santos');
    const eMaria = calcularExpressao('Maria Alice dos Santos');
    const debitosMaria = calcularDebitosCarmicos('16/02/1952', dMaria, mMaria, eMaria);
    const numsMaria = debitosMaria.map(d => d.numero).sort((a, b) => a - b);
    assert.deepEqual(numsMaria, [14, 16], 'Maria Alice dos Santos → dívidas 14 e 16');

    const deb16 = debitosMaria.find(d => d.numero === 16);
    assert.ok(deb16?.acentuada, 'Dívida 16 deve ser acentuada');
  });

  it('casos do curso: tendências ocultas de Antônio Fragoso e Jaqueline Martins', () => {
    const tendFragoso = detectarTendenciasOcultas('Antônio Fragoso');
    assert.equal(tendFragoso.length, 0, 'Antônio Fragoso → sem tendências ocultas');

    const tendJaqueline = detectarTendenciasOcultas('Jaqueline Martins');
    const numsJaqueline = tendJaqueline.map(t => t.numero).sort((a, b) => a - b);
    assert.deepEqual(numsJaqueline, [1, 5], 'Jaqueline Martins → tendências 1 e 5');
  });

  it('casos do curso: assinaturas do PDF', () => {
    assert.equal(calcularExpressao('Roberto Sales'), 8, 'Roberto Sales → Expressão 8');
    assert.equal(calcularExpressao('Ana Julia C Rizzi'), 22, 'Ana Julia C Rizzi → Expressão 22 (regra 2/4)');
    assert.equal(calcularExpressao('Júlia Rizzi'), 5, 'Júlia Rizzi → Expressão 5');
  });

  it('extras do curso: 22 não gera dívida 13; dia 13 + Destino 4 gera 13 acentuada; Destino 5 sem neutros; min 2 sugestões', () => {
    // Destino/Expressão 22 não gera dívida 13
    const debDestino22 = calcularDebitosCarmicos('21/10/1962', 22, 3, 5);
    const tem13Com22 = debDestino22.some(d => d.numero === 13);
    assert.equal(tem13Com22, false, 'Destino 22 não gera dívida 13');

    // dia 13 + Destino 4 → dívida 13 acentuada
    const debAcentuada = calcularDebitosCarmicos('13/05/1976', 4, 3, 3);
    const deb13 = debAcentuada.find(d => d.numero === 13);
    assert.ok(deb13?.acentuada, 'dia 13 + Destino 4 → dívida 13 acentuada');

    // harmonização Destino 5 não tem neutros
    assert.deepEqual(TABELA_HARMONIZACAO[5].neutro, [], 'Destino 5 não possui números neutros');
    assert.equal(avaliarCompatibilidade(11, 5), 'desfavoravel', 'Expressão 11 com Destino 5 é desfavorável');

    // Mínimo 2 opções
    const harm = harmonizarNome('João Silva', '10/10/1985', 2);
    assert.ok(harm.sugestoes.length >= 2, 'harmonizarNome devolve no mínimo 2 opções');

    const mags = gerarNomesMagneticos('João Silva', 6, 7, 'Masculino', '10/10/1985', 2);
    assert.ok(mags.length >= 2, 'gerarNomesMagneticos devolve no mínimo 2 opções');
  });
});
