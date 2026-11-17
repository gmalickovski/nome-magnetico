import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_GLOSSARY_TERMS,
  GLOSSARY_CATEGORY_LABELS,
  GLOSSARY_CATEGORY_ORDER,
} from './canonical-terms.ts';
import { segmentTextWithGlossaryTerms } from './term-linker.ts';

const COPY_PROIBIDA = [/radiest/i, /p[êe]ndulo/i, /\bincompat[íi]vel\b/i, /entrega em/i];

describe('DEV-306 · catálogo do glossário', () => {
  it('tem pelo menos 70 verbetes, com slugs únicos', () => {
    assert.ok(CANONICAL_GLOSSARY_TERMS.length >= 70, `só ${CANONICAL_GLOSSARY_TERMS.length}`);
    const slugs = CANONICAL_GLOSSARY_TERMS.map((t) => t.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it('todo verbete tem resumo, definição, categoria válida e relacionados existentes', () => {
    const slugs = new Set(CANONICAL_GLOSSARY_TERMS.map((t) => t.slug));
    for (const t of CANONICAL_GLOSSARY_TERMS) {
      assert.ok(t.shortSummary.trim().length >= 20, `${t.slug}: resumo curto demais`);
      assert.ok(t.definitionMarkdown.trim().length >= 60, `${t.slug}: definição curta demais`);
      assert.ok(GLOSSARY_CATEGORY_ORDER.includes(t.category), `${t.slug}: categoria ${t.category}`);
      assert.ok(GLOSSARY_CATEGORY_LABELS[t.category]);
      for (const r of t.relatedSlugs ?? []) assert.ok(slugs.has(r), `${t.slug} aponta para ${r}, que não existe`);
    }
  });

  it('nenhum alias aponta para dois verbetes', () => {
    const dono = new Map<string, string>();
    for (const t of CANONICAL_GLOSSARY_TERMS) {
      for (const a of [...t.aliases, ...(t.exactCaseAliases ?? [])]) {
        const k = a.trim().toLowerCase();
        const anterior = dono.get(k);
        assert.ok(!anterior || anterior === t.slug, `alias "${a}" em ${anterior} e ${t.slug}`);
        dono.set(k, t.slug);
      }
    }
  });

  it('sem vocabulário proibido no texto voltado ao cliente', () => {
    for (const t of CANONICAL_GLOSSARY_TERMS) {
      const texto = `${t.term} ${t.shortSummary} ${t.definitionMarkdown}`;
      for (const re of COPY_PROIBIDA) assert.ok(!re.test(texto), `${t.slug}: ${re}`);
    }
  });

  it('termos-chave do sistema viram link para o verbete certo', () => {
    const casos: Array<[string, string]> = [
      ['Seu Nome de Ouro tem nota alta.', 'nome-de-ouro'],
      ['A Impressão mostra a primeira imagem.', 'numero-de-personalidade'],
      ['A Compatibilidade Neutra desconta pontos.', 'compatibilidade-neutra'],
      ['Veja a Regra do 2/4 no cálculo.', 'regra-do-2-e-4'],
      ['O Dia Natalício entra no Destino.', 'dia-natalicio'],
      ['A Tabela Cabalística define os valores.', 'tabela-cabalistica-das-letras'],
      ['O selo Maior nota aparece sempre.', 'selo-maior-nota'],
    ];
    for (const [texto, slug] of casos) {
      const termos = segmentTextWithGlossaryTerms(texto, CANONICAL_GLOSSARY_TERMS).filter((s) => s.type === 'term');
      assert.ok(
        termos.some((s) => s.type === 'term' && s.term.slug === slug),
        `"${texto}" deveria linkar ${slug}`,
      );
    }
  });
});

describe('DEV-312 · texto ao cliente sem saúde, travessão ou ×', () => {
  const PROIBIDO = /vitalidade|sa[úu]de|sintoma|dores? de cabe[çc]a|ins[ôo]nia|cardiovascular|sistema nervoso|—|×/i;
  it('nenhum verbete tem saúde, travessão ou × no título, resumo ou definição', () => {
    for (const t of CANONICAL_GLOSSARY_TERMS) {
      const texto = `${t.term}\n${t.shortSummary}\n${t.definitionMarkdown}`;
      assert.ok(!PROIBIDO.test(texto), `${t.slug}: ${texto.match(PROIBIDO)?.[0]}`);
    }
  });
});
