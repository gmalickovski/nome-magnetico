import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  gerarCandidatosComNivel,
  gerarCorteNoMeio,
  analisarNomesSocial,
  analisarNomeSocial,
  etapaDoNivel,
} from './nome-social.ts';


describe('DEV-186 · Gerador em 3 Etapas e Regras v3', () => {
  let prevVersion: string | undefined;

  before(() => {
    prevVersion = process.env.SCORE_VERSION;
    process.env.SCORE_VERSION = 'v3';
  });

  after(() => {
    if (prevVersion === undefined) delete process.env.SCORE_VERSION;
    else process.env.SCORE_VERSION = prevVersion;
  });

  it('corte no meio gera "Guilher" para "Guilherme"', () => {
    const corte = gerarCorteNoMeio('Guilherme');
    assert.equal(corte, 'Guilher');

    const candidatos = gerarCandidatosComNivel('Guilherme Malickovski Correa');
    const nomes = candidatos.map(c => c.nome);
    assert.ok(nomes.includes('Guilher'), 'Deve conter "Guilher" como variante de corte no meio');
    assert.ok(nomes.includes('Guilher Correa'), 'Deve conter "Guilher Correa"');
  });

  it('classificação correta das 3 etapas pelos níveis', () => {
    // Etapa 1: encurtar sem acento (<= 25)
    assert.equal(etapaDoNivel(10), 1);
    assert.equal(etapaDoNivel(20), 1);
    assert.equal(etapaDoNivel(25), 1);

    // Etapa 2: acento sutil (50 a 80)
    assert.equal(etapaDoNivel(50), 2);
    assert.equal(etapaDoNivel(60), 2);
    assert.equal(etapaDoNivel(65), 2);
    assert.equal(etapaDoNivel(70), 2);
    assert.equal(etapaDoNivel(80), 2);

    // Etapa 3: último recurso (>= 90)
    assert.equal(etapaDoNivel(90), 3);
    assert.equal(etapaDoNivel(100), 3);
    assert.equal(etapaDoNivel(110), 3);
    assert.equal(etapaDoNivel(120), 3);
  });

  it('só o primeiro nome subiu para a Etapa 1', () => {
    const candidatos = gerarCandidatosComNivel('Guilherme Malickovski Correa');
    const primeiroNome = candidatos.find(c => c.nome === 'Guilherme');
    assert.ok(primeiroNome, 'Deve conter "Guilherme"');
    assert.equal(etapaDoNivel(primeiroNome!.nivel), 1, 'Primeiro nome deve estar na Etapa 1');
    assert.equal(primeiroNome!.nivel, 25);
  });

  it('forma curta com acento (2a) vem antes de nome completo com 2 acentos (2c)', () => {
    const candidatos = gerarCandidatosComNivel('Guilherme Malickovski Correa');
    const acentoCurto = candidatos.find(c => c.nome === 'Guilherme Málickovski');
    assert.ok(acentoCurto, 'Deve conter "Guilherme Málickovski"');
    assert.ok([50, 60].includes(acentoCurto!.nivel), 'Fase 50 ou 60 (2a)');
    assert.equal(etapaDoNivel(acentoCurto!.nivel), 2);
  });


  describe('Golden do Growth (16/10)', () => {
    it('Guilherme Malickovski Correa · 14/02/1990: melhor na etapa 2a é "Guilherme Málickovski" 95 N5', () => {
      const res = analisarNomesSocial([], 'Guilherme Malickovski Correa', '14/02/1990');
      assert.ok(res.melhorNome);
      assert.equal(res.melhorNome!.nomeCompleto, 'Guilherme Málickovski');
      assert.equal(res.melhorNome!.score, 95);
      assert.equal(res.melhorNome!.etapa, 2);

      // Na etapa 1, o melhor disponível entre todas as opções de corte é Guilherme Correa (score 77, N4)
      const candEtapa1 = gerarCandidatosComNivel('Guilherme Malickovski Correa')
        .filter(c => etapaDoNivel(c.nivel) === 1)
        .map(c => analisarNomeSocial(c.nome, '14/02/1990'));
      candEtapa1.sort((a, b) => b.score - a.score);
      const melhorEtapa1 = candEtapa1[0];
      assert.ok(melhorEtapa1);
      assert.equal(melhorEtapa1!.nomeCompleto, 'Guilherme Correa');
      assert.equal(melhorEtapa1!.score, 77);
    });


    it('Juliana Martins Rocha · 18/03/1992: melhor na etapa 1 é "Juliana Rocha" 93 N5 (sem acento)', () => {
      const res = analisarNomesSocial([], 'Juliana Martins Rocha', '18/03/1992');
      assert.ok(res.melhorNome);
      assert.equal(res.melhorNome!.nomeCompleto, 'Juliana Rocha');
      assert.equal(res.melhorNome!.score, 93);
      assert.equal(res.melhorNome!.etapa, 1);
    });

    it('Lucas Henrique Barbosa · 27/04/1991: melhor na etapa 2 é "Lucas Hénrique" 96 N5', () => {
      const res = analisarNomesSocial([], 'Lucas Henrique Barbosa', '27/04/1991');
      assert.ok(res.melhorNome);
      assert.equal(res.melhorNome!.nomeCompleto, 'Lucas Hénrique');
      assert.equal(res.melhorNome!.score, 96);
      assert.equal(res.melhorNome!.etapa, 2);
    });

    it('Ana Paula Ferreira Lima · 23/07/1988: melhor na etapa 2 é "Ana Paula Férreira" 95 N5', () => {
      const res = analisarNomesSocial([], 'Ana Paula Ferreira Lima', '23/07/1988');
      assert.ok(res.melhorNome);
      assert.equal(res.melhorNome!.nomeCompleto, 'Ana Paula Férreira');
      assert.equal(res.melhorNome!.score, 95);
      assert.equal(res.melhorNome!.etapa, 2);
    });
  });

  describe('Top 3 Diverso e Explicação', () => {
    it('o Top 3 tem sugestões distintas com explicação preenchida', () => {
      const res = analisarNomesSocial([], 'Guilherme Malickovski Correa', '14/02/1990');
      assert.equal(res.top3.length, 3);

      for (const item of res.top3) {
        assert.ok(item.explicacao, `Sugestão ${item.nomeCompleto} deve ter explicacao`);
        assert.ok(item.tipoOpcao, `Sugestão ${item.nomeCompleto} deve ter tipoOpcao`);
        assert.ok(
          item.explicacao!.includes('documentos não mudam') || item.explicacao!.includes('assinatura'),
          'Deve conter orientação sobre assinatura ou documentos'
        );
      }

      // Tipos diversos no Top 3
      const tipos = res.top3.map(t => t.tipoOpcao);
      assert.ok(tipos.includes('mudanca_minima') || tipos.includes('encurtado'));

      // Etapa 3 (duplicações / último recurso) NÃO deve estar no Top 3 nem nas sugestões quando Etapas 1 e 2 resolvem
      for (const item of res.top3) {
        assert.notEqual(item.etapa, 3, `Sugestão ${item.nomeCompleto} não deve ser da Etapa 3 quando Etapas 1 e 2 já têm opções viáveis`);
      }
      for (const item of res.nomesCandidatos) {
        assert.notEqual(item.etapa, 3, `Candidato ${item.nomeCompleto} não deve ser da Etapa 3`);
      }
    });
  });
});
