import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { analisarNomesSocial, type AnaliseNomeSocial } from './products/nome-social.ts';

/**
 * DEV-317 · "Gerar mais" segue a lista já montada: a 1ª rodada traz os selos (Principal e Maior nota)
 * e as próximas rodadas trazem as seguintes, na mesma ordem, sem selo novo.
 */
let prev: string | undefined;
before(() => {
  prev = process.env.SCORE_VERSION;
  process.env.SCORE_VERSION = 'v3';
});
after(() => {
  if (prev === undefined) delete process.env.SCORE_VERSION;
  else process.env.SCORE_VERSION = prev;
});

const visiveis = (r: ReturnType<typeof analisarNomesSocial>): AnaliseNomeSocial[] =>
  [r.melhorNome, ...r.top3].filter((c): c is AnaliseNomeSocial => Boolean(c)).slice(0, 3);

describe('DEV-317 · Gerar mais', () => {
  for (const [nasc, data] of [
    ['Cláudia Delanni Vitória', '31/05/1991'],
    ['Luciana Souza Lima', '12/03/1985'],
  ] as const) {
    it(`${nasc}: 3 rodadas seguem a lista inicial, sem repetir e sem selo novo`, () => {
      const lista = analisarNomesSocial([], nasc, data).nomesCandidatos.map((c) => c.nomeCompleto);
      const vistos: string[] = [];
      for (let rodada = 0; rodada < 3; rodada++) {
        const r = analisarNomesSocial([], nasc, data, { nomesExcluidos: [...vistos] });
        const vis = visiveis(r);
        assert.deepEqual(
          vis.map((c) => c.nomeCompleto),
          lista.slice(rodada * 3, rodada * 3 + 3),
          `rodada ${rodada + 1}`,
        );
        for (const c of vis) {
          assert.equal(c.temBloqueio, false);
          if (rodada > 0) assert.ok(!c.principal && !c.maiorNota, `${c.nomeCompleto} ganhou selo na rodada ${rodada + 1}`);
          assert.ok(!vistos.includes(c.nomeCompleto), `${c.nomeCompleto} repetido`);
        }
        vistos.push(...vis.map((c) => c.nomeCompleto));
      }
    });
  }

  it('Cláudia: a 1ª opção tem os dois selos e não tem bloqueio', () => {
    const r = analisarNomesSocial([], 'Cláudia Delanni Vitória', '31/05/1991');
    assert.equal(r.melhorNome?.nomeCompleto, 'Claudia Delanni Vitoria');
    assert.equal(r.melhorNome?.principal, true);
    assert.equal(r.melhorNome?.maiorNota, true);
  });
});
