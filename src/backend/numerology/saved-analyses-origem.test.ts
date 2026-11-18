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
  it('outros produtos não recebem tag', () => {
    assert.equal(resolverOrigemNome(false, 'nome_bebe', 'Ana', null, null), undefined);
  });
});
