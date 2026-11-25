import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolverOrigemNome } from './saved-analyses-view.ts';

describe('DEV-317 · tag de origem do nome em Minhas análises', () => {
  const ranking = {
    nomesCandidatos: [
      { nomeCompleto: 'Claudia Delanni Vitoria', origem: 'gerado' },
      { nomeCompleto: 'Claudia Delanni', origem: 'manual' },
    ],
  };
  it('análise gratuita é nome de nascimento', () => {
    assert.equal(resolverOrigemNome(true, 'analise_gratuita', 'Cláudia Delanni Vitória', null, null), 'nascimento');
  });
  it('nome igual ao de nascimento é nome de nascimento', () => {
    assert.equal(resolverOrigemNome(false, 'nome_social', 'Cláudia Delanni Vitória', 'Cláudia Delanni Vitória', ranking), 'nascimento');
  });
  it('nome testado pela pessoa é "Seu teste"', () => {
    assert.equal(resolverOrigemNome(false, 'nome_social', 'Claudia Delanni', 'Cláudia Delanni Vitória', ranking), 'teste');
  });
  it('sugestão gerada é do sistema', () => {
    assert.equal(resolverOrigemNome(false, 'nome_social', 'Claudia Delanni Vitoria', 'Cláudia Delanni Vitória', ranking), 'sistema');
  });
  it('nome escolhido entre as sugestões (origemSugerida usuario, origem gerado) é do sistema', () => {
    const r = { nomesCandidatos: [{ nomeCompleto: 'Guilherme Málickovski', origem: 'gerado', origemSugerida: 'usuario' }] };
    assert.equal(resolverOrigemNome(false, 'nome_social', 'Guilherme Málickovski', 'Guilherme Malickovski Correa', r), 'sistema');
  });
  it('outros produtos não recebem tag', () => {
    assert.equal(resolverOrigemNome(false, 'nome_bebe', 'Ana', null, null), undefined);
  });
});

describe('DEV-317 · card do nome de nascimento', () => {
  it('não tem lixeira e segue o nome do perfil', async () => {
    const { buildSavedAnalysesItems } = await import('./saved-analyses-view.ts');
    const antiga = {
      id: 'free-old', user_id: 'u', product_type: 'analise_gratuita', is_free: true, status: 'complete',
      nome_completo: 'Claudia Delani Vitoria', data_nascimento: '1991-05-31', created_at: '2026-01-01T00:00:00Z',
      score: 50, score_version: 'v3', bloqueios: [], frequencias_numeros: {},
    } as any;
    const itens = buildSavedAnalysesItems([antiga], {
      isAdmin: false, profileBirthName: 'Cláudia Delanni Vitória', profileBirthDate: '1991-05-31',
    });
    const nasc = itens.filter((i) => i.origemNome === 'nascimento');
    assert.equal(nasc.length, 1);
    assert.equal(nasc[0]!.nomeExibido, 'Cláudia Delanni Vitória');
    assert.equal(nasc[0]!.canDelete, false);
  });
});
