import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  box,
  choice,
  countWords,
  noul,
  score,
} from './primitives.ts';
import {
  buildInitialMomentReadingText,
  buildNomeMagneticoJevQuestions,
  buildSignatureBoxQuestions,
  buildVibrationalDiagramNodes,
  NOME_MAGNETICO_COPY,
  SUBFOCO_QUESTIONS_BY_AREA,
} from './presets/nome-magnetico.ts';
import {
  evaluateDeterministically,
  locateSignatureBoxWithJev,
  runJevDecision,
} from './providers/jev-provider.ts';
import { InteractiveDecisionEngine } from './engine.ts';
import {
  analisarNomesSocial,
  extrairSobrenomes,
  normalizarToken,
} from '../../backend/numerology/products/nome-social.ts';

describe('DEV-235 · Motor Interativo JEV (@typesafe-ai/sdk) + Filtros Mobile-First e Regeneração', () => {
  let prevScoreVersion: string | undefined;

  before(() => {
    prevScoreVersion = process.env.SCORE_VERSION;
    process.env.SCORE_VERSION = 'v3';
  });

  after(() => {
    if (prevScoreVersion === undefined) delete process.env.SCORE_VERSION;
    else process.env.SCORE_VERSION = prevScoreVersion;
  });

  it('constrói as 4 primitivas oficiais (@typesafe-ai/sdk): choice, score, noul e box', () => {
    const qChoice = choice('Qual área?', {
      prosperidade_financeira: 'Finanças',
      carreira_negocios: 'Carreira',
    });
    assert.equal(qChoice.type, 'choice');
    assert.ok('prosperidade_financeira' in qChoice.criteria);

    const qScore = score('Nível de clareza?', [
      'Relato em branco',
      'Relato com objetivo claro',
    ] as const);
    assert.equal(qScore.type, 'score');
    assert.equal(qScore.criteria.length, 2);

    const qNoul = noul('Tem escopo suficiente?', {
      true: 'Relato completo',
      false: 'Relato vazio',
    });
    assert.equal(qNoul.type, 'noul');

    const qBox = box('Assinatura manuscrita na folha');
    assert.equal(qBox.type, 'box');
    assert.equal(qBox.instructions, 'Assinatura manuscrita na folha');

    const nmQuestions = buildNomeMagneticoJevQuestions();
    assert.equal(nmQuestions.escopo_pronto.type, 'noul');
    assert.equal(nmQuestions.clareza_relato.type, 'score');
    assert.equal(nmQuestions.area_foco.type, 'choice');
    assert.equal(nmQuestions.alerta_compliance_legal.type, 'noul');

    const boxQuestions = buildSignatureBoxQuestions();
    assert.equal(boxQuestions.assinatura_visivel.type, 'noul');
    assert.equal(boxQuestions.regiao_assinatura.type, 'box');
  });

  it('locateSignatureBoxWithJev opera com fallback determinístico quando sem créditos/offline', async () => {
    const prevKey = process.env.TYPESAFE_API_KEY;
    delete process.env.TYPESAFE_API_KEY;
    try {
      const res = await locateSignatureBoxWithJev('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
      assert.equal(res.providerUsed, 'deterministic');
      assert.equal(res.hasVisibleSignature, true);
      assert.ok(res.box.top >= 0 && res.box.bottom <= 1);
      assert.ok(res.box.left >= 0 && res.box.right <= 1);
    } finally {
      if (prevKey !== undefined) process.env.TYPESAFE_API_KEY = prevKey;
    }
  });

  it('extrai sobrenomes ignorando primeiro nome e partículas isoladas (de, da, do, dos, das, e)', () => {
    assert.deepEqual(extrairSobrenomes('Maria da Silva Santos'), ['Silva', 'Santos']);
    assert.deepEqual(extrairSobrenomes('Guilherme Malickovski Correa'), ['Malickovski', 'Correa']);
    assert.deepEqual(extrairSobrenomes('João dos Anjos e Ferreira'), ['Anjos', 'Ferreira']);
    assert.equal(normalizarToken('Férreira'), 'ferreira');
  });

  it('respeita sobrenomesObrigatorios, sobrenomesExcluidos, nomesExcluidos e avisoSobrenomeExigido', () => {
    // Ana Paula Ferreira Lima (23/07/1988) -> Ferreira exige acento sutil (Férreira) para atingir nota >= 85
    const comFerreira = analisarNomesSocial([], 'Ana Paula Ferreira Lima', '23/07/1988', {
      sobrenomesObrigatorios: ['Ferreira'],
    });
    assert.ok(comFerreira.melhorNome);
    assert.ok(
      normalizarToken(comFerreira.melhorNome!.nomeCompleto).includes('ferreira'),
      `Melhor nome deve conter Ferreira (recebido: ${comFerreira.melhorNome!.nomeCompleto})`
    );
    assert.ok(comFerreira.avisoSobrenomeExigido);
    assert.equal(comFerreira.avisoSobrenomeExigido?.precisouAcento, true);

    // Excluindo Malickovski, deve priorizar Correa em Guilherme Malickovski Correa
    const semMalickovski = analisarNomesSocial([], 'Guilherme Malickovski Correa', '14/02/1990', {
      sobrenomesExcluidos: ['Malickovski'],
    });
    assert.ok(semMalickovski.melhorNome);
    assert.equal(
      normalizarToken(semMalickovski.melhorNome!.nomeCompleto).includes('malickovski'),
      false,
      `Não deveria conter sobrenome excluído (recebido: ${semMalickovski.melhorNome!.nomeCompleto})`
    );

    // Regeneração excluindo os nomes já mostrados deve trazer novas opções inéditas
    const primeiraRodada = analisarNomesSocial([], 'Juliana Martins Rocha', '18/03/1992');
    const exibidos = [
      primeiraRodada.melhorNome?.nomeCompleto,
      ...primeiraRodada.top3.map(t => t.nomeCompleto),
    ].filter((n): n is string => Boolean(n));

    const segundaRodada = analisarNomesSocial([], 'Juliana Martins Rocha', '18/03/1992', {
      nomesExcluidos: exibidos,
    });
    assert.ok(segundaRodada.melhorNome);
    assert.equal(
      exibidos.map(e => e.toLowerCase()).includes(segundaRodada.melhorNome!.nomeCompleto.toLowerCase()),
      false,
      'A regeneração deve devolver uma sugestão inédita diferente das já exibidas'
    );
  });

  it('aciona guardrail DEV-183 (alertaComplianceLegal = true) quando relato cita termos médicos/clínicos', async () => {
    const engine = new InteractiveDecisionEngine('nome-magnetico');
    const out = await engine.evaluate({
      nome_completo: 'Maria da Silva Santos',
      numero_destino: 4,
      nota_hoje: 62,
      potencial: 95,
      bloqueios_triangulos: ['444'],
      relato_consulente: 'Tenho sentido muita ansiedade clínica e depressão e busco cura médica',
    });

    assert.equal(out.alertaComplianceLegal, true);
    assert.ok(out.palpiteTexto.includes('A numerologia não substitui cuidados médicos ou emocionais'));
  });

  it('audita toda a copy do Nome Magnético: zero travessões (—/–), zero ×, zero jargões proibidos e nós entre 4 e 6 palavras', () => {
    const allStrings: string[] = [];
    function collectStrings(obj: unknown) {
      if (typeof obj === 'string') {
        allStrings.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(collectStrings);
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(collectStrings);
      }
    }

    collectStrings(NOME_MAGNETICO_COPY);
    collectStrings(SUBFOCO_QUESTIONS_BY_AREA);

    const areas = [
      'prosperidade_financeira',
      'carreira_negocios',
      'relacionamentos_harmonia',
      'autoestima_expressao',
    ] as const;

    for (const area of areas) {
      allStrings.push(
        buildInitialMomentReadingText({
          areaFoco: area,
          destino: 8,
          bloqueio: '444',
          notaHoje: 60,
          potencial: 96,
          alertaComplianceLegal: false,
        })
      );
      const nodes = buildVibrationalDiagramNodes({
        destino: 8,
        bloqueio: '444',
        notaHoje: 60,
        potencial: 96,
        areaFoco: area,
        estiloPresenca: 'sobrenome_forte',
        ondeAssina: 'rotina_trabalho',
      });
      assert.equal(nodes.length, 4);
      for (const node of nodes) {
        const words = countWords(node.label);
        assert.ok(
          words >= 4 && words <= 6,
          `Nó "${node.label}" deve ter entre 4 e 6 palavras (encontrado: ${words})`
        );
        allStrings.push(node.label, node.eyebrow);
      }
    }

    for (const text of allStrings) {
      assert.equal(/[—–×]/.test(text), false, `Texto contém caractere proibido (—/–/×): "${text}"`);
      assert.equal(
        /\b(score|ranking|N5|self-service|studio mlk)\b/i.test(text),
        false,
        `Texto contém jargão proibido: "${text}"`
      );
    }
  });

  it('evaluateDeterministically e runJevDecision inferem área, canal e subfoco corretamente', async () => {
    const prevTsKey = process.env.TYPESAFE_API_KEY;
    const prevOaKey = process.env.OPENAI_API_KEY;
    delete process.env.TYPESAFE_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const res = await runJevDecision({
        nome_completo: 'Guilherme Malickovski Correa',
        numero_destino: 8,
        nota_hoje: 68,
        potencial: 95,
        bloqueios_triangulos: ['111'],
        relato_consulente: 'Quero fechar mais contratos e vendas usando minha assinatura no Instagram e LinkedIn',
      });

      assert.equal(res.providerUsed, 'deterministic');
      assert.equal(res.escopoPronto, true);
      assert.equal(res.areaFoco, 'carreira_negocios');
      assert.equal(res.ondeAssina, 'presenca_digital');
      assert.equal(res.estiloPresenca, 'curto_direto');
      assert.equal(res.subfocoMomento, 'fechar_contratos');
      assert.equal(res.alertaComplianceLegal, false);

      const detFin = evaluateDeterministically({
        nome_completo: 'Ana Paula Ferreira Lima',
        numero_destino: 5,
        nota_hoje: 70,
        potencial: 95,
        bloqueios_triangulos: ['555'],
        relato_consulente: 'Preciso fazer o dinheiro render e quitar dívidas',
      });
      assert.equal(detFin.areaFoco, 'prosperidade_financeira');
      assert.equal(detFin.subfocoMomento, 'organizar_estabilidade');
    } finally {
      if (prevTsKey !== undefined) process.env.TYPESAFE_API_KEY = prevTsKey;
      if (prevOaKey !== undefined) process.env.OPENAI_API_KEY = prevOaKey;
    }
  });
});
