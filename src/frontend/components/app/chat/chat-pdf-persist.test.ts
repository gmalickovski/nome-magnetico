import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_COLLECT_STATE } from './decide-live-bridge.ts';
import { buildChatPdfAnalyzePayload } from './chat-pdf-persist.ts';

describe('buildChatPdfAnalyzePayload', () => {
  it('marca nome escolhido e envia nome social principal', () => {
    const sug = {
      id: '1',
      nome: 'Guilherme Málickovski',
      score: 80,
      expressao: 1,
      compatibilidade: 'neutro',
      bloqueiosEliminados: 0,
      bloqueiosRestantes: 0,
      arcanosPositivos: 0,
      dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
      panel: {
        nome: 'Guilherme Málickovski',
        score: 80,
        expressao: 1,
        destino: 1,
        motivacao: 1,
        missao: 1,
        impressao: 1,
        potencial: 90,
        bloqueiosCount: 0,
        bloqueios: [],
        trianguloVida: { topo: 1, base: [1] },
      },
    };
    const body = buildChatPdfAnalyzePayload({
      birthName: 'Maria Silva',
      birthDate: '01/01/1990',
      selectedSocialName: 'Guilherme Málickovski',
      collect: { ...INITIAL_COLLECT_STATE, areaFoco: 'carreira_negocios' },
      suggestions: [sug, { ...sug, id: '2', nome: 'Gui Málickovski' }],
    });
    assert.equal(body.product_type, 'nome_social');
    assert.equal(body.nome_completo, 'Maria Silva');
    assert.equal(body.nome_social_principal, 'Guilherme Málickovski');
    assert.equal(body.area_foco, 'carreira_negocios');
    assert.equal(body.nome_ja_escolhido, true);
    assert.equal(body.ranking_somente_chat, true);
    assert.deepEqual(body.nomes_candidatos, [
      'Guilherme Málickovski',
      'Gui Málickovski',
    ]);
    assert.equal(body.ranking_vazio_sem_autogeracao, false);
  });

  it('histórico vazio marca contrato sem autogeração', () => {
    const body = buildChatPdfAnalyzePayload({
      birthName: 'Maria Silva',
      birthDate: '01/01/1990',
      selectedSocialName: 'Guilherme Málickovski',
      collect: INITIAL_COLLECT_STATE,
      suggestions: [],
    });
    assert.equal(body.ranking_somente_chat, true);
    assert.equal(body.ranking_vazio_sem_autogeracao, true);
    assert.equal(body.nomes_candidatos, undefined);
    assert.equal(body.nomes_artisticos, undefined);
    assert.equal(body.nomes_bebe, undefined);
  });

  it('caminho artístico envia nomes_artisticos (próximos e novos) e perfil_chat', () => {
    const basePanel = {
      nome: 'Gabi Luz',
      score: 86,
      expressao: 3,
      destino: 5,
      motivacao: 1,
      missao: 3,
      impressao: 2,
      potencial: 90,
      bloqueiosCount: 0,
      bloqueios: [],
      trianguloVida: { topo: 3, base: [1, 2] },
    };
    const body = buildChatPdfAnalyzePayload({
      birthName: 'Gabriela Mendes',
      birthDate: '12/04/1995',
      selectedSocialName: 'Lira Sol',
      collect: {
        ...INITIAL_COLLECT_STATE,
        motivoHarmonizacao: 'artistico',
        areaArtistica: 'cantor',
        tipoNomeArtistico: 'ambos',
      },
      suggestions: [
        {
          id: 'gabi-luz',
          nome: 'Gabi Luz',
          score: 86,
          expressao: 3,
          compatibilidade: 'total',
          bloqueiosEliminados: 0,
          bloqueiosRestantes: 0,
          arcanosPositivos: 0,
          dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
          secao: 'proximo',
          tecnica: 'apelido',
          afinidade: 2,
          explicacao: 'Boa projeção vocal.',
          panel: basePanel,
        },
        {
          id: 'lira-sol',
          nome: 'Lira Sol',
          score: 94,
          expressao: 5,
          compatibilidade: 'complementar',
          bloqueiosEliminados: 0,
          bloqueiosRestantes: 0,
          arcanosPositivos: 0,
          dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
          secao: 'novo',
          tecnica: 'ia',
          afinidade: 1,
          explicacao: 'Presença de palco.',
          panel: { ...basePanel, nome: 'Lira Sol', score: 94, expressao: 5 },
        },
      ],
    });
    assert.deepEqual(body.nomes_artisticos, {
      proximos: [
        {
          nome: 'Gabi Luz',
          nota: 86,
          expressao: 3,
          afinidade: 2,
          explicacao: 'Boa projeção vocal.',
          tecnica: 'apelido',
          secao: 'proximo',
        },
      ],
      novos: [
        {
          nome: 'Lira Sol',
          nota: 94,
          expressao: 5,
          afinidade: 1,
          explicacao: 'Presença de palco.',
          tecnica: 'ia',
          secao: 'novo',
        },
      ],
      escolhido: 'Lira Sol',
    });
    assert.equal((body.perfil_chat as { motivo?: string }).motivo, 'artistico');
    assert.equal(body.nomes_bebe, undefined);
  });

  it('caminho bebê envia perfil_chat estendido e nomes_bebe com janela e bloqueios', () => {
    const basePanel = {
      nome: 'Alice Silva',
      score: 92,
      expressao: 6,
      destino: 7,
      motivacao: 2,
      missao: 6,
      impressao: 4,
      potencial: 95,
      bloqueiosCount: 0,
      bloqueios: [],
      trianguloVida: { topo: 6, base: [1, 5] },
    };
    const body = buildChatPdfAnalyzePayload({
      birthName: 'Alice Silva',
      birthDate: '15/06/2027',
      selectedSocialName: 'Alice Silva',
      babyJanela: { dias: 29, centro: '15/06/2027' },
      collect: {
        ...INITIAL_COLLECT_STATE,
        motivoHarmonizacao: 'bebe',
        bebeMae: 'Ana Silva',
        bebePai: 'Carlos Souza',
        bebeSituacao: 'nao_nasceu',
        bebeDataTipo: 'prevista',
        bebeSexo: 'menina',
        bebeData: '15/06/2027',
        bebeSobrenomes: ['Silva'],
        bebeNomesPais: ['Aurora'],
        bebeEstilos: ['curto'],
      },
      suggestions: [
        {
          id: 'aurora-silva',
          nome: 'Aurora Silva',
          score: 64,
          expressao: 8,
          compatibilidade: 'neutro',
          bloqueiosEliminados: 0,
          bloqueiosRestantes: 1,
          bloqueiosCodigos: ['444'],
          grupoBebe: 'seu',
          diasBons: 8,
          diasTotal: 29,
          arcanosPositivos: 0,
          dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
          panel: { ...basePanel, nome: 'Aurora Silva', score: 64, bloqueiosCount: 1, bloqueios: [{ codigo: '444', titulo: 'Sequência 444' }] },
        },
        {
          id: 'alice-silva',
          nome: 'Alice Silva',
          score: 92,
          expressao: 6,
          compatibilidade: 'total',
          bloqueiosEliminados: 0,
          bloqueiosRestantes: 0,
          bloqueiosCodigos: [],
          grupoBebe: 'menina',
          diasBons: 25,
          diasTotal: 29,
          arcanosPositivos: 0,
          dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
          panel: basePanel,
        },
      ],
    });

    assert.deepEqual(body.nomes_bebe, {
      seusNomes: [
        {
          nome: 'Aurora Silva',
          nota: 64,
          expressao: 8,
          bloqueios: ['444'],
          diasBons: 8,
          diasTotal: 29,
          grupo: 'seu',
        },
      ],
      sugestoes: [
        {
          nome: 'Alice Silva',
          nota: 92,
          expressao: 6,
          bloqueios: [],
          diasBons: 25,
          diasTotal: 29,
          grupo: 'menina',
        },
      ],
      janela: { dias: 29, centro: '15/06/2027' },
      escolhido: 'Alice Silva',
    });
    assert.deepEqual(body.perfil_chat, {
      motivo: 'bebe',
      areaArtistica: undefined,
      areaArtisticaOutro: undefined,
      detalheArtistico: undefined,
      generoPersona: undefined,
      imagemArtistica: undefined,
      tipoNomeArtistico: undefined,
      outrosUsos: undefined,
      bebeMae: 'Ana Silva',
      bebePai: 'Carlos Souza',
      bebeSituacao: 'nao_nasceu',
      bebeDataTipo: 'prevista',
      bebeSexo: 'menina',
      bebeData: '15/06/2027',
      bebeSobrenomes: ['Silva'],
      bebeNomesPais: ['Aurora'],
      bebeNomeRegistrado: undefined,
      bebeEstilos: ['curto'],
    });
  });
});
