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

  it('6 sugestões permanecem 6 (sem unshift de assinatura_atual)', () => {
    const ordem = [
      'Ana Vale Silva',
      'Ana V. Silva',
      'Ana Silva Vale',
      'Maria Ana Vale',
      'Ana M. Silva',
      'Ana Silva Santos',
    ];
    const res = analisarNomesSocial(ordem, birth, date, {
      somenteCandidatosInformados: true,
      assinaturaAtual: 'Assinatura Diferente Hoje',
    });
    assert.equal(res.nomesCandidatos.length, 6);
    assert.deepEqual(
      res.nomesCandidatos.map((c) => c.nomeCompleto),
      ordem,
    );
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
