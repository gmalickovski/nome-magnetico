import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildBirthNamePanel } from '../../backend/numerology/birth-name-panel.ts';
import {
  buildPostChoiceMotorInsight,
  buildPostSuggestionChoiceBlock,
  buildProfilePalpiteText,
  profilePalpiteHasNoDigits,
} from './chat-profile-copy.ts';
import { validateTextAgainstMotorFacts, buildMotorReadingFacts } from './motor-copy-validation.ts';

describe('chat-profile-copy · palpite e pós-escolha', () => {
  it('Guilherme · 14/02/1990 — painel alinhado ao motor (main)', () => {
    const panel = buildBirthNamePanel('Guilherme Malickovski Correa', '14/02/1990');
    assert.equal(panel.destino, 8);
    assert.equal(panel.expressao, 6);
    assert.equal(panel.motivacao, 4);
    assert.equal(panel.missao, 5);
    assert.equal(panel.impressao, 2);
    assert.equal(panel.score, 64);
    assert.equal(panel.potencial, 93);
  });

  it('palpite de perfil não contém dígitos', () => {
    const text = buildProfilePalpiteText({
      nomeCompleto: 'Guilherme Malickovski Correa',
      areaFoco: 'carreira_negocios',
      subfocoMomento: 'fechar_contratos',
      ondeAssina: ['rotina_trabalho'],
      sobrenomesObrigatorios: ['Malickovski'],
      relatoUsuario: 'Quero fechar mais contratos',
    });
    assert.equal(profilePalpiteHasNoDigits(text), true);
    assert.ok(text.includes('carreira'));
    assert.ok(!text.includes('93'));
    assert.ok(!text.includes('64'));
  });

  it('pós-escolha usa só números do motor nos painéis', () => {
    const birth = buildBirthNamePanel('Guilherme Malickovski Correa', '14/02/1990');
    const chosen = buildBirthNamePanel('Guilherme Málickovski', '14/02/1990');
    const block = buildPostSuggestionChoiceBlock({
      assinaturaEscolhida: 'Guilherme Málickovski',
      notaHoje: birth.score,
      notaEscolhida: 93,
      birth,
      chosen,
    });
    assert.ok(block.includes('64'));
    assert.ok(block.includes('93'));
    const facts = buildMotorReadingFacts({
      notaHoje: birth.score,
      notaEscolhida: 93,
      destino: chosen.destino,
      expressao: birth.expressao,
      motivacao: chosen.motivacao,
      missao: chosen.missao,
      bloqueiosCodigos: birth.bloqueiosCodigos,
      extraNumbers: [birth.bloqueiosCount - chosen.bloqueiosCount],
    });
    assert.equal(validateTextAgainstMotorFacts(block, facts), true);
    assert.equal(validateTextAgainstMotorFacts('Sua sequência 333 no triângulo da vida.', facts), false);
  });

  it('buildPostChoiceMotorInsight compara expressão quando muda', () => {
    const insight = buildPostChoiceMotorInsight(
      { expressao: 6, destino: 8, motivacao: 4, missao: 5, impressao: 2, bloqueiosCount: 4 },
      { expressao: 6, destino: 8, motivacao: 11, missao: 5, impressao: 4, bloqueiosCount: 0 }
    );
    assert.ok(insight.includes('elimina'));
  });
});
