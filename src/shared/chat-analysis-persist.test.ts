import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  chaveNomesCaminho,
  nomesArtisticosPersistSchema,
  nomesBebePersistSchema,
  perfilChatSchema,
} from './chat-analysis-persist.ts';

describe('chat-analysis-persist / schemas Zod DEV-328', () => {
  it('aceita perfilChat para os 3 caminhos (Social, Artístico e Bebê)', () => {
    const social = perfilChatSchema.safeParse({ motivo: 'dia_a_dia' });
    assert.equal(social.success, true);

    const artistico = perfilChatSchema.safeParse({
      motivo: 'artistico',
      areaArtistica: 'cantor',
      detalheArtistico: ['mpb'],
      generoPersona: 'neutro',
      imagemArtistica: ['marcante', 'sofisticada'],
      tipoNomeArtistico: 'ambos',
    });
    assert.equal(artistico.success, true);

    const bebe = perfilChatSchema.safeParse({
      motivo: 'bebe',
      bebeMae: 'Ana Silva',
      bebePai: 'Carlos Souza',
      bebeSituacao: 'nao_nasceu',
      bebeDataTipo: 'prevista',
      bebeSexo: 'indefinido',
      bebeData: '15/06/2027',
      bebeSobrenomes: ['Silva', 'Souza'],
      bebeNomesPais: ['Lucas', 'Helena'],
      bebeEstilos: ['curto', 'classico'],
    });
    assert.equal(bebe.success, true);
  });

  it('rejeita perfilChat do bebê com data ou enum inválidos', () => {
    const badDate = perfilChatSchema.safeParse({
      motivo: 'bebe',
      bebeData: '2027-06-15',
    });
    assert.equal(badDate.success, false);

    const badSituacao = perfilChatSchema.safeParse({
      motivo: 'bebe',
      bebeSituacao: 'qualquer_outra',
    });
    assert.equal(badSituacao.success, false);
  });

  it('valida nomesArtisticosPersistSchema com próximos, novos e escolhido', () => {
    const ok = nomesArtisticosPersistSchema.safeParse({
      proximos: [
        {
          nome: 'Gabi Luz',
          nota: 84,
          expressao: 3,
          afinidade: 2,
          explicacao: 'Boa comunicação para música.',
          tecnica: 'apelido',
          secao: 'proximo',
        },
      ],
      novos: [
        {
          nome: 'Lira Sol',
          nota: 92,
          expressao: 5,
          afinidade: 1,
          explicacao: 'Expansão criativa.',
          tecnica: 'ia',
          secao: 'novo',
        },
      ],
      escolhido: 'Lira Sol',
    });
    assert.equal(ok.success, true);

    const badSecao = nomesArtisticosPersistSchema.safeParse({
      proximos: [{ nome: 'X', nota: 80, expressao: 3, secao: 'invalido' }],
      novos: [],
      escolhido: 'Lira Sol',
    });
    assert.equal(badSecao.success, false);
  });

  it('valida nomesBebePersistSchema com seusNomes, sugestoes, janela e escolhido', () => {
    const ok = nomesBebePersistSchema.safeParse({
      seusNomes: [
        {
          nome: 'Lucas Silva',
          nota: 65,
          expressao: 4,
          bloqueios: ['333'],
          diasBons: 10,
          diasTotal: 29,
          grupo: 'seu',
        },
      ],
      sugestoes: [
        {
          nome: 'Helena Silva',
          nota: 94,
          expressao: 6,
          bloqueios: [],
          diasBons: 26,
          diasTotal: 29,
          grupo: 'menina',
        },
      ],
      janela: { dias: 29, centro: '15/06/2027' },
      escolhido: 'Helena Silva',
    });
    assert.equal(ok.success, true);

    const badJanela = nomesBebePersistSchema.safeParse({
      seusNomes: [],
      sugestoes: [],
      janela: { dias: 29, centro: 'invalida' },
      escolhido: 'Helena Silva',
    });
    assert.equal(badJanela.success, false);
  });
});

describe('DEV-328 · chaveNomesCaminho', () => {
  it('muda quando a lista de nomes muda e ignora maiúsculas', () => {
    const base = { escolhido: 'Luna Vale', proximos: [{ nome: 'Lari Macedo' }], novos: [{ nome: 'Luna Vale' }] };
    const igual = { escolhido: 'luna vale', proximos: [{ nome: 'LARI MACEDO' }], novos: [{ nome: 'Luna Vale' }] };
    const outra = { escolhido: 'Luna Vale', proximos: [{ nome: 'Lari Macedo' }], novos: [{ nome: 'Aurora Lis' }] };
    assert.equal(chaveNomesCaminho(base), chaveNomesCaminho(igual));
    assert.notEqual(chaveNomesCaminho(base), chaveNomesCaminho(outra));
    assert.equal(chaveNomesCaminho(undefined), '');
  });
});
