import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleProductVotePost,
  productVoteSchema,
  resetVoteRateLimiterForTests,
  type ProductVoteOption,
} from '../../pages/api/product-vote.ts';
import { buildSocialAnalyzePayload, type SocialNameFormState } from '../../frontend/components/app/SocialNameForm.tsx';
import { analisarNomesSocial } from './products/nome-social.ts';

describe('DEV-190 · F6: Votação sem cookies e sem dados pessoais', () => {
  beforeEach(() => {
    resetVoteRateLimiterForTests();
  });

  it('aceita apenas as 3 opções canônicas (nome_bebe, nome_empresa, outro)', () => {
    assert.equal(productVoteSchema.safeParse({ option: 'nome_bebe' }).success, true);
    assert.equal(productVoteSchema.safeParse({ option: 'nome_empresa' }).success, true);
    assert.equal(productVoteSchema.safeParse({ option: 'outro' }).success, true);
    assert.equal(productVoteSchema.safeParse({ option: 'invalido' }).success, false);
  });

  it('rejeita texto livre em "outro" ou qualquer campo de dado pessoal (email, distinct_id, ip, comment)', () => {
    assert.equal(
      productVoteSchema.safeParse({
        option: 'outro',
        custom_text: 'Quero numerologia de endereço',
      }).success,
      false
    );

    assert.equal(
      productVoteSchema.safeParse({
        option: 'nome_bebe',
        email: 'pessoa@exemplo.com',
      }).success,
      false
    );

    assert.equal(
      productVoteSchema.safeParse({
        option: 'nome_empresa',
        distinct_id: 'ph_12345',
      }).success,
      false
    );
  });

  it('endpoint incrementa apenas o contador agregado, não grava Set-Cookie e ignora cookies enviados', async () => {
    const counts: Record<ProductVoteOption, number> = {
      nome_bebe: 0,
      nome_empresa: 0,
      outro: 0,
    };
    const recordedArgs: unknown[] = [];

    const mockAdapter = {
      async incrementVote(opt: ProductVoteOption): Promise<number> {
        recordedArgs.push(opt);
        counts[opt] += 1;
        return counts[opt];
      },
    };

    const req = new Request('http://localhost:4321/api/product-vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'session=secret_cookie; ph_distinct_id=abc',
        'x-forwarded-for': '203.0.113.10',
      },
      body: JSON.stringify({ option: 'outro' }),
    });

    const res = await handleProductVotePost(req, mockAdapter);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('set-cookie'), null);

    const data = await res.json();
    assert.deepEqual(data, { ok: true, option: 'outro', votes_count: 1 });
    // Garante que o adaptador de persistência recebeu única e exclusivamente a string da opção ('outro')
    assert.deepEqual(recordedArgs, ['outro']);
  });

  it('endpoint retorna 400 se enviarem texto aberto junto com "outro"', async () => {
    const mockAdapter = {
      async incrementVote(): Promise<number> {
        throw new Error('Não deveria ser chamado');
      },
    };

    const req = new Request('http://localhost:4321/api/product-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option: 'outro', texto: 'Sugestão aberta' }),
    });

    const res = await handleProductVotePost(req, mockAdapter);
    assert.equal(res.status, 400);
    assert.equal(res.headers.get('set-cookie'), null);
  });
});

describe('DEV-190 · F6: Formulário do Nome Social e payload sem campos removidos', () => {
  it('não inclui genero_preferido nem estilo_preferido no payload enviado para /api/analyze', () => {
    const formState: SocialNameFormState = {
      nome_completo: 'Maria da Silva Santos',
      data_nascimento: '26/05/1971',
      assinatura_atual: 'Maria Santos',
      onde_vai_usar: ['redes_sociais', 'profissional'],
      aceita_encurtar_apelido: false,
      objetivo_apresentacao: 'Transição executiva com leveza e autoridade',
      vibracoes_desejadas: 'Autoridade, Leveza',
      nomes_candidatos: 'Mariã Silva',
    };

    const payload = buildSocialAnalyzePayload(formState);

    assert.equal('genero_preferido' in payload, false);
    assert.equal('genero' in payload, false);
    assert.equal('estilo_preferido' in payload, false);
    assert.equal(payload.product_type, 'nome_social');
    assert.equal(payload.nome_completo, 'Maria da Silva Santos');
    assert.equal(payload.data_nascimento, '26/05/1971');
    assert.equal(payload.assinatura_atual, 'Maria Santos');
    assert.deepEqual(payload.onde_vai_usar, ['redes_sociais', 'profissional']);
    assert.equal(payload.aceita_encurtar_apelido, false);
    assert.equal(payload.objetivo_apresentacao, 'Transição executiva com leveza e autoridade');
    assert.equal(payload.vibracoes_desejadas, 'Autoridade, Leveza');
    assert.deepEqual(payload.nomes_candidatos, ['Mariã Silva']);
  });

  it('inclui assinatura_atual como linha de base nos candidatos avaliados e respeita aceitaEncurtarOuApelido', () => {
    const resultadoPadrao = analisarNomesSocial(
      [],
      'Guilherme Malickovski Correa',
      '15/04/1990',
      {
        assinaturaAtual: 'Guilherme Correa',
        ondeVaiUsar: ['documentos', 'profissional'],
        aceitaEncurtarOuApelido: false,
      }
    );

    const linhaDeBase = resultadoPadrao.nomesCandidatos.find(
      c => c.nomeCompleto.toLowerCase() === 'guilherme correa'
    );
    assert.ok(linhaDeBase);
    assert.ok(linhaDeBase.explicacao?.includes('assinatura atual'));
  });
});
