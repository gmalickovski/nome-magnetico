import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CANONICAL_GLOSSARY_TERMS } from '../../shared/glossary/canonical-terms.ts';
import { matchUserGlossaryTerms, mergeGlossaryTerms } from './glossary-service.ts';

describe('glossary-service', () => {
  it('retorna catálogo canônico completo quando o banco está vazio (ex.: TESTE)', () => {
    const merged = mergeGlossaryTerms([]);
    assert.ok(merged.length >= 25, 'catálogo canônico deve conter ao menos 25 termos');
    const b444 = merged.find((t) => t.slug === 'bloqueio-444');
    assert.ok(b444);
    assert.equal(b444!.category, 'bloqueios');
    assert.equal(b444!.isCanonicalFallback, true);
  });

  it('aplica precedência do banco mantendo categoria/aliases do canônico e inclui termos novos', () => {
    const merged = mergeGlossaryTerms([
      {
        slug: 'bloqueio-444',
        term: 'Bloqueio 444 Customizado',
        definition_markdown: 'Descrição editorial vinda do CMS.',
        related_number: 4,
        tags: ['Editorial'],
      },
      {
        slug: 'vibracao-especial-custom',
        term: 'Vibração Especial do Nome',
        definition_markdown: '### Definição\n\nTexto exclusivo criado pelo CMS no banco.',
        related_number: 7,
        tags: ['Harmonização'],
      },
    ]);

    const overridden = merged.find((t) => t.slug === 'bloqueio-444');
    assert.ok(overridden);
    assert.equal(overridden!.term, 'Bloqueio 444 Customizado');
    assert.equal(overridden!.isCanonicalFallback, false);
    assert.equal(overridden!.category, 'bloqueios');
    assert.ok(overridden!.aliases.includes('Bloqueio 444'));

    const custom = merged.find((t) => t.slug === 'vibracao-especial-custom');
    assert.ok(custom);
    assert.equal(custom!.category, 'assinatura');
    assert.ok(custom!.shortSummary.includes('Texto exclusivo criado pelo CMS'));
  });

  it('cruza termos presentes no mapa do usuário sem duplicar slugs', () => {
    const matched = matchUserGlossaryTerms(CANONICAL_GLOSSARY_TERMS, {
      numero_expressao: 11,
      numero_destino: 6,
      bloqueios: [{ codigo: '444' }, { codigo: '444' }],
      licoes_carmicas: [{ numero: 3 }],
      tendencias_ocultas: [{ numero: 8 }],
      debitos_karmicos: [{ numero: 16 }],
    });

    const slugs = matched.map((m) => m.term.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    assert.ok(slugs.includes('bloqueio-444'));
    assert.ok(slugs.includes('debito-karmico-16'));
    assert.ok(slugs.includes('licoes-karmicas'));
    assert.ok(slugs.includes('tendencias-ocultas'));
    assert.ok(slugs.includes('numero-mestre-11'));
    assert.ok(slugs.includes('numero-de-expressao'));
    assert.ok(slugs.includes('numero-de-destino'));
  });
});

import { it as itDev306 } from 'node:test';
import assertDev306 from 'node:assert/strict';
import { mergeGlossaryTerms as mergeDev306 } from './glossary-service.ts';

itDev306('DEV-306 · verbetes duplicados do banco ficam fora da lista', () => {
  const lista = mergeDev306([
    { slug: 'tabela-cabalistica', term: 'Tabela Cabalística', definition_markdown: 'texto antigo' },
    { slug: 'grafosofia', term: 'Grafosofia', definition_markdown: 'Estudo da escrita.' },
  ]);
  const slugs = lista.map((t) => t.slug);
  assertDev306.ok(!slugs.includes('tabela-cabalistica'));
  assertDev306.ok(slugs.includes('tabela-cabalistica-das-letras'));
  assertDev306.ok(slugs.includes('grafosofia'));
});

import { glossaryTermsFromDb } from './glossary-service.ts';

describe('DEV-307 · banco como fonte única', () => {
  it('só os termos do banco aparecem; termo do catálogo fora do banco não entra', () => {
    const lista = glossaryTermsFromDb([
      { slug: 'nome-de-ouro', term: 'Nome de Ouro', definition_markdown: 'Texto do banco.', sort_order: 20 },
      { slug: 'novo-termo', term: 'Novo Termo', definition_markdown: 'Criado pelo admin.', category: 'calculo', synonyms: ['Novo Termo'], sort_order: 10 },
    ]);
    assert.deepEqual(lista.map((t) => t.slug), ['novo-termo', 'nome-de-ouro']);
    assert.equal(lista[1]!.definitionMarkdown, 'Texto do banco.');
    assert.equal(lista[0]!.category, 'calculo');
  });

  it('campos vazios no banco usam o metadado do catálogo do mesmo slug', () => {
    const [t] = glossaryTermsFromDb([{ slug: 'bloqueio-444', term: 'Bloqueio 444', definition_markdown: 'x' }]);
    assert.equal(t!.category, 'bloqueios');
    assert.ok(t!.aliases.includes('Bloqueio 444'));
    assert.ok(t!.shortSummary.length > 10);
  });

  it('categoria inválida no banco não quebra e slugs duplicados ficam de fora', () => {
    const lista = glossaryTermsFromDb([
      { slug: 'xyz', term: 'Termo Xyz', definition_markdown: 'Texto.', category: 'inexistente' },
      { slug: 'score-vibracional', term: 'Score Vibracional', definition_markdown: 'antigo' },
    ]);
    assert.equal(lista.length, 1);
    assert.ok(['numeros', 'assinatura', 'calculo'].includes(lista[0]!.category));
  });
});
