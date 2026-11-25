import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL ??= 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-key';

const { glossaryCreateSchema, glossaryPatchSchema, glossarySlugSchema } = await import('./glossary.ts');

const base = {
  slug: 'novo-termo',
  term: 'Novo Termo',
  summary: 'Resumo curto e claro do termo.',
  definition_markdown: '### O que é\n\nExplicação suficiente do termo.',
  category: 'calculo',
};

describe('DEV-307 · validação do glossário no admin', () => {
  it('aceita um termo válido e preenche padrões', () => {
    const r = glossaryCreateSchema.safeParse(base);
    assert.ok(r.success);
    assert.equal(r.data.is_published, true);
    assert.deepEqual(r.data.synonyms, []);
  });

  it('recusa vocabulário proibido', () => {
    for (const ruim of ['Use o pêndulo', 'radiestesia ajuda', 'nome incompatível']) {
      const r = glossaryCreateSchema.safeParse({ ...base, definition_markdown: `### X\n\n${ruim} nesta explicação longa.` });
      assert.equal(r.success, false, ruim);
    }
    assert.equal(glossaryPatchSchema.safeParse({ summary: 'Este nome é incompatível com você.' }).success, false);
  });

  it('slug só com minúsculas, números e hífen; categoria da lista', () => {
    assert.equal(glossarySlugSchema.safeParse('Nome de Ouro').success, false);
    assert.equal(glossarySlugSchema.safeParse('nome-de-ouro').success, true);
    assert.equal(glossaryCreateSchema.safeParse({ ...base, category: 'outra' }).success, false);
  });

  it('PATCH exige ao menos um campo e não aceita campos desconhecidos', () => {
    assert.equal(glossaryPatchSchema.safeParse({}).success, false);
    assert.equal(glossaryPatchSchema.safeParse({ slug: 'x' }).success, false);
    assert.equal(glossaryPatchSchema.safeParse({ is_published: false }).success, true);
  });
});
