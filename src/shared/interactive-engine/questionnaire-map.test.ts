import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildBirthNamePanel } from '../../backend/numerology/birth-name-panel.ts';
import { analisarNomesSocial } from '../../backend/numerology/products/nome-social.ts';
import {
  applySobrenomesUsoSelection,
  mapAberturaToEstilo,
  maxNivelGeracaoPorAbertura,
  profileToRankingOpcoes,
  restricaoDocumentosLegais,
} from './questionnaire-map.ts';

describe('questionnaire-map · filtros do gerador (sem score)', () => {
  it('sobrenomes_uso: selecionados obrigatórios, demais excluídos', () => {
    const { obrigatorios, excluidos } = applySobrenomesUsoSelection(
      ['Malickovski'],
      ['Malickovski', 'Correa']
    );
    assert.deepEqual(obrigatorios, ['Malickovski']);
    assert.deepEqual(excluidos, ['Correa']);
  });

  it('abertura quase_nada limita maxNivelGeracao a 50', () => {
    assert.equal(maxNivelGeracaoPorAbertura('quase_nada', null, false), 50);
    assert.equal(mapAberturaToEstilo('quase_nada', null), 'ajuste_sutil');
  });

  it('contratos/documentos ativa restricaoDocumentosLegais', () => {
    assert.equal(restricaoDocumentosLegais(['contratos_documentos']), true);
    const opcoes = profileToRankingOpcoes({
      nomeUsoBase: 'Guilherme',
      sobrenomesObrigatorios: ['Malickovski'],
      sobrenomesExcluidos: [],
      relacaoNome: null,
      ondeAssinaRaw: ['contratos_documentos'],
      estiloPresenca: [],
      areaFoco: 'carreira_negocios',
      subfocosOrdenados: [],
      aberturaMudanca: 'o_que_fizer_sentido',
      nomeArtistico: null,
      contextoLeituraOutros: [],
    });
    assert.equal(opcoes.restricaoDocumentosLegais, true);
    assert.equal(opcoes.maxNivelGeracao, 85);
  });

  it('Guilherme · score de nascimento permanece 64', () => {
    const panel = buildBirthNamePanel('Guilherme Malickovski Correa', '14/02/1990');
    assert.equal(panel.score, 64);
    const opcoes = profileToRankingOpcoes({
      nomeUsoBase: 'Guilherme',
      sobrenomesObrigatorios: ['Malickovski', 'Correa'],
      sobrenomesExcluidos: [],
      relacaoNome: 'gosto_muito',
      ondeAssinaRaw: ['email_cartao'],
      estiloPresenca: ['firme_confiavel'],
      areaFoco: 'carreira_negocios',
      subfocosOrdenados: ['lideranca_promocao'],
      aberturaMudanca: 'acento_ou_letra',
      nomeArtistico: null,
      contextoLeituraOutros: [],
    });
    const res = analisarNomesSocial([], 'Guilherme Malickovski Correa', '14/02/1990', opcoes);
    assert.equal(panel.score, 64);
    assert.ok(res.melhorNome);
  });
});

import { selecionouSoPrimeiroNome } from './questionnaire-map.ts';
import { buildSobrenomesUsoOptions } from './questionnaire-adaptive.ts';
import { it as itSolo } from 'node:test';
import assertSolo from 'node:assert/strict';

itSolo('DEV-304 · opção "Só o primeiro nome" existe e só vale sem sobrenomes marcados', () => {
  const opts = buildSobrenomesUsoOptions(['Dias', 'Nunes']);
  assertSolo.equal(opts[opts.length - 1]!.id, 'sob_nenhum');
  assertSolo.equal(selecionouSoPrimeiroNome(['Só o primeiro nome'], ['Dias', 'Nunes']), true);
  assertSolo.equal(selecionouSoPrimeiroNome(['Só o primeiro nome', 'Dias'], ['Dias', 'Nunes']), false);
  assertSolo.equal(selecionouSoPrimeiroNome(['Dias'], ['Dias', 'Nunes']), false);
});
