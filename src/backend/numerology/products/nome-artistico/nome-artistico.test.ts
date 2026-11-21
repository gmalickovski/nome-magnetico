import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gerarNomesArtisticos } from './index.ts';
import { apelidosDe, gerarCandidatosProximos, grafiasArtisticas, separarNome } from './proximos.ts';
import { filtrarIdeiasNovas, gerarCandidatosNovosDeterministicos } from './novos.ts';
import { afinidadeExpressaoArea, explicarAfinidade } from './afinidade-area.ts';
import { avaliarCandidatoLivre, candidatoOfertavel } from '../shared/avaliar-candidato.ts';
import { extrairNomesJson } from '../../../ai/brain.ts';

/** DEV-321 · motor do nome artístico. Sem rede e sem IA. */

const NASC = 'Larissa de Macedo Machado';
const DATA = '30/03/1993';

describe('DEV-321 · nomes próximos', () => {
  it('apelidos terminam em vogal e unem Lari e Lary', () => {
    assert.ok(apelidosDe('Larissa').includes('Lari'));
    assert.ok(!apelidosDe('Guilherme').includes('Guil'));
    assert.ok(apelidosDe('Guilherme').includes('Gui'));
  });

  it('grafia artística muda a forma sem trocar a pessoa', () => {
    assert.ok(grafiasArtisticas('Gustavo').some((g) => g.toLowerCase().startsWith('gus') && g.toLowerCase().includes('tt')));
    assert.ok(grafiasArtisticas('Caio').includes('Kaio'));
  });

  it('respeita sobrenomes excluídos e não repete o nome de nascimento', () => {
    const lista = gerarCandidatosProximos('Guilherme Malickovski Correa', { sobrenomesExcluidos: ['Correa'] });
    assert.ok(lista.every((c) => !/correa/i.test(c.nome)));
    assert.ok(lista.every((c) => c.nome.toLowerCase() !== 'guilherme malickovski correa'));
  });

  it('manter primeiro nome tira o sobrenome sozinho', () => {
    const lista = gerarCandidatosProximos('Guilherme Malickovski Correa', { manterPrimeiroNome: true });
    assert.ok(!lista.some((c) => c.tecnica === 'sobrenome'));
  });
});

describe('DEV-321 · nomes novos', () => {
  it('filtra ideias: só letras, até 3 palavras, sem partes do nascimento e sem repetir', () => {
    const r = filtrarIdeiasNovas(
      ['Aurora Luz', 'aurora luz', 'Larissa Show', 'Nome 123', 'A B C D', 'Kai', ''],
      separarNome(NASC),
    );
    assert.deepEqual(r, ['Aurora Luz', 'Kai']);
  });

  it('banco determinístico respeita o tom e a imagem', () => {
    const fem = gerarCandidatosNovosDeterministicos({ generoPersona: 'feminino', imagemArtistica: ['misteriosa'] });
    assert.ok(fem.includes('Aurora Noir'));
    assert.ok(!fem.includes('Thor'));
    const masc = gerarCandidatosNovosDeterministicos({ generoPersona: 'masculino' });
    assert.ok(masc.includes('Theo'));
    assert.ok(!masc.includes('Aurora'));
  });

  it('extrairNomesJson lê JSON dentro de cerca de código e ignora lixo', () => {
    assert.deepEqual(extrairNomesJson('```json\n{"nomes":["Kai","Luz Rios"]}\n```'), ['Kai', 'Luz Rios']);
    assert.deepEqual(extrairNomesJson('sem json'), []);
    assert.deepEqual(extrairNomesJson('{"nomes": "x"}'), []);
  });
});

describe('DEV-321 · afinidade número × área', () => {
  it('Expressão 3 favorece cantor mais que escritor; números ausentes valem neutro', () => {
    assert.ok(afinidadeExpressaoArea(3, 'cantor') > afinidadeExpressaoArea(3, 'escritor'));
    assert.equal(afinidadeExpressaoArea(2, 'cantor'), 0.3);
  });

  it('a explicação não traz dígitos nem travessão', () => {
    const t = explicarAfinidade(3, 'cantor', 'cantor ou cantora');
    assert.match(t, /palco/);
    assert.doesNotMatch(t, /[\d—–]/);
  });
});

describe('DEV-321 · motor completo', () => {
  const perfil = { areaArtistica: 'cantor', generoPersona: 'feminino', imagemArtistica: ['popular'], tipoNomeArtistico: 'ambos' };

  it('"ambos" entrega até 3 próximos e até 3 novos, todos válidos', () => {
    const r = gerarNomesArtisticos({ nomeNascimento: NASC, dataNascimento: DATA, perfil });
    assert.ok(r.proximos.length > 0 && r.proximos.length <= 3);
    assert.equal(r.novos.length, 3);
    for (const s of [...r.proximos, ...r.novos]) {
      assert.equal(s.temBloqueio, false, `${s.nomeCompleto} tem bloqueio`);
      assert.notEqual(s.compatibilidade, 'desfavoravel');
      assert.ok(s.score >= 70, `${s.nomeCompleto} abaixo de 70`);
      assert.ok(candidatoOfertavel(avaliarCandidatoLivre(s.nomeCompleto, DATA)));
    }
    assert.ok(r.proximos.every((s) => s.secao === 'proximo'));
    assert.ok(r.novos.every((s) => s.secao === 'novo'));
  });

  it('novos não usam o nome de nascimento e não repetem a primeira palavra', () => {
    const r = gerarNomesArtisticos({ nomeNascimento: NASC, dataNascimento: DATA, perfil });
    const primeiras = r.novos.map((s) => s.nomeCompleto.split(' ')[0]!.toLowerCase());
    assert.equal(new Set(primeiras).size, primeiras.length);
    assert.ok(r.novos.every((s) => !/larissa|macedo|machado/i.test(s.nomeCompleto)));
  });

  it('"proximo" só traz próximos; "diferente" só traz novos', () => {
    const p = gerarNomesArtisticos({ nomeNascimento: NASC, dataNascimento: DATA, perfil: { ...perfil, tipoNomeArtistico: 'proximo' } });
    assert.equal(p.novos.length, 0);
    assert.equal(p.semNovos, false);
    const d = gerarNomesArtisticos({ nomeNascimento: NASC, dataNascimento: DATA, perfil: { ...perfil, tipoNomeArtistico: 'diferente' } });
    assert.equal(d.proximos.length, 0);
    assert.equal(d.semProximos, false);
    assert.equal(d.novos.length, 3);
  });

  it('ideias da IA entram, são validadas e vêm antes do banco', () => {
    const r = gerarNomesArtisticos({ nomeNascimento: NASC, dataNascimento: DATA, perfil: { ...perfil, tipoNomeArtistico: 'diferente' }, ideiasIA: ['Aurora Fênix', 'Larissa Show'] });
    assert.ok(!r.novos.some((s) => /larissa/i.test(s.nomeCompleto)));
    assert.ok(r.novos.length === 3);
  });

  it('"Gerar outras opções" não repete o que já foi mostrado', () => {
    const a = gerarNomesArtisticos({ nomeNascimento: NASC, dataNascimento: DATA, perfil });
    const vistos = [...a.proximos, ...a.novos].map((s) => s.nomeCompleto);
    const b = gerarNomesArtisticos({ nomeNascimento: NASC, dataNascimento: DATA, perfil, excluir: vistos });
    const novos = [...b.proximos, ...b.novos].map((s) => s.nomeCompleto.toLowerCase());
    assert.ok(novos.every((n) => !vistos.map((v) => v.toLowerCase()).includes(n)));
  });

  it('a mesma entrada dá sempre o mesmo resultado (sem IA)', () => {
    const a = gerarNomesArtisticos({ nomeNascimento: NASC, dataNascimento: DATA, perfil });
    const b = gerarNomesArtisticos({ nomeNascimento: NASC, dataNascimento: DATA, perfil });
    assert.deepEqual(a.novos.map((s) => s.nomeCompleto), b.novos.map((s) => s.nomeCompleto));
  });
});
