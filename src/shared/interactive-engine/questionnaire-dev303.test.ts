import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEV303_NEW_STEPS,
  DEV320_STEPS,
  QUESTIONNAIRE_STEP_ORDER,
  getQuestionSpec,
  inferAreaFocoFromText,
  isQuestionnaireStepSkipped,
  sanitizeOutroText,
  type QuestionnaireStepId,
} from './questionnaire-adaptive.ts';
import { determineNextStep, questionnaireStepsRemaining, type RouterState } from './router.ts';
import { evaluateDeterministically } from './providers/jev-provider.ts';
import {
  mapAberturaToEstilo,
  profileToRankingOpcoes,
  resolvePrioridadeConflito,
  type QuestionnaireProfile,
} from './questionnaire-map.ts';

/**
 * DEV-303 · roteiro adaptativo (pula o que já está inferido), perguntas novas e
 * mapeamento para o ranking. Sem rede.
 */

const CTX = { nomeCompleto: 'Ana Silva Santos', sobrenomes: ['Silva', 'Santos'] };

const base: RouterState = {
  nomeCompleto: 'Ana Silva Santos',
  dataNascimento: '01/01/1990',
};

/** Responde cada pergunta feita pelo roteador e devolve a lista de perguntas na ordem. */
function percorrer(respostas: {
  relacaoNome: string;
  ondeAssinaRaw?: string[];
  aberturaMudanca?: string;
  preferencias?: boolean;
  prioridade?: string;
}): QuestionnaireStepId[] {
  const state: RouterState = {
    ...base,
    ondeAssinaRaw: respostas.ondeAssinaRaw ?? [],
  };
  const feitas: QuestionnaireStepId[] = [];
  for (let guarda = 0; guarda < 20; guarda++) {
    const { nextStep } = determineNextStep(state);
    if (nextStep === 'palpite' || nextStep === 'fim_coleta') break;
    feitas.push(nextStep as QuestionnaireStepId);
    switch (nextStep) {
      case 'nome_uso':
        state.nomeUsoDefinido = true;
        break;
      case 'sobrenomes_uso':
        state.sobrenomesDecididos = true;
        break;
      case 'relacao_nome':
        state.relacaoNome = respostas.relacaoNome;
        break;
      case 'onde_assina':
        state.ondeAssinaDecidido = true;
        break;
      case 'estilo_presenca':
        state.estiloPresencaDecidido = true;
        break;
      case 'area_foco':
        state.areaFoco = 'carreira_negocios';
        break;
      case 'subfoco':
        state.subfocoDecidido = true;
        break;
      case 'abertura_mudanca':
        state.aberturaMudanca = respostas.aberturaMudanca ?? 'acento_ou_letra';
        break;
      case 'preferencias_assinatura':
        state.preferenciasDecididas = true;
        break;
      case 'prioridade_conflito':
        state.prioridadeConflito = respostas.prioridade ?? 'nota_mais_alta';
        break;
    }
  }
  return feitas;
}

describe('DEV-303 · roteiro com no máximo 10 passos', () => {
  // DEV-320: sem o fluxo com motivo ligado, os passos novos da DEV-320 não aparecem.
  const ROTEIRO_DEV303 = QUESTIONNAIRE_STEP_ORDER.filter((s) => !DEV320_STEPS.includes(s));

  it('a ordem tem 10 passos e os 2 novos vêm por último', () => {
    assert.equal(ROTEIRO_DEV303.length, 10);
    assert.deepEqual(ROTEIRO_DEV303.slice(-2), ['preferencias_assinatura', 'prioridade_conflito']);
    assert.deepEqual([...DEV303_NEW_STEPS], ['preferencias_assinatura', 'prioridade_conflito']);
  });

  it('caminho comum: 10 perguntas', () => {
    const feitas = percorrer({ relacaoNome: 'gosto_muito' });
    assert.deepEqual(feitas, [...ROTEIRO_DEV303]);
    assert.ok(feitas.length <= 10);
  });

  it('"Não me representa" pula a abertura para mudar', () => {
    const feitas = percorrer({ relacaoNome: 'nao_representa' });
    assert.ok(!feitas.includes('abertura_mudanca'));
    assert.equal(feitas.length, 9);
  });

  it('"Quase nada" pula a prioridade (já é mudar o mínimo)', () => {
    const feitas = percorrer({ relacaoNome: 'gosto_muito', aberturaMudanca: 'quase_nada' });
    assert.ok(!feitas.includes('prioridade_conflito'));
    assert.equal(feitas.length, 9);
  });

  it('contratos e documentos pulam a prioridade (restrição legal)', () => {
    const feitas = percorrer({ relacaoNome: 'gosto_muito', ondeAssinaRaw: ['contratos_documentos'] });
    assert.ok(!feitas.includes('prioridade_conflito'));
  });

  it('"Não me representa" + contratos pula as duas perguntas', () => {
    const feitas = percorrer({ relacaoNome: 'nao_representa', ondeAssinaRaw: ['contratos_documentos'] });
    assert.ok(!feitas.includes('abertura_mudanca'));
    assert.ok(!feitas.includes('prioridade_conflito'));
    assert.equal(feitas.length, 8);
  });

  it('o contador de passos restantes ignora o que foi pulado', () => {
    const completoMenosUltimos: RouterState = {
      ...base,
      nomeUsoDefinido: true,
      sobrenomesDecididos: true,
      relacaoNome: 'nao_representa',
      ondeAssinaDecidido: true,
      estiloPresencaDecidido: true,
      areaFoco: 'carreira_negocios',
      subfocoDecidido: true,
    };
    // faltam preferências, prioridade e palpite (a abertura foi pulada)
    assert.equal(questionnaireStepsRemaining(completoMenosUltimos), 3);
    assert.equal(determineNextStep(completoMenosUltimos).nextStep, 'preferencias_assinatura');
  });

  it('isQuestionnaireStepSkipped só pula o que está implícito', () => {
    assert.equal(isQuestionnaireStepSkipped('abertura_mudanca', { relacaoNome: 'nao_representa' }), true);
    assert.equal(isQuestionnaireStepSkipped('abertura_mudanca', { relacaoNome: 'gosto_muito' }), false);
    assert.equal(isQuestionnaireStepSkipped('prioridade_conflito', { aberturaMudanca: 'quase_nada' }), true);
    assert.equal(isQuestionnaireStepSkipped('prioridade_conflito', { aberturaMudanca: 'o_que_fizer_sentido' }), false);
    assert.equal(isQuestionnaireStepSkipped('prioridade_conflito', { ondeAssinaRaw: ['redes_sociais'] }), false);
    assert.equal(isQuestionnaireStepSkipped('area_foco', { relacaoNome: 'nao_representa' }), false);
  });
});

describe('DEV-303 · perguntas novas', () => {
  it('preferências: até 2 escolhas, 1 toque, com "Tanto faz"', () => {
    const spec = getQuestionSpec('preferencias_assinatura', { ...CTX, areaFoco: null });
    assert.equal(spec.mode, 'multi');
    assert.equal(spec.maxSelect, 2);
    assert.equal(spec.minSelect, 1);
    assert.deepEqual(
      (spec.staticOptions ?? []).map((o) => o.id),
      ['manter_primeiro_nome', 'sem_acento', 'tanto_faz'],
    );
  });

  it('prioridade: uma escolha entre nota mais alta e mudar o mínimo', () => {
    const spec = getQuestionSpec('prioridade_conflito', { ...CTX, areaFoco: null });
    assert.equal(spec.mode, 'single');
    assert.deepEqual(
      (spec.staticOptions ?? []).map((o) => o.id),
      ['nota_mais_alta', 'mudar_o_minimo'],
    );
  });

  it('área de foco aceita "Outro foco" com texto de até 60 caracteres', () => {
    const spec = getQuestionSpec('area_foco', { ...CTX, areaFoco: null });
    assert.equal(spec.allowOther, true);
    assert.equal(spec.otherMaxLength, 60);
    assert.ok((spec.staticOptions ?? []).some((o) => o.id === 'area_outro' && o.id.endsWith('_outro')));
  });

  it('textos sem acento de controle, marcação ou excesso de tamanho', () => {
    assert.equal(sanitizeOutroText('  quero  <b>crescer</b>\u0000 no\ttrabalho  '), 'quero b crescer /b no trabalho');
    assert.equal(sanitizeOutroText('x'.repeat(200)).length, 60);
    assert.equal(sanitizeOutroText('a`{}[]\\b'), 'a b');
    assert.equal(sanitizeOutroText('   '), '');
  });

  it('inferAreaFocoFromText acha a área por palavras-chave, igual ao determinístico do JEV', () => {
    const casos: Array<[string, string | null]> = [
      ['quero organizar minhas dívidas e ganhar mais', 'prosperidade_financeira'],
      ['paz na minha família e no casamento', 'relacionamentos_harmonia'],
      ['mais confiança para falar em público', 'autoestima_expressao'],
      ['fechar contrato com cliente e vender mais', 'carreira_negocios'],
      ['nada em especial', null],
      ['', null],
    ];
    for (const [texto, esperado] of casos) {
      assert.equal(inferAreaFocoFromText(texto), esperado, texto);
      if (esperado) {
        const det = evaluateDeterministically({
          nome_completo: 'Ana Silva',
          numero_destino: 3,
          nota_hoje: 60,
          potencial: 80,
          bloqueios_triangulos: [],
          relato_consulente: texto,
        });
        assert.equal(det.areaFoco, esperado, `determinístico: ${texto}`);
      }
    }
  });
});

describe('DEV-303 · respostas viram preferência mole do ranking', () => {
  const perfil: QuestionnaireProfile = {
    nomeUsoBase: null,
    sobrenomesObrigatorios: [],
    sobrenomesExcluidos: [],
    relacaoNome: 'gosto_muito',
    ondeAssinaRaw: [],
    estiloPresenca: [],
    areaFoco: null,
    subfocosOrdenados: [],
    aberturaMudanca: 'acento_ou_letra',
    nomeArtistico: null,
    contextoLeituraOutros: [],
  };

  it('manter primeiro nome e prefiro sem acento chegam ao motor', () => {
    const o = profileToRankingOpcoes({ ...perfil, preferenciasAssinatura: ['manter_primeiro_nome', 'sem_acento'] });
    assert.equal(o.manterPrimeiroNome, true);
    assert.equal(o.acentoNaAssinatura, 'prefere_sem');
  });

  it('"Tanto faz" e sem resposta não ativam nada', () => {
    assert.equal(profileToRankingOpcoes({ ...perfil, preferenciasAssinatura: ['tanto_faz'] }).manterPrimeiroNome, undefined);
    assert.equal(profileToRankingOpcoes({ ...perfil, preferenciasAssinatura: ['tanto_faz'] }).acentoNaAssinatura, undefined);
    assert.equal(profileToRankingOpcoes(perfil).manterPrimeiroNome, undefined);
  });

  it('prioridade explícita e inferida', () => {
    assert.equal(profileToRankingOpcoes({ ...perfil, prioridadeConflito: 'nota_mais_alta' }).prioridadeConflito, 'nota');
    assert.equal(profileToRankingOpcoes({ ...perfil, prioridadeConflito: 'mudar_o_minimo' }).prioridadeConflito, 'mudanca');
    assert.equal(resolvePrioridadeConflito({ ...perfil, aberturaMudanca: 'quase_nada' }, false), 'mudanca');
    assert.equal(resolvePrioridadeConflito({ ...perfil, ondeAssinaRaw: ['contratos_documentos'] }, true), 'mudanca');
    assert.equal(resolvePrioridadeConflito(perfil, false), undefined);
  });

  it('nome artístico prioriza o curto, mas respeita "quase nada" e contratos', () => {
    assert.equal(mapAberturaToEstilo(null, 'gosto_muito', 'Aninha Art'), 'curto_direto');
    assert.equal(mapAberturaToEstilo('quase_nada', 'gosto_muito', 'Aninha Art'), 'ajuste_sutil');
    assert.equal(mapAberturaToEstilo('tirar_trocar_sobrenome', 'gosto_muito', 'Aninha Art'), 'sobrenome_forte');
    assert.equal(mapAberturaToEstilo('o_que_fizer_sentido', 'gosto_muito', null), 'qualquer');

    const artistico = profileToRankingOpcoes({ ...perfil, aberturaMudanca: null, nomeArtistico: 'Aninha Art' });
    assert.equal(artistico.estiloPreferido, 'curto_direto');
    assert.equal(artistico.aceitaEncurtarOuApelido, true);

    const minimo = profileToRankingOpcoes({ ...perfil, aberturaMudanca: 'quase_nada', nomeArtistico: 'Aninha Art' });
    assert.equal(minimo.aceitaEncurtarOuApelido, false);

    const legal = profileToRankingOpcoes({
      ...perfil,
      aberturaMudanca: null,
      ondeAssinaRaw: ['contratos_documentos'],
      nomeArtistico: 'Aninha Art',
    });
    assert.equal(legal.aceitaEncurtarOuApelido, false);
    assert.equal(legal.restricaoDocumentosLegais, true);
  });
});
