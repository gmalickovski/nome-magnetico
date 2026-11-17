import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { analisarNomesSocial } from './products/nome-social.ts';

describe('ranking somente chat — lista exata', () => {
  let prevVersion: string | undefined;

  before(() => {
    prevVersion = process.env.SCORE_VERSION;
    process.env.SCORE_VERSION = 'v3';
  });

  after(() => {
    if (prevVersion === undefined) delete process.env.SCORE_VERSION;
    else process.env.SCORE_VERSION = prevVersion;
  });

  const birth = 'Maria Silva Santos';
  const date = '01/01/1990';

  it('ordem preservada e sem unshift de assinatura_atual (R1/R2 aplicados)', () => {
    const ordem = [
      'Maria Santos',
      'Maria',
      'Mãria Santos',
      'Mariã Santos',
      'Maria Santôs',
      'Maria Sãntos',
    ];
    const res = analisarNomesSocial(ordem, birth, date, {
      somenteCandidatosInformados: true,
      assinaturaAtual: 'Assinatura Diferente Hoje',
    });
    // DEV-301: o chat preserva a ordem recebida e não injeta assinatura_atual;
    // só o que passa em R1/R2 é oferecido, o resto vai para `comparacao`.
    const ofertados = res.nomesCandidatos.map((c) => c.nomeCompleto);
    const comparacao = (res.comparacao ?? []).map((c) => c.nomeCompleto);
    assert.deepEqual(ofertados, ordem.filter((n) => ofertados.includes(n)));
    assert.deepEqual([...ofertados, ...comparacao].sort(), [...ordem].sort());
    assert.ok(!ofertados.includes('Assinatura Diferente Hoje'));
    for (const c of res.nomesCandidatos) {
      assert.equal(c.temBloqueio, false);
      assert.ok(c.score >= (res.scoreMinimoSugestao ?? 70));
    }
  });

  it('histórico vazio permanece 0 (sem baseline de assinatura_atual)', () => {
    const res = analisarNomesSocial([], birth, date, {
      somenteCandidatosInformados: true,
      assinaturaAtual: 'Assinatura Diferente Hoje',
    });
    assert.equal(res.nomesCandidatos.length, 0);
    assert.equal(res.melhorNome, null);
  });
});
