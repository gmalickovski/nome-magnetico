import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AVISO_ARTISTICO_CONTRATOS_TEXT,
  getQuestionSpec,
  isQuestionnaireStepSkipped,
  precisaAvisoArtisticoContratos,
  resolveBlockTransition,
  type QuestionnaireStepId,
} from './questionnaire-adaptive.ts';
import { determineNextStep, type RouterState } from './router.ts';
import { buildProfilePalpiteText } from './chat-profile-copy.ts';
import { profileToPerfilChat, profileToRankingOpcoes, type QuestionnaireProfile } from './questionnaire-map.ts';
import {
  INITIAL_COLLECT_STATE,
  applyQuestionnaireStep,
  buildDecideLiveBody,
} from '../../frontend/components/app/chat/decide-live-bridge.ts';
import { getPreviousFlowStep } from '../../frontend/components/app/chat/chat-dock-step-back.ts';

/** DEV-320 · motivo da harmonização, ramo artístico e outros usos. Sem rede. */

const base: RouterState = { nomeCompleto: 'Larissa de Macedo Machado', dataNascimento: '30/03/1993' };

function percorrer(r: { motivo: string; area?: string; fluxo?: boolean }): QuestionnaireStepId[] {
  const s: RouterState = { ...base, fluxoMotivoAtivo: r.fluxo ?? true };
  const feitas: QuestionnaireStepId[] = [];
  for (let guarda = 0; guarda < 30; guarda++) {
    const { nextStep } = determineNextStep(s);
    if (nextStep === 'palpite' || nextStep === 'fim_coleta') break;
    feitas.push(nextStep as QuestionnaireStepId);
    switch (nextStep) {
      case 'motivo_harmonizacao': s.motivoHarmonizacao = r.motivo; break;
      case 'nome_uso': s.nomeUsoDefinido = true; break;
      case 'sobrenomes_uso': s.sobrenomesDecididos = true; break;
      case 'relacao_nome': s.relacaoNome = 'gosto_muito'; break;
      case 'area_artistica': s.areaArtistica = r.area ?? 'cantor'; break;
      case 'detalhe_artistico': s.detalheArtisticoDecidido = true; break;
      case 'genero_persona': s.generoPersona = 'feminino'; break;
      case 'imagem_artistica': s.imagemArtisticaDecidida = true; break;
      case 'tipo_nome_artistico': s.tipoNomeArtistico = 'proximo'; break;
      case 'onde_assina': s.ondeAssinaDecidido = true; break;
      case 'estilo_presenca': s.estiloPresencaDecidido = true; break;
      case 'area_foco': s.areaFoco = 'carreira_negocios'; break;
      case 'subfoco': s.subfocoDecidido = true; break;
      case 'abertura_mudanca': s.aberturaMudanca = 'acento_ou_letra'; break;
      case 'preferencias_assinatura': s.preferenciasDecididas = true; break;
      case 'prioridade_conflito': s.prioridadeConflito = 'nota_mais_alta'; break;
      case 'outros_usos': s.outrosUsosDecididos = true; break;
      default: return feitas;
    }
  }
  return feitas;
}

describe('DEV-320 · roteiro com motivo', () => {
  it('fluxo desligado: roteiro da DEV-303, sem motivo nem outros usos', () => {
    const feitas = percorrer({ motivo: 'artistico', fluxo: false });
    assert.equal(feitas[0], 'nome_uso');
    assert.ok(!feitas.includes('motivo_harmonizacao'));
    assert.ok(!feitas.includes('outros_usos'));
    assert.ok(!feitas.includes('area_artistica'));
    assert.equal(feitas.length, 10);
  });

  it('motivo padrão: roteiro de hoje + motivo no início + outros usos no fim', () => {
    const feitas = percorrer({ motivo: 'dia_a_dia' });
    assert.equal(feitas[0], 'motivo_harmonizacao');
    assert.equal(feitas.at(-1), 'outros_usos');
    assert.equal(feitas.length, 12);
    assert.ok(!feitas.some((s) => s.includes('artistic') || s === 'genero_persona'));
  });

  it('ramo artístico (cantor): perguntas próprias e sem as do roteiro padrão', () => {
    const feitas = percorrer({ motivo: 'artistico', area: 'cantor' });
    assert.deepEqual(feitas, [
      'motivo_harmonizacao',
      'nome_uso',
      'sobrenomes_uso',
      'area_artistica',
      'detalhe_artistico',
      'genero_persona',
      'imagem_artistica',
      'tipo_nome_artistico',
      'preferencias_assinatura',
      'outros_usos',
    ]);
  });

  it('áreas sem detalhe (escrita) pulam a pergunta de detalhe', () => {
    const feitas = percorrer({ motivo: 'artistico', area: 'escritor' });
    assert.ok(!feitas.includes('detalhe_artistico'));
    assert.equal(feitas.length, 9);
  });

  it('a pergunta de detalhe muda conforme a área', () => {
    const cantor = getQuestionSpec('detalhe_artistico', { nomeCompleto: '', sobrenomes: [], areaFoco: null, areaArtistica: 'cantor' });
    const ator = getQuestionSpec('detalhe_artistico', { nomeCompleto: '', sobrenomes: [], areaFoco: null, areaArtistica: 'ator' });
    assert.match(cantor.prompt, /música/);
    assert.ok(cantor.staticOptions?.some((o) => o.id === 'sertanejo'));
    assert.match(ator.prompt, /atua/);
    const decisao = determineNextStep({
      ...base, fluxoMotivoAtivo: true, motivoHarmonizacao: 'artistico', nomeUsoDefinido: true,
      sobrenomesDecididos: true, areaArtistica: 'ator',
    });
    assert.equal(decisao.nextStep, 'detalhe_artistico');
    assert.match(decisao.promptSugestao, /atua/);
  });

  it('isQuestionnaireStepSkipped respeita o fluxo e o ramo', () => {
    assert.equal(isQuestionnaireStepSkipped('motivo_harmonizacao', {}), true);
    assert.equal(isQuestionnaireStepSkipped('motivo_harmonizacao', { fluxoMotivoAtivo: true }), false);
    assert.equal(isQuestionnaireStepSkipped('area_artistica', { fluxoMotivoAtivo: true, motivoHarmonizacao: 'carreira' }), true);
    assert.equal(isQuestionnaireStepSkipped('onde_assina', { fluxoMotivoAtivo: true, motivoHarmonizacao: 'artistico' }), true);
  });
});

describe('DEV-320 · motor e aviso', () => {
  const perfil: QuestionnaireProfile = {
    nomeUsoBase: 'Larissa', sobrenomesObrigatorios: [], sobrenomesExcluidos: [], relacaoNome: null,
    ondeAssinaRaw: ['contratos_documentos'], estiloPresenca: [], areaFoco: null, subfocosOrdenados: [],
    aberturaMudanca: null, nomeArtistico: null, contextoLeituraOutros: [],
    motivoHarmonizacao: 'artistico', areaArtistica: 'cantor', imagemArtistica: ['marcante', 'popular'],
    tipoNomeArtistico: 'ambos', outrosUsos: ['contratos'],
  };

  it('artístico: forma curta, encurtar liberado, sem teto e sem restrição legal', () => {
    const r = profileToRankingOpcoes(perfil);
    assert.equal(r.estiloPreferido, 'curto_direto');
    assert.equal(r.aceitaEncurtarOuApelido, true);
    assert.equal(r.maxNivelGeracao, undefined);
    assert.equal(r.restricaoDocumentosLegais, undefined);
    assert.deepEqual(r.afinidades?.estilo, ['criatividade', 'leve_acolhimento']);
    assert.equal(r.prioridadeConflito, 'nota');
    assert.equal(profileToRankingOpcoes({ ...perfil, tipoNomeArtistico: 'proximo' }).prioridadeConflito, 'mudanca');
  });

  it('motivo padrão não muda o mapeamento de hoje', () => {
    const semMotivo = profileToRankingOpcoes({ ...perfil, motivoHarmonizacao: null });
    const comMotivo = profileToRankingOpcoes({ ...perfil, motivoHarmonizacao: 'dia_a_dia' });
    assert.deepEqual(comMotivo, semMotivo);
    assert.equal(semMotivo.restricaoDocumentosLegais, true);
  });

  it('perfil do chat guardado só quando há motivo', () => {
    assert.equal(profileToPerfilChat({ ...perfil, motivoHarmonizacao: null }), undefined);
    assert.equal(profileToPerfilChat(perfil)?.motivo, 'artistico');
  });

  it('aviso informativo só no ramo artístico com contratos, documentos, marca ou empresa', () => {
    assert.equal(precisaAvisoArtisticoContratos('artistico', ['contratos']), true);
    assert.equal(precisaAvisoArtisticoContratos('artistico', ['redes_sociais']), false);
    assert.equal(precisaAvisoArtisticoContratos('dia_a_dia', ['contratos']), false);
    const t = resolveBlockTransition('outros_usos', 'palpite', 'Larissa', new Set(), { avisoArtisticoContratos: true });
    assert.equal(t?.id, 'aviso_artistico_contratos');
    assert.match(AVISO_ARTISTICO_CONTRATOS_TEXT, /advogado/);
    assert.doesNotMatch(AVISO_ARTISTICO_CONTRATOS_TEXT, /[—–]/);
  });
});

describe('DEV-320 · palpite do ramo artístico', () => {
  it('fala do perfil artístico e não afirma foco de carreira nem canais inferidos', () => {
    const t = buildProfilePalpiteText({
      nomeCompleto: 'Guilherme Malickovski Correa',
      areaFoco: null,
      ondeAssina: ['presenca_digital'],
      sobrenomesObrigatorios: ['Malickovski'],
      artistico: {
        areaArtistica: 'cantor',
        detalheArtistico: ['pop', 'rock'],
        generoPersona: 'neutro',
        imagemArtistica: ['marcante'],
        tipoNomeArtistico: 'ambos',
      },
    });
    assert.match(t, /nome artístico para atuar como cantor ou cantora, no estilo pop e rock/);
    assert.match(t, /imagem marcante/);
    assert.match(t, /neutro ou ambíguo/);
    assert.match(t, /próximo do seu quanto um totalmente diferente/);
    assert.match(t, /manter Malickovski/);
    assert.doesNotMatch(t, /carreira|redes sociais/);
    assert.doesNotMatch(t, /[—–\d]/);
  });

  it('"Outra área" usa o texto livre', () => {
    const t = buildProfilePalpiteText({
      nomeCompleto: 'Ana Silva',
      areaFoco: null,
      artistico: { areaArtistica: 'outra', areaArtisticaOutro: 'mágica' },
    });
    assert.match(t, /atuar como mágica/);
  });
});

describe('DEV-320 · ponte do chat e voltar', () => {
  it('motivo artístico preenche onde assina e forma curta; outros usos trata "Nenhum outro"', () => {
    let c = applyQuestionnaireStep(INITIAL_COLLECT_STATE, 'motivo_harmonizacao', { optionIds: ['artistico'] });
    assert.deepEqual(c.ondeAssinaRaw, ['arte_criativo']);
    assert.equal(c.estiloPreferido, 'curto_direto');
    c = applyQuestionnaireStep(c, 'area_artistica', { optionIds: ['area_artistica_outro'], otherText: 'Mágico <b>' });
    assert.equal(c.areaArtistica, 'outra');
    assert.equal(c.areaArtisticaOutro, 'Mágico b');
    c = applyQuestionnaireStep(c, 'outros_usos', { optionIds: ['nenhum_outro', 'contratos'] });
    assert.deepEqual(c.outrosUsos, ['contratos']);
    const body = buildDecideLiveBody('Larissa de Macedo Machado', '30/03/1993', c);
    assert.equal(body.motivo_harmonizacao, 'artistico');
    assert.deepEqual(body.outros_usos, ['contratos']);
  });

  it('voltar pula o que o ramo artístico não perguntou', () => {
    const state = {
      relacaoNome: null, aberturaMudanca: null, ondeAssinaRaw: ['arte_criativo'],
      fluxoMotivoAtivo: true, motivoHarmonizacao: 'artistico', areaArtistica: 'escritor',
    };
    assert.equal(getPreviousFlowStep('area_artistica', state), 'sobrenomes_uso');
    assert.equal(getPreviousFlowStep('genero_persona', state), 'area_artistica');
    assert.equal(getPreviousFlowStep('outros_usos', state), 'preferencias_assinatura');
    assert.equal(getPreviousFlowStep('nome_uso', state), 'motivo_harmonizacao');
    assert.equal(getPreviousFlowStep('nome_uso', { relacaoNome: null, aberturaMudanca: null, ondeAssinaRaw: [] }), null);
  });
});
