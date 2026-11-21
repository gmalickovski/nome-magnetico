import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatDataPt, gerarJanelaDatas, parseDataPt, JANELA_MAXIMA_DIAS } from './janela.ts';
import { aderenciaEstilo, estilosValidos, poolPorSexo } from './pool.ts';
import { gerarNomesBebe, ordensDeSobrenomes, quantidadePorGrupo, FRACAO_MINIMA_DIAS_BONS } from './index.ts';
import { avaliarCandidatoLivre, candidatoOfertavel } from '../shared/avaliar-candidato.ts';

/** DEV-326 · motor do caminho do bebê. Sem rede e sem IA. */

const base = { sobrenomes: ['Silva', 'Santos'], data: '15/03/2027', modoData: 'janela' as const, sexo: 'menina' as const };

describe('DEV-326 · janela de datas', () => {
  it('29 dias em volta da data prevista, incluindo a própria', () => {
    const j = gerarJanelaDatas('15/03/2027')!;
    assert.equal(j.datas.length, 29);
    assert.equal(j.datas[14], '15/03/2027');
    assert.equal(j.datas[0], '01/03/2027');
    assert.equal(j.datas.at(-1), '29/03/2027');
  });

  it('atravessa mês e ano e respeita ano bissexto', () => {
    const j = gerarJanelaDatas('05/01/2028', 7, 7)!;
    assert.equal(j.datas[0], '29/12/2027');
    assert.equal(j.datas.at(-1), '12/01/2028');
    assert.ok(gerarJanelaDatas('29/02/2028', 1, 1)!.datas.includes('29/02/2028'));
  });

  it('limita a janela e rejeita data inválida', () => {
    assert.equal(gerarJanelaDatas('15/03/2027', 99, 99)!.datas.length, JANELA_MAXIMA_DIAS * 2 + 1);
    assert.equal(gerarJanelaDatas('31/02/2027'), null);
    assert.equal(gerarJanelaDatas('2027-03-15'), null);
    assert.equal(parseDataPt('29/02/2027'), null);
    assert.equal(formatDataPt(parseDataPt('01/02/2027')!), '01/02/2027');
  });
});

describe('DEV-326 · banco de nomes', () => {
  it('"ainda não sei" traz menina, menino e neutros', () => {
    const g = new Set(poolPorSexo('indefinido').map((p) => p.grupo));
    assert.deepEqual([...g].sort(), ['menina', 'menino', 'neutro']);
    assert.ok(poolPorSexo('menina').every((p) => p.grupo !== 'menino'));
    assert.ok(poolPorSexo('menino').every((p) => p.grupo !== 'menina'));
  });

  it('estilos inválidos são ignorados e a aderência conta as etiquetas', () => {
    assert.deepEqual(estilosValidos(['classico', 'xxx', 'curto']), ['classico', 'curto']);
    assert.equal(aderenciaEstilo({ estilos: ['classico', 'curto'] }, ['curto', 'biblico']), 1);
    assert.equal(aderenciaEstilo({ estilos: ['classico'] }, []), 0);
  });

  it('não há nomes de duas palavras', () => {
    for (const sexo of ['menina', 'menino', 'indefinido'] as const) {
      assert.ok(poolPorSexo(sexo).every((p) => !p.nome.includes(' ')), `${sexo}: nome com espaço`);
    }
  });
});

describe('DEV-326 · ordem dos sobrenomes', () => {
  it('permuta até 3 sobrenomes e mantém a ordem informada acima disso', () => {
    assert.equal(ordensDeSobrenomes(['A']).length, 1);
    assert.equal(ordensDeSobrenomes(['A', 'B']).length, 2);
    assert.equal(ordensDeSobrenomes(['A', 'B', 'C']).length, 6);
    assert.deepEqual(ordensDeSobrenomes(['A', 'B', 'C', 'D']), [['A', 'B', 'C', 'D']]);
  });
});

describe('DEV-326 · motor completo', () => {
  it('menina: sugestões válidas, por grupo, com dias bons na janela', () => {
    const r = gerarNomesBebe(base);
    assert.equal(r.janela?.dias, 29);
    assert.equal(r.semSugestoes, false);
    assert.equal(r.motivoSemSugestoes, null);
    const q = quantidadePorGrupo('menina');
    assert.ok(r.sugestoes.filter((s) => s.grupo === 'menina').length <= q.menina);
    assert.ok(r.sugestoes.every((s) => s.grupo !== 'menino'));
    for (const s of r.sugestoes) {
      assert.equal(s.temBloqueio, false, `${s.nomeCompleto} tem bloqueio`);
      assert.notEqual(s.compatibilidade, 'desfavoravel');
      assert.ok(s.score >= 70);
      assert.equal(s.diasTotal, 29);
      assert.ok(s.diasBons / s.diasTotal >= FRACAO_MINIMA_DIAS_BONS, `${s.nomeCompleto} poucos dias bons`);
      assert.match(s.explicacao, /dias possíveis para o nascimento/);
      assert.ok(candidatoOfertavel(avaliarCandidatoLivre(s.nomeCompleto, '15/03/2027')));
    }
  });

  it('sugestões ordenadas por dias bons (maior primeiro) dentro do grupo', () => {
    const r = gerarNomesBebe(base);
    const meninas = r.sugestoes.filter((s) => s.grupo === 'menina').map((s) => s.diasBons);
    assert.deepEqual(meninas, [...meninas].sort((a, b) => b - a));
  });

  it('data exata: uma data só, sem texto de dias', () => {
    const r = gerarNomesBebe({ ...base, modoData: 'exata', sobrenomes: ['Santos'] });
    assert.equal(r.janela, null);
    assert.ok(r.sugestoes.length > 0);
    assert.ok(r.sugestoes.every((s) => s.diasTotal === 1 && s.explicacao === ''));
  });

  it('"ainda não sei" traz as três listas', () => {
    const r = gerarNomesBebe({ ...base, sexo: 'indefinido', sobrenomes: ['Santos'], modoData: 'exata' });
    const grupos = new Set(r.sugestoes.map((s) => s.grupo));
    assert.ok(grupos.has('menina') && grupos.has('menino') && grupos.has('neutro'), [...grupos].join());
  });

  it('nomes dos pais: analisados sempre, com etiqueta, limite de 5 e inválidos ignorados', () => {
    const r = gerarNomesBebe({ ...base, nomesPais: ['Cecilia', 'Thor', 'cecilia', 'R2D2', 'A', 'Zeca', 'Bia', 'Nina', 'Lia'] });
    assert.ok(r.seusNomes.length > 0 && r.seusNomes.length <= 5);
    assert.ok(r.seusNomes.every((s) => s.secao === 'seus_nomes' && s.grupo === 'seu'));
    assert.equal(r.seusNomes.filter((s) => /^cecilia/i.test(s.nomeCompleto)).length, 1, 'duplicado');
    assert.ok(r.nomesPaisIgnorados.includes('R2D2'));
    const fraco = r.seusNomes.find((s) => !candidatoOfertavel(s));
    if (fraco) assert.match(fraco.explicacao, /pede atenção/);
  });

  it('um nome dos pais não repete nas sugestões', () => {
    const r = gerarNomesBebe({ ...base, nomesPais: ['Sofia'] });
    assert.ok(!r.sugestoes.some((s) => s.primeiroNome === 'Sofia'));
  });

  it('excluir e evitar tiram nomes; estilo traz nomes que combinam', () => {
    const a = gerarNomesBebe(base);
    const vistos = a.sugestoes.map((s) => s.primeiroNome);
    const b = gerarNomesBebe({ ...base, excluir: vistos, evitar: ['Helena'] });
    assert.ok(b.sugestoes.every((s) => !vistos.includes(s.primeiroNome) && s.primeiroNome !== 'Helena'));
    const c = gerarNomesBebe({ ...base, estilos: ['biblico'], sobrenomes: ['Santos'], modoData: 'exata' });
    const pool = poolPorSexo('menina');
    const biblicos = c.sugestoes.filter(
      (s) => aderenciaEstilo(pool.find((p) => p.nome === s.primeiroNome) ?? { estilos: [] }, ['biblico']) > 0,
    );
    assert.ok(biblicos.length >= Math.ceil(c.sugestoes.length / 2));
  });

  it('data inválida não quebra', () => {
    const r = gerarNomesBebe({ ...base, data: '31/02/2027' });
    assert.equal(r.semSugestoes, true);
    assert.equal(r.motivoSemSugestoes, 'data_invalida');
  });

  it('sobrenome que bloqueia todos os nomes explica o motivo', () => {
    const r = gerarNomesBebe({ ...base, sobrenomes: ['Malickovski'], modoData: 'exata', sexo: 'indefinido' });
    assert.equal(r.semSugestoes, true);
    assert.equal(r.motivoSemSugestoes, 'sobrenomes_bloqueiam');
  });

  it('é determinístico', () => {
    const a = gerarNomesBebe(base);
    const b = gerarNomesBebe(base);
    assert.deepEqual(a.sugestoes.map((s) => s.nomeCompleto), b.sugestoes.map((s) => s.nomeCompleto));
  });
});
