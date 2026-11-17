import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyQuestionnaireStep,
  buildNextQuestion,
  buildRegenerateRequestBody,
  mapCandidate,
  buildSobrenomePillOptions,
  INITIAL_COLLECT_STATE,
  mapDecideLiveResponse,
  mapRegenerateApiToCandidates,
} from './decide-live-bridge.js';

describe('buildNextQuestion · sobrenomes_uso', () => {
  it('labels só conteúdo, sem verbo Manter', () => {
    const pills = buildSobrenomePillOptions(['Malickovski', 'Correa']);
    assert.deepEqual(
      pills.map((p) => p.label),
      ['Malickovski', 'Correa']
    );
  });

  it('questionário nome_uso inclui options', () => {
    const q = buildNextQuestion(
      {
        next_step: 'nome_uso',
        remaining: 8,
        promptSugestao: 'Como as pessoas te chamam no dia a dia?',
      },
      'Guilherme Malickovski Correa',
      INITIAL_COLLECT_STATE,
      ['Malickovski', 'Correa']
    );
    assert.equal(q?.id, 'nome_uso');
    assert.equal(q?.tipo, 'questionnaire');
    assert.ok(q?.options?.some((o) => o.label === 'Guilherme'));
    assert.ok(q?.options?.some((o) => o.label === 'Outro jeito'));
  });

  it('múltipla escolha preserva ordem dos toques em subfoco', () => {
    const next = applyQuestionnaireStep(
      { ...INITIAL_COLLECT_STATE, areaFoco: 'carreira_negocios' },
      'subfoco',
      {
        optionIds: ['lideranca_promocao', 'foco_execucao'],
        labels: ['Buscando reconhecimento', 'Quero crescer onde estou'],
      }
    );
    assert.deepEqual(next.subfocosOrdenados, ['lideranca_promocao', 'foco_execucao']);
  });
});

describe('DEV-301 · maior nota visível e estado vazio no chat', () => {
  const item = (nomeCompleto: string, score: number, maiorNota = false) => ({
    nomeCompleto,
    score,
    maiorNota,
    expressao: 3,
    bloqueios: [],
  });

  it('mapRegenerateApiToCandidates mantém a maior nota dentro do corte de 3', () => {
    const out = mapRegenerateApiToCandidates(
      {
        melhorNome: item('Ana A', 80),
        top3: [item('Ana B', 78), item('Ana C', 79), item('Ana D', 95, true)],
      },
      3,
    );
    assert.equal(out.length, 3);
    assert.ok(out.some((c) => c.nome === 'Ana D' && c.maiorNota === true));
  });

  it('mapDecideLiveResponse repassa semOpcoesElegiveis e a nota mínima', () => {
    const mapped = mapDecideLiveResponse({
      next_step: 'fim_coleta',
      remaining: 0,
      previewTop3: [],
      semOpcoesElegiveis: true,
      scoreNascimento: 91,
      scoreMinimoSugestao: 92,
    } as never);
    assert.equal(mapped.semOpcoesElegiveis, true);
    assert.equal(mapped.scoreMinimoSugestao, 92);
    assert.equal(mapped.scoreNascimento, 91);
  });
});

describe('DEV-302 · perfil da entrevista no chat', () => {
  it('mapCandidate mostra "por que este nome para você" em destaque', () => {
    const c = mapCandidate({
      nomeCompleto: 'Ana Silva',
      score: 90,
      expressao: 8,
      bloqueios: [],
      explicacaoPerfil: 'Expressão 8 combina com o seu foco em dinheiro e prosperidade.',
    });
    assert.equal(c.destaque, 'Expressão 8 combina com o seu foco em dinheiro e prosperidade.');
    assert.equal(mapCandidate({ nomeCompleto: 'Ana Silva', score: 90, bloqueios: [] }).destaque, undefined);
  });

  it('o pedido de "gerar mais" reenvia as afinidades do perfil', () => {
    const body = buildRegenerateRequestBody({
      nomeNascimento: 'Ana Silva Santos',
      dataNascimento: '01/01/1990',
      nomesExcluidos: [],
      collect: {
        ...INITIAL_COLLECT_STATE,
        areaFoco: 'carreira_negocios',
        estiloPresenca: ['firme_confiavel'],
        subfocosOrdenados: ['lideranca_promocao'],
      },
    });
    const ranking = body.rankingChat as { afinidades?: { area?: string; estilo?: string[]; subfocos?: string[] } };
    assert.deepEqual(ranking.afinidades, {
      estilo: ['firme_confiavel'],
      area: 'carreira_negocios',
      subfocos: ['lideranca_promocao'],
    });
  });
});
