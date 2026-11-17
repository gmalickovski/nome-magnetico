import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyQuestionnaireStep,
  buildNextQuestion,
  buildDecideLiveBody,
  buildRegenerateRequestBody,
  mapCandidate,
  buildSobrenomePillOptions,
  INITIAL_COLLECT_STATE,
  mapDecideLiveResponse,
  mapRegenerateApiToCandidates,
} from './decide-live-bridge.js';
import { getPreviousFlowStep, rewindCollectStateToStep } from './chat-dock-step-back.js';
import {
  CHAT_SESSION_STORAGE_VERSION,
  buildPersistedChatSession,
  clearChatSession,
  loadChatSession,
  saveChatSession,
} from './chat-session-storage.js';

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

describe('DEV-303 · respostas das perguntas novas no chat', () => {
  it('"Outro foco" vira a área mais próxima, com texto limpo e guardado como contexto', () => {
    const next = applyQuestionnaireStep(INITIAL_COLLECT_STATE, 'area_foco', {
      optionIds: ['nome_outro'],
      labels: ['quero organizar as <b>dívidas</b>'],
      otherText: 'quero organizar as <b>dívidas</b>',
    });
    assert.equal(next.areaFoco, 'prosperidade_financeira');
    assert.equal(next.areaFocoOutro, 'quero organizar as b dívidas /b');
    assert.ok(next.contextoLeitura.some((c) => c.startsWith('area_foco:')));
    assert.ok(!next.contextoLeitura.join('').includes('<'));
  });

  it('"Outro foco" sem pista cai em carreira e negócios; escolher uma área limpa o texto livre', () => {
    const outro = applyQuestionnaireStep(INITIAL_COLLECT_STATE, 'area_foco', {
      optionIds: ['area_outro'],
      labels: ['algo diferente'],
      otherText: 'algo diferente',
    });
    assert.equal(outro.areaFoco, 'carreira_negocios');
    const area = applyQuestionnaireStep(outro, 'area_foco', {
      optionIds: ['relacionamentos_harmonia'],
      labels: ['Relacionamentos'],
    });
    assert.equal(area.areaFoco, 'relacionamentos_harmonia');
    assert.equal(area.areaFocoOutro, null);
  });

  it('preferências: "Tanto faz" sozinho vale, junto de outra escolha vale a outra', () => {
    const so = applyQuestionnaireStep(INITIAL_COLLECT_STATE, 'preferencias_assinatura', {
      optionIds: ['tanto_faz'],
      labels: ['Tanto faz'],
    });
    assert.deepEqual(so.preferenciasAssinatura, ['tanto_faz']);
    const junto = applyQuestionnaireStep(INITIAL_COLLECT_STATE, 'preferencias_assinatura', {
      optionIds: ['sem_acento', 'tanto_faz'],
      labels: ['Prefiro sem acento', 'Tanto faz'],
    });
    assert.deepEqual(junto.preferenciasAssinatura, ['sem_acento']);
  });

  it('prioridade em conflito é guardada', () => {
    const next = applyQuestionnaireStep(INITIAL_COLLECT_STATE, 'prioridade_conflito', {
      optionIds: ['nota_mais_alta'],
      labels: ['A nota mais alta'],
    });
    assert.equal(next.prioridadeConflito, 'nota_mais_alta');
  });

  it('"Não me representa" já define o estilo aberto, sem a pergunta de abertura', () => {
    const next = applyQuestionnaireStep(INITIAL_COLLECT_STATE, 'relacao_nome', {
      optionIds: ['nao_representa'],
      labels: ['Não me representa'],
    });
    assert.equal(next.relacaoNome, 'nao_representa');
    assert.equal(next.estiloPreferido, 'qualquer');
    assert.equal(next.aberturaMudanca, null);
  });

  it('o corpo do decide-live leva os campos novos só quando respondidos', () => {
    const vazio = buildDecideLiveBody('Ana Silva', '01/01/1990', INITIAL_COLLECT_STATE);
    assert.equal(vazio.preferencias_assinatura, undefined);
    assert.equal(vazio.prioridade_conflito, undefined);
    assert.equal(vazio.area_foco_outro, undefined);

    const cheio = buildDecideLiveBody('Ana Silva', '01/01/1990', {
      ...INITIAL_COLLECT_STATE,
      preferenciasAssinatura: ['manter_primeiro_nome'],
      prioridadeConflito: 'mudar_o_minimo',
      areaFocoOutro: 'meu projeto',
    });
    assert.deepEqual(cheio.preferencias_assinatura, ['manter_primeiro_nome']);
    assert.equal(cheio.prioridade_conflito, 'mudar_o_minimo');
    assert.equal(cheio.area_foco_outro, 'meu projeto');
  });

  it('"gerar mais" reenvia as preferências novas', () => {
    const body = buildRegenerateRequestBody({
      nomeNascimento: 'Ana Silva Santos',
      dataNascimento: '01/01/1990',
      nomesExcluidos: [],
      collect: {
        ...INITIAL_COLLECT_STATE,
        preferenciasAssinatura: ['manter_primeiro_nome', 'sem_acento'],
        prioridadeConflito: 'nota_mais_alta',
      },
    });
    const ranking = body.rankingChat as Record<string, unknown>;
    assert.equal(ranking.manterPrimeiroNome, true);
    assert.equal(ranking.acentoNaAssinatura, 'prefere_sem');
    assert.equal(ranking.prioridadeConflito, 'nota');
  });
});

describe('DEV-303 · voltar no chat com perguntas puladas', () => {
  it('voltar da preferência não cai na abertura quando ela foi pulada', () => {
    assert.equal(getPreviousFlowStep('preferencias_assinatura'), 'abertura_mudanca');
    assert.equal(
      getPreviousFlowStep('preferencias_assinatura', {
        relacaoNome: 'nao_representa',
        aberturaMudanca: null,
        ondeAssinaRaw: [],
      }),
      'subfoco',
    );
  });

  it('voltar do palpite não cai na prioridade quando ela foi pulada', () => {
    assert.equal(getPreviousFlowStep('palpite'), 'prioridade_conflito');
    assert.equal(
      getPreviousFlowStep('palpite', { relacaoNome: 'gosto_muito', aberturaMudanca: 'quase_nada', ondeAssinaRaw: [] }),
      'preferencias_assinatura',
    );
    assert.equal(
      getPreviousFlowStep('fim_coleta', {
        relacaoNome: 'gosto_muito',
        aberturaMudanca: 'acento_ou_letra',
        ondeAssinaRaw: [],
      }),
      'palpite',
    );
  });

  it('refazer um passo limpa as respostas novas', () => {
    const cheio = {
      ...INITIAL_COLLECT_STATE,
      preferenciasAssinatura: ['sem_acento'],
      prioridadeConflito: 'nota_mais_alta',
      areaFoco: 'carreira_negocios',
      areaFocoOutro: 'meu projeto',
    };
    const voltou = rewindCollectStateToStep(cheio, 'area_foco');
    assert.equal(voltou.areaFocoOutro, null);
    assert.equal(voltou.areaFoco, null);
    assert.deepEqual(voltou.preferenciasAssinatura, []);
    assert.equal(voltou.prioridadeConflito, null);
  });
});

describe('DEV-303 · sessão salva antes dos passos novos', () => {
  it('ganha os campos novos com valor inicial ao reabrir', () => {
    const memoria = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (k: string) => memoria.get(k) ?? null,
        setItem: (k: string, v: string) => memoria.set(k, v),
        removeItem: (k: string) => memoria.delete(k),
        clear: () => memoria.clear(),
        key: () => null,
        length: 0,
      },
      configurable: true,
    });
    const usuario = 'dev303-user';
    clearChatSession(usuario);
    saveChatSession(
      usuario,
      buildPersistedChatSession({
        messages: [{ id: 'm1', sender: 'assistant', type: 'text', content: 'ok' }],
        answers: {},
        confirmedName: 'Ana Silva Santos',
        confirmedDate: '01/01/1990',
        draftNome: '',
        draftDate: '',
        draftGender: '',
        stepIndex: 3,
        currentStepId: 'relacao_nome',
        remaining: 5,
        birthConfirmed: true,
        collectState: INITIAL_COLLECT_STATE,
        sobrenomesDetectados: [],
        radarAxes: null,
        summaryItems: [],
        basePanel: null,
        activeSuggestionId: null,
        suggestions: [],
        analysisId: null,
        chatPhase: 'subscriber',
      } as never),
    );
    const chave = [...memoria.keys()][0]!;
    const salvo = JSON.parse(memoria.get(chave)!);
    delete salvo.collectState.preferenciasAssinatura;
    delete salvo.collectState.prioridadeConflito;
    delete salvo.collectState.areaFocoOutro;
    salvo.collectState.areaFoco = 'carreira_negocios';
    memoria.set(chave, JSON.stringify(salvo));

    const carregada = loadChatSession(usuario);
    assert.ok(carregada);
    assert.equal(carregada!.version, CHAT_SESSION_STORAGE_VERSION);
    assert.deepEqual(carregada!.collectState.preferenciasAssinatura, []);
    assert.equal(carregada!.collectState.prioridadeConflito, null);
    assert.equal(carregada!.collectState.areaFocoOutro, null);
    assert.equal(carregada!.collectState.areaFoco, 'carreira_negocios');
    clearChatSession(usuario);
  });
});
