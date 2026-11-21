import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BEBE_STEPS,
  dataPtValida,
  labelCampoDataBebe,
  mascararDataPt,
  parseNomesPais,
  parseSobrenomesBebe,
  resumoDadosBebe,
  avisoBebePorSituacao,
  AVISO_BEBE_REGISTRADO_TEXT,
  AVISO_BEBE_SEM_REGISTRO_TEXT,
} from './ramos/bebe.ts';
import {
  getQuestionSpec,
  isQuestionnaireStepSkipped,
  resolveBlockTransition,
  detectShownBlockTransitions,
  type QuestionnaireStepId,
} from './questionnaire-adaptive.ts';
import { determineNextStep, questionnaireStepsRemaining, type RouterState } from './router.ts';
import {
  INITIAL_COLLECT_STATE,
  applyBebeDados,
  applyQuestionnaireStep,
  buildDecideLiveBody,
} from '../../frontend/components/app/chat/decide-live-bridge.ts';
import { getPreviousFlowStep, rewindCollectStateToStep } from '../../frontend/components/app/chat/chat-dock-step-back.ts';
import {
  babyNamesNotice,
  buildBabyNamesBody,
  dividirPorGrupoBebe,
  mapBabyNamesToCandidates,
  temSecoesBebe,
} from '../../frontend/components/app/chat/baby-suggestions-client.ts';

/** DEV-326 · caminho do bebê no chat: roteiro, formulário e ponte. Sem rede. */

const base: RouterState = { nomeCompleto: 'Ana Paula Souza', dataNascimento: '01/01/1990', fluxoMotivoAtivo: true };

/** Percorre o roteador respondendo cada pergunta e devolve a ordem das perguntas. */
function percorrerBebe(situacao: string, dataTipo?: string): QuestionnaireStepId[] {
  const s: RouterState = { ...base };
  const feitas: QuestionnaireStepId[] = [];
  for (let guarda = 0; guarda < 20; guarda++) {
    const { nextStep } = determineNextStep(s);
    if (nextStep === 'fim_coleta') break;
    if (nextStep === 'palpite') throw new Error('o caminho do bebê não deve passar pelo palpite');
    feitas.push(nextStep as QuestionnaireStepId);
    switch (nextStep) {
      case 'motivo_harmonizacao': s.motivoHarmonizacao = 'bebe'; break;
      case 'bebe_situacao': s.bebeSituacao = situacao; break;
      case 'bebe_data_tipo': s.bebeDataTipo = dataTipo ?? 'prevista'; break;
      case 'bebe_sexo': s.bebeSexo = 'menina'; break;
      case 'bebe_dados': s.bebeDadosDecididos = true; break;
      case 'bebe_estilo': s.bebeEstiloDecidido = true; break;
      default: throw new Error(`pergunta inesperada no caminho do bebê: ${nextStep}`);
    }
  }
  return feitas;
}

describe('DEV-326 · roteiro do bebê', () => {
  it('ainda não nasceu: situação, tipo de data, sexo, dados e estilo; sem palpite', () => {
    assert.deepEqual(percorrerBebe('nao_nasceu', 'prevista'), [
      'motivo_harmonizacao', 'bebe_situacao', 'bebe_data_tipo', 'bebe_sexo', 'bebe_dados', 'bebe_estilo',
    ]);
  });

  it('já nasceu e foi registrado: só situação e dados (o nome já foi escolhido)', () => {
    assert.deepEqual(percorrerBebe('nasceu_registrado'), ['motivo_harmonizacao', 'bebe_situacao', 'bebe_dados']);
  });

  it('já nasceu, sem registro: não pergunta tipo de data, mas escolhe sexo e estilo', () => {
    assert.deepEqual(percorrerBebe('nasceu_sem_registro'), [
      'motivo_harmonizacao', 'bebe_situacao', 'bebe_sexo', 'bebe_dados', 'bebe_estilo',
    ]);
  });

  it('o contador de passos do bebê não conta o palpite', () => {
    const s: RouterState = { ...base, motivoHarmonizacao: 'bebe', bebeSituacao: 'nasceu_registrado', bebeDadosDecididos: true };
    assert.equal(questionnaireStepsRemaining(s), 0);
    assert.equal(determineNextStep(s).nextStep, 'fim_coleta');
  });

  it('fora do bebê, nada muda: os passos do bebê são pulados e o palpite continua', () => {
    for (const passo of BEBE_STEPS) {
      assert.equal(isQuestionnaireStepSkipped(passo, { fluxoMotivoAtivo: true, motivoHarmonizacao: 'dia_a_dia' }), true, passo);
      assert.equal(isQuestionnaireStepSkipped(passo, { fluxoMotivoAtivo: false, motivoHarmonizacao: 'bebe' }), true, `${passo} sem o fluxo`);
    }
    assert.equal(isQuestionnaireStepSkipped('nome_uso', { fluxoMotivoAtivo: true, motivoHarmonizacao: 'bebe' }), true);
    assert.equal(isQuestionnaireStepSkipped('outros_usos', { fluxoMotivoAtivo: true, motivoHarmonizacao: 'bebe' }), true);
    const pessoal: RouterState = { ...base, motivoHarmonizacao: 'dia_a_dia', nomeUsoDefinido: true };
    assert.notEqual(determineNextStep(pessoal).nextStep, 'fim_coleta');
  });

  it('a pergunta de motivo oferece o bebê e os textos dos passos existem', () => {
    const motivo = getQuestionSpec('motivo_harmonizacao', { nomeCompleto: '', sobrenomes: [], areaFoco: null });
    assert.ok(motivo.staticOptions?.some((o) => o.id === 'bebe'));
    assert.equal(motivo.prompt, 'Para quem ou para quê é esse nome?');
    for (const passo of BEBE_STEPS) {
      const spec = getQuestionSpec(passo, { nomeCompleto: '', sobrenomes: [], areaFoco: null });
      assert.ok(spec.prompt.length > 3, passo);
    }
    assert.equal(getQuestionSpec('bebe_estilo', { nomeCompleto: '', sobrenomes: [], areaFoco: null }).maxSelect, 2);
    assert.deepEqual(getQuestionSpec('bebe_dados', { nomeCompleto: '', sobrenomes: [], areaFoco: null }).staticOptions, []);
  });

  it('textos do bebê sem travessão e sem jargão', () => {
    const textos = [AVISO_BEBE_REGISTRADO_TEXT, AVISO_BEBE_SEM_REGISTRO_TEXT, labelCampoDataBebe('nao_nasceu', 'prevista')];
    for (const t of textos) assert.doesNotMatch(t, /[—–]|score|ranking/i);
    assert.doesNotMatch(AVISO_BEBE_SEM_REGISTRO_TEXT + AVISO_BEBE_REGISTRADO_TEXT, /\d/, 'sem prazo em número enquanto não confirmado');
    assert.match(AVISO_BEBE_SEM_REGISTRO_TEXT, /advogado/);
  });
});

describe('DEV-326 · formulário do bebê', () => {
  it('máscara e validação da data', () => {
    assert.equal(mascararDataPt('12052027'), '12/05/2027');
    assert.equal(mascararDataPt('1205'), '12/05');
    assert.equal(mascararDataPt('12/05/2027x'), '12/05/2027');
    assert.equal(dataPtValida('12/05/2027'), true);
    assert.equal(dataPtValida('31/02/2027'), false);
    assert.equal(dataPtValida('2027-05-12'), false);
  });

  it('rótulo da data muda conforme a situação', () => {
    assert.match(labelCampoDataBebe('nao_nasceu', 'marcada'), /marcada/);
    assert.match(labelCampoDataBebe('nao_nasceu', 'prevista'), /prevista/);
    assert.match(labelCampoDataBebe('nasceu_sem_registro', null), /nascimento do bebê/);
  });

  it('sobrenomes: vírgula separa (aceita "de Souza"); sem vírgula, cada palavra', () => {
    assert.deepEqual(parseSobrenomesBebe('Silva, de Souza').itens, ['Silva', 'de Souza']);
    assert.deepEqual(parseSobrenomesBebe('Silva Santos').itens, ['Silva', 'Santos']);
    assert.deepEqual(parseSobrenomesBebe('Silva e Santos').itens, ['Silva', 'Santos']);
    assert.deepEqual(parseSobrenomesBebe('Silva, R2D2').invalidos, ['R2D2']);
    assert.equal(parseSobrenomesBebe('').itens.length, 0);
  });

  it('nomes dos pais: até 5, inválidos separados', () => {
    const r = parseNomesPais('Helena, Theo; Maria Clara\nLia, Bia, Nina, R2D2');
    assert.equal(r.itens.length, 5);
    assert.deepEqual(r.invalidos, ['R2D2']);
    assert.equal(r.excedeu, true);
    assert.equal(parseNomesPais('').itens.length, 0);
  });

  it('resumo da resposta não expõe os nomes, só a quantidade', () => {
    const t = resumoDadosBebe({ data: '12/05/2027', sobrenomes: ['Silva', 'Santos'], nomesPais: ['Helena', 'Theo'], nomeRegistrado: null });
    assert.equal(t, '12/05/2027 · sobrenomes: Silva Santos · 2 nomes em mente');
    assert.doesNotMatch(t, /Helena|Theo/);
    assert.match(resumoDadosBebe({ data: '12/05/2027', sobrenomes: [], nomesPais: [], nomeRegistrado: 'Ana Silva' }), /nome registrado/);
  });

  it('aviso só para quem já nasceu', () => {
    assert.equal(avisoBebePorSituacao('nao_nasceu'), null);
    assert.equal(avisoBebePorSituacao('nasceu_sem_registro'), AVISO_BEBE_SEM_REGISTRO_TEXT);
    assert.equal(avisoBebePorSituacao('nasceu_registrado'), AVISO_BEBE_REGISTRADO_TEXT);
    const t = resolveBlockTransition('bebe_situacao', 'bebe_dados', 'Ana', new Set(), { avisoBebe: AVISO_BEBE_SEM_REGISTRO_TEXT });
    assert.equal(t?.id, 'aviso_bebe');
    assert.equal(detectShownBlockTransitions([{ content: t!.text }]).has('aviso_bebe'), true);
    assert.equal(resolveBlockTransition('bebe_situacao', 'bebe_sexo', 'Ana', new Set(), { avisoBebe: null }), null);
  });
});

describe('DEV-326 · ponte do chat', () => {
  it('motivo bebê zera dados antigos; os passos guardam as respostas; "tanto faz" vale como estilo', () => {
    let c = applyQuestionnaireStep({ ...INITIAL_COLLECT_STATE, bebeSexo: 'menino', bebeData: '01/01/2027' }, 'motivo_harmonizacao', { optionIds: ['bebe'] });
    assert.equal(c.motivoHarmonizacao, 'bebe');
    assert.equal(c.bebeSexo, null);
    assert.equal(c.bebeData, null);
    c = applyQuestionnaireStep(c, 'bebe_situacao', { optionIds: ['nao_nasceu'] });
    c = applyQuestionnaireStep(c, 'bebe_data_tipo', { optionIds: ['prevista'] });
    c = applyQuestionnaireStep(c, 'bebe_sexo', { optionIds: ['indefinido'] });
    c = applyBebeDados(c, { data: '12/05/2027', sobrenomes: ['Silva'], nomesPais: ['Helena'], nomeRegistrado: null });
    c = applyQuestionnaireStep(c, 'bebe_estilo', { optionIds: ['tanto_faz'] });
    assert.deepEqual(c.bebeEstilos, ['tanto_faz']);
    assert.equal(c.bebeData, '12/05/2027');
    assert.deepEqual(c.bebeNomesPais, ['Helena']);
    // mudar a situação limpa data e tipo de data
    const mudou = applyQuestionnaireStep(c, 'bebe_situacao', { optionIds: ['nasceu_sem_registro'] });
    assert.equal(mudou.bebeDataTipo, null);
    assert.equal(mudou.bebeData, null);
  });

  it('o corpo do /api/decide-live não leva nomes nem sobrenomes do bebê', () => {
    const c = applyBebeDados(
      { ...INITIAL_COLLECT_STATE, motivoHarmonizacao: 'bebe', bebeSituacao: 'nao_nasceu', bebeEstilos: ['curto'] },
      { data: '12/05/2027', sobrenomes: ['Silva'], nomesPais: ['Helena'], nomeRegistrado: null },
    );
    const body = buildDecideLiveBody('Ana Paula Souza', '01/01/1990', c);
    assert.equal(body.motivo_harmonizacao, 'bebe');
    assert.equal(body.bebe_dados_ok, true);
    assert.deepEqual(body.bebe_estilos, ['curto']);
    assert.doesNotMatch(JSON.stringify(body), /Helena|Silva|12\/05\/2027/);
  });

  it('o corpo do /api/baby-names leva o necessário; registrado manda só o nome registrado', () => {
    const c = applyBebeDados(
      { ...INITIAL_COLLECT_STATE, motivoHarmonizacao: 'bebe', bebeSituacao: 'nao_nasceu', bebeDataTipo: 'prevista', bebeSexo: 'menina', bebeEstilos: ['classico'] },
      { data: '12/05/2027', sobrenomes: ['Silva', 'Santos'], nomesPais: ['Helena'], nomeRegistrado: null },
    );
    const b = buildBabyNamesBody(c, ['Alice']);
    assert.deepEqual(
      { s: b.situacao, t: b.data_tipo, d: b.data, sx: b.sexo, so: b.sobrenomes, np: b.nomes_pais, e: b.estilos, x: b.excluir },
      { s: 'nao_nasceu', t: 'prevista', d: '12/05/2027', sx: 'menina', so: ['Silva', 'Santos'], np: ['Helena'], e: ['classico'], x: ['Alice'] },
    );
    const reg = buildBabyNamesBody(
      applyBebeDados({ ...c, bebeSituacao: 'nasceu_registrado' }, { data: '01/02/2027', sobrenomes: [], nomesPais: [], nomeRegistrado: 'Ana Silva' }),
    );
    assert.equal(reg.nome_registrado, 'Ana Silva');
    assert.deepEqual(reg.sobrenomes, []);
  });

  it('voltar: do estilo para os dados, dos dados para o sexo; do bebê registrado direto para a situação', () => {
    const st = { relacaoNome: null, aberturaMudanca: null, ondeAssinaRaw: [] as string[], fluxoMotivoAtivo: true, motivoHarmonizacao: 'bebe', bebeSituacao: 'nao_nasceu' };
    assert.equal(getPreviousFlowStep('bebe_estilo', st), 'bebe_dados');
    assert.equal(getPreviousFlowStep('bebe_dados', st), 'bebe_sexo');
    assert.equal(getPreviousFlowStep('bebe_sexo', st), 'bebe_data_tipo');
    assert.equal(getPreviousFlowStep('bebe_data_tipo', st), 'bebe_situacao');
    assert.equal(getPreviousFlowStep('bebe_situacao', st), 'motivo_harmonizacao');
    assert.equal(getPreviousFlowStep('fim_coleta', { ...st, bebeSituacao: 'nasceu_registrado' }), 'bebe_dados');
    assert.equal(getPreviousFlowStep('bebe_dados', { ...st, bebeSituacao: 'nasceu_registrado' }), 'bebe_situacao');
  });

  it('voltar apaga os dados do bebê dos passos desfeitos', () => {
    const c = applyBebeDados(
      { ...INITIAL_COLLECT_STATE, motivoHarmonizacao: 'bebe', bebeSituacao: 'nao_nasceu', bebeSexo: 'menina', bebeEstilos: ['curto'] },
      { data: '12/05/2027', sobrenomes: ['Silva'], nomesPais: ['Helena'], nomeRegistrado: null },
    );
    const r = rewindCollectStateToStep(c, 'bebe_dados');
    assert.equal(r.bebeData, null);
    assert.deepEqual(r.bebeNomesPais, []);
    assert.deepEqual(r.bebeEstilos, []);
    assert.equal(r.bebeSexo, 'menina', 'o passo anterior continua respondido');
    const tudo = rewindCollectStateToStep(c, 'motivo_harmonizacao');
    assert.equal(tudo.bebeSituacao, null);
    assert.equal(tudo.bebeSexo, null);
  });
});

describe('DEV-326 · resposta do servidor no chat', () => {
  const item = (nome: string, grupo: string, extra: Record<string, unknown> = {}) => ({
    nomeCompleto: nome, score: 80, expressao: 3, motivacao: 5, missao: 4, impressao: 2, destino: 8,
    compatibilidade: 'favoravel', bloqueios: [], grupoBebe: grupo, diasBons: 22, diasTotal: 29, ...extra,
  });

  it('mapeia os grupos e divide em seções', () => {
    const lista = mapBabyNamesToCandidates({
      seusNomes: [item('Helena Silva', 'seu')],
      sugestoes: [item('Alice Silva', 'menina'), item('Theo Silva', 'menino'), item('Sol Silva', 'neutro')],
    });
    assert.equal(lista.length, 4);
    assert.ok(lista.every((s) => s.origem === 'gerado'));
    assert.equal(lista[1]!.diasBons, 22);
    assert.equal(temSecoesBebe(lista), true);
    const g = dividirPorGrupoBebe(lista);
    assert.deepEqual([g.seu.length, g.menina.length, g.menino.length, g.neutro.length, g.outros.length], [1, 1, 1, 1, 0]);
  });

  it('avisos: sobrenome que bloqueia, nomes ignorados e bebê registrado sem aviso', () => {
    assert.match(babyNamesNotice({ semSugestoes: true, motivoSemSugestoes: 'sobrenomes_bloqueiam' }, 'nao_nasceu') ?? '', /sobrenomes/);
    assert.match(babyNamesNotice({ nomesPaisIgnorados: ['R2D2'] }, 'nao_nasceu') ?? '', /R2D2/);
    assert.equal(babyNamesNotice({ semSugestoes: false }, 'nao_nasceu'), null);
    assert.equal(babyNamesNotice({ semSugestoes: true }, 'nasceu_registrado'), null);
    assert.doesNotMatch(babyNamesNotice({ semSugestoes: true, motivoSemSugestoes: 'regras' }, 'nao_nasceu') ?? '', /[—–]/);
  });
});
