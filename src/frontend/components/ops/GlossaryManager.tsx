import React, { useCallback, useEffect, useState } from 'react';
import { opsFetch } from '../../ops/opsFetch';
import { fieldClass, ghostButtonClass, primaryButtonClass } from './promo-fields';

/** DEV-307 · Edição manual do glossário (a tabela `glossary_terms` é a fonte única). */

type Term = {
  slug: string;
  term: string;
  summary: string | null;
  definition_markdown: string;
  category: string | null;
  synonyms: string[] | null;
  exact_case_aliases: string[] | null;
  related_slugs: string[] | null;
  related_number: number | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number | null;
  is_published: boolean;
  updated_at: string;
};

const CATEGORIAS: Array<[string, string]> = [
  ['numeros', 'Números Principais'],
  ['calculo', 'Cálculo & Nota'],
  ['triangulos', 'Os 4 Triângulos'],
  ['bloqueios', 'Bloqueios Energéticos'],
  ['karma', 'Lições & Débitos Kármicos'],
  ['assinatura', 'Harmonização & Assinatura'],
  ['arcanos', 'Arcanos & Geometria'],
];

type Form = {
  slug: string;
  term: string;
  summary: string;
  definition_markdown: string;
  category: string;
  synonyms: string;
  exact_case_aliases: string;
  related_slugs: string;
  related_number: string;
  tags: string;
  meta_title: string;
  meta_description: string;
  sort_order: string;
  is_published: boolean;
};

const VAZIO: Form = {
  slug: '',
  term: '',
  summary: '',
  definition_markdown: '',
  category: 'assinatura',
  synonyms: '',
  exact_case_aliases: '',
  related_slugs: '',
  related_number: '',
  tags: '',
  meta_title: '',
  meta_description: '',
  sort_order: '',
  is_published: true,
};

const juntar = (a: string[] | null) => (a ?? []).join(', ');
const separar = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
const numero = (s: string) => (s.trim() === '' ? null : Number(s));

function paraForm(t: Term): Form {
  return {
    slug: t.slug,
    term: t.term,
    summary: t.summary ?? '',
    definition_markdown: t.definition_markdown,
    category: t.category ?? 'assinatura',
    synonyms: juntar(t.synonyms),
    exact_case_aliases: juntar(t.exact_case_aliases),
    related_slugs: juntar(t.related_slugs),
    related_number: t.related_number == null ? '' : String(t.related_number),
    tags: juntar(t.tags),
    meta_title: t.meta_title ?? '',
    meta_description: t.meta_description ?? '',
    sort_order: t.sort_order == null ? '' : String(t.sort_order),
    is_published: t.is_published,
  };
}

function paraCorpo(f: Form) {
  return {
    term: f.term,
    summary: f.summary,
    definition_markdown: f.definition_markdown,
    category: f.category,
    synonyms: separar(f.synonyms),
    exact_case_aliases: separar(f.exact_case_aliases),
    related_slugs: separar(f.related_slugs),
    related_number: numero(f.related_number),
    tags: separar(f.tags),
    meta_title: f.meta_title || null,
    meta_description: f.meta_description || null,
    sort_order: numero(f.sort_order),
    is_published: f.is_published,
  };
}

const textareaClass =
  'w-full rounded-2xl bg-[#0c0c0c] px-4 py-3 text-sm leading-relaxed text-[#e5e2e1] outline outline-1 outline-[#d7c6ff]/15 placeholder:text-[#76746a] focus:outline-[#d7c6ff]/40';

export function GlossaryManager() {
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<'' | 'true' | 'false'>('');
  const [termos, setTermos] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [editando, setEditando] = useState<'novo' | string | null>(null);
  const [form, setForm] = useState<Form>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async (busca: string, pub: string) => {
    setLoading(true);
    setErro('');
    const params = new URLSearchParams();
    if (busca.trim()) params.set('q', busca.trim());
    if (pub) params.set('published', pub);
    const r = await opsFetch<{ terms: Term[] }>(`/api/ops/glossary?${params.toString()}`);
    if (r.ok) setTermos(r.data.terms);
    else setErro(r.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void carregar('', '');
  }, [carregar]);

  const abrir = (t: Term | null) => {
    setAviso('');
    setErro('');
    setEditando(t ? t.slug : 'novo');
    setForm(t ? paraForm(t) : VAZIO);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    const corpo = paraCorpo(form);
    const r =
      editando === 'novo'
        ? await opsFetch<{ term: Term }>('/api/ops/glossary', { method: 'POST', body: { ...corpo, slug: form.slug } })
        : await opsFetch<{ term: Term }>(`/api/ops/glossary/${editando}`, { method: 'PATCH', body: corpo });
    setSalvando(false);
    if (!r.ok) {
      setErro(r.error);
      return;
    }
    setAviso(`“${r.data.term.term}” salvo. O site atualiza na hora.`);
    setEditando(null);
    void carregar(q, filtro);
  };

  const alternarPublicacao = async (t: Term) => {
    const r = await opsFetch<{ term: Term }>(`/api/ops/glossary/${t.slug}`, {
      method: 'PATCH',
      body: { is_published: !t.is_published },
    });
    if (r.ok) {
      setAviso(`“${t.term}” ${t.is_published ? 'despublicado' : 'publicado'}.`);
      void carregar(q, filtro);
    } else setErro(r.error);
  };

  const campo = (k: keyof Form) => ({
    value: form[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#f2ca50]">Conteúdo</p>
          <h1 className="mt-2 font-cinzel text-2xl text-[#e5e2e1]">Glossário</h1>
          <p className="mt-2 max-w-xl text-sm text-[#A0A0A0]">
            Os textos do glossário vêm desta tabela. Editar, publicar ou despublicar aqui muda o site na hora.
          </p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={() => abrir(null)}>
          Novo termo
        </button>
      </header>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void carregar(q, filtro);
        }}
      >
        <input className={fieldClass} placeholder="Buscar por termo ou slug" value={q} onChange={(e) => setQ(e.target.value)} />
        <select
          className={`${fieldClass} sm:max-w-[200px]`}
          value={filtro}
          onChange={(e) => {
            const v = e.target.value as '' | 'true' | 'false';
            setFiltro(v);
            void carregar(q, v);
          }}
        >
          <option value="">Todos</option>
          <option value="true">Publicados</option>
          <option value="false">Despublicados</option>
        </select>
        <button type="submit" className={ghostButtonClass}>
          Buscar
        </button>
      </form>

      {aviso && <p role="status" className="text-sm text-[#d7c6ff]">{aviso}</p>}
      {erro && <p role="alert" className="text-sm text-red-400">{erro}</p>}

      {editando && (
        <form onSubmit={salvar} className="space-y-4 rounded-2xl bg-[#1c1c1c] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] sm:p-6">
          <h2 className="font-cinzel text-lg text-[#f2ca50]">{editando === 'novo' ? 'Novo termo' : `Editar: ${form.term}`}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              Slug (endereço)
              <input className={fieldClass} required disabled={editando !== 'novo'} placeholder="ex.: nome-de-ouro" {...campo('slug')} />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              Termo
              <input className={fieldClass} required {...campo('term')} />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              Categoria
              <select className={fieldClass} {...campo('category')}>
                {CATEGORIAS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1 text-xs text-[#A0A0A0]">
                Número (1–22)
                <input className={fieldClass} inputMode="numeric" {...campo('related_number')} />
              </label>
              <label className="space-y-1 text-xs text-[#A0A0A0]">
                Ordem
                <input className={fieldClass} inputMode="numeric" {...campo('sort_order')} />
              </label>
            </div>
          </div>
          <label className="block space-y-1 text-xs text-[#A0A0A0]">
            Resumo (card e tooltip, 1 a 2 frases)
            <textarea className={textareaClass} rows={2} required {...campo('summary')} />
          </label>
          <label className="block space-y-1 text-xs text-[#A0A0A0]">
            Definição (markdown)
            <textarea className={`${textareaClass} font-mono`} rows={12} required {...campo('definition_markdown')} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              Sinônimos que viram link (separados por vírgula)
              <input className={fieldClass} {...campo('synonyms')} />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              Só com inicial maiúscula (ex.: Impressão)
              <input className={fieldClass} {...campo('exact_case_aliases')} />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              Relacionados (slugs, separados por vírgula)
              <input className={fieldClass} {...campo('related_slugs')} />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              Tags
              <input className={fieldClass} {...campo('tags')} />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              Título SEO
              <input className={fieldClass} {...campo('meta_title')} />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              Descrição SEO
              <input className={fieldClass} {...campo('meta_description')} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#e5e2e1]">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
            />
            Publicado
          </label>
          <div className="flex gap-3">
            <button type="submit" className={primaryButtonClass} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" className={ghostButtonClass} onClick={() => setEditando(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section aria-label="Termos do glossário" className="space-y-2">
        <p className="text-xs text-[#76746a]">{loading ? 'Carregando...' : `${termos.length} termos`}</p>
        {termos.map((t) => (
          <div key={t.slug} className="flex flex-col gap-3 rounded-2xl bg-[#1c1c1c] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-[#e5e2e1]">
                {t.term}{' '}
                {!t.is_published && <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[#A0A0A0]">despublicado</span>}
              </p>
              <p className="truncate text-xs text-[#76746a]">
                /{t.slug} · {CATEGORIAS.find(([v]) => v === t.category)?.[1] ?? 'Sem categoria'}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className={ghostButtonClass} onClick={() => abrir(t)}>
                Editar
              </button>
              <button type="button" className={ghostButtonClass} onClick={() => void alternarPublicacao(t)}>
                {t.is_published ? 'Despublicar' : 'Publicar'}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
