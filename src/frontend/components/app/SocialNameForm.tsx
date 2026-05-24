/**
 * Formulário para análise de Nome Social.
 * Envia para /api/analyze com product_type: 'nome_social'.
 */

import { useState } from 'react';
import { DateInput } from '../ui/DateInput';

interface FormState {
  nome_completo: string;
  data_nascimento: string;
  objetivo_apresentacao: string;
  vibracoes_desejadas: string;
  contexto_uso: string;
  estilo_preferido: string;
  genero: string;
  nomes_candidatos: string;
}

interface Props {
  nomeInicial?: string;
  dataInicial?: string;
  onSuccess?: (analysisId: string) => void;
}

const CONTEXTOS = [
  { value: 'profissional', label: 'Profissional' },
  { value: 'espiritual', label: 'Espiritual' },
  { value: 'criativo', label: 'Criativo' },
  { value: 'redes_sociais', label: 'Redes sociais' },
  { value: 'pessoal', label: 'Pessoal' },
];

const VIBRACOES_SUGESTOES = [
  'Autoridade',
  'Leveza',
  'Criatividade',
  'Espiritualidade',
  'Prosperidade',
  'Cura',
  'Liderança',
  'Conexão',
  'Intuição',
  'Expansão',
];

const GENEROS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'neutro', label: 'Neutro' },
];

function InfoHint({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group/info">
      <button
        type="button"
        aria-label="Ver explicação"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[11px] font-bold text-[#D4AF37] ring-1 ring-[#D4AF37]/25 transition hover:bg-[#D4AF37]/20 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
      >
        !
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-30 w-72 -translate-x-1/2 rounded-2xl bg-[#111111] p-4 text-xs leading-relaxed text-gray-300 opacity-0 shadow-2xl shadow-black/50 ring-1 ring-[#D4AF37]/20 transition group-hover/info:opacity-100 group-focus-within/info:opacity-100">
        {text}
      </span>
    </span>
  );
}

function SectionTitle({
  number,
  title,
  info,
  optional = false,
}: {
  number: string;
  title: string;
  info: string;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/12 text-xs font-bold text-[#D4AF37] ring-1 ring-[#D4AF37]/25">
        {number}
      </span>
      <h3 className="font-cinzel text-lg font-bold text-[#D4AF37]">{title}</h3>
      <InfoHint text={info} />
      {optional && <span className="text-xs font-medium text-gray-500">Opcional</span>}
    </div>
  );
}

export default function SocialNameForm({ nomeInicial = '', dataInicial = '', onSuccess }: Props) {
  const hasSavedBirthData = Boolean(nomeInicial && dataInicial);
  const [form, setForm] = useState<FormState>({
    nome_completo: nomeInicial,
    data_nascimento: dataInicial,
    objetivo_apresentacao: '',
    vibracoes_desejadas: '',
    contexto_uso: '',
    estilo_preferido: '',
    genero: '',
    nomes_candidatos: '',
  });

  const [editingBirthData, setEditingBirthData] = useState(!hasSavedBirthData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  function toggleVibracao(v: string) {
    const current = form.vibracoes_desejadas;
    const already = current.toLowerCase().includes(v.toLowerCase());
    if (already) {
      set('vibracoes_desejadas', current.replace(new RegExp(`,?\\s*${v}`, 'i'), '').replace(/^,\s*/, '').trim());
    } else {
      set('vibracoes_desejadas', current ? `${current}, ${v}` : v);
    }
  }

  const candidatosCount = form.nomes_candidatos
    .split(/[,;\n]+/)
    .filter(n => n.trim().length >= 2).length;

  async function handleSubmitCriar(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const nomeLimpo = form.nome_completo.trim();
    if (!nomeLimpo || nomeLimpo.split(/\s+/).length < 3) {
      setError('Informe seu nome completo de nascimento, com pelo menos 3 palavras.');
      return;
    }

    if (!form.data_nascimento) {
      setError('Informe sua data de nascimento.');
      return;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.data_nascimento)) {
      setError('A data de nascimento deve estar no formato DD/MM/AAAA.');
      return;
    }

    const candidatos = form.nomes_candidatos
      .split(/[,;\n]+/)
      .map(n => n.trim())
      .filter(n => n.length >= 2);

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: 'nome_social',
          nome_completo: nomeLimpo,
          data_nascimento: form.data_nascimento,
          objetivo_apresentacao: form.objetivo_apresentacao.trim() || undefined,
          vibracoes_desejadas: form.vibracoes_desejadas.trim() || undefined,
          contexto_uso: form.contexto_uso || undefined,
          estilo_preferido: form.estilo_preferido || undefined,
          genero_preferido: form.genero || undefined,
          nomes_candidatos: candidatos.length > 0 ? candidatos : undefined,
          nome_ja_escolhido: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao iniciar análise');

      setEditingBirthData(false);

      if (onSuccess) {
        onSuccess(data.analysisId);
      } else {
        window.location.href = `/app/resultado/${data.analysisId}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const chipClass = (selected: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
      selected
        ? 'bg-[#D4AF37] text-black shadow-[0_8px_24px_rgba(212,175,55,0.18)]'
        : 'bg-white/[0.04] text-gray-300 ring-1 ring-white/10 hover:bg-white/[0.07] hover:text-[#e5e2e1]'
    }`;

  return (
    <form onSubmit={handleSubmitCriar} className="space-y-5">
      <div className="rounded-2xl bg-[#202020]/80 p-5 ring-1 ring-[#D4AF37]/15 md:p-6">
        <div className="space-y-6">
          <SectionTitle
            number="01"
            title="Dados de nascimento"
            info="Use o nome civil completo de registro e a data correta. Eles são a base fixa do cálculo numerológico."
          />

          {hasSavedBirthData && !editingBirthData ? (
            <div className="rounded-2xl bg-[#131313]/80 p-4 ring-1 ring-[#D4AF37]/20">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Nome de nascimento</p>
                    <p className="mt-1 font-cinzel text-xl font-bold text-[#e5e2e1]">{form.nome_completo}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Data de nascimento</p>
                    <p className="mt-1 text-lg font-semibold text-[#D4AF37]">{form.data_nascimento}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBirthData(true)}
                  className="rounded-full border border-[#D4AF37]/40 px-5 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
                >
                  Editar dados
                </button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                Estes dados foram salvos na sua conta e serao usados como base fixa das suas harmonizacoes.
              </p>
            </div>
          ) : (
          <div className="grid items-start gap-6 md:grid-cols-[1fr_0.72fr]">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                Nome completo de nascimento *
                <InfoHint text="O diagnóstico exige o nome de registro civil completo, com nome e sobrenomes." />
              </label>
              <input
                type="text"
                value={form.nome_completo}
                onChange={e => set('nome_completo', e.target.value)}
                placeholder="Ex: Maria da Silva Santos"
                className="input-dark w-full"
                required
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                Data de nascimento *
                <InfoHint text="A data define o número de Destino, usado para medir a compatibilidade dos nomes candidatos." />
              </label>
              <DateInput
                value={form.data_nascimento}
                onChangeValue={v => set('data_nascimento', v)}
                className="input-dark w-full"
                required
              />
            </div>
          </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-[#202020]/80 p-5 ring-1 ring-[#D4AF37]/15 md:p-6">
        <div className="space-y-5">
          <SectionTitle
            number="02"
            title="Intenção e contexto"
            optional
            info="Essas respostas orientam o texto do relatório e ajudam a interpretar o uso prático do nome."
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Como você quer se apresentar neste momento?
            </label>
            <textarea
              value={form.objetivo_apresentacao}
              onChange={e => set('objetivo_apresentacao', e.target.value)}
              placeholder="Ex: Quero um nome com presença profissional, clareza e autoridade."
              rows={3}
              maxLength={500}
              className="input-dark w-full resize-none"
            />
            <p className="mt-1 text-xs text-gray-600">{form.objetivo_apresentacao.length}/500 caracteres</p>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-gray-300">Contexto principal de uso</label>
            <div className="flex flex-wrap gap-2">
              {CONTEXTOS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('contexto_uso', form.contexto_uso === opt.value ? '' : opt.value)}
                  className={chipClass(form.contexto_uso === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#202020]/80 p-5 ring-1 ring-[#D4AF37]/15 md:p-6">
        <div className="space-y-5">
          <SectionTitle
            number="03"
            title="Vibrações desejadas"
            optional
            info="Essas palavras ajudam a personalizar a narrativa do relatório. O ranking continua sendo calculado pelos critérios numerológicos."
          />

          <div className="flex flex-wrap gap-2">
            {VIBRACOES_SUGESTOES.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => toggleVibracao(v)}
                className={chipClass(form.vibracoes_desejadas.toLowerCase().includes(v.toLowerCase()))}
              >
                {v}
              </button>
            ))}
          </div>

          <textarea
            value={form.vibracoes_desejadas}
            onChange={e => set('vibracoes_desejadas', e.target.value)}
            placeholder="Ex: autoridade, expansão, cura, liderança..."
            rows={2}
            maxLength={300}
            className="input-dark w-full resize-none"
          />

          <div>
            <label className="mb-3 block text-sm font-medium text-gray-300">Preferência de gênero do nome</label>
            <div className="flex flex-wrap gap-2">
              {GENEROS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('genero', form.genero === opt.value ? '' : opt.value)}
                  className={chipClass(form.genero === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#202020]/80 p-5 ring-1 ring-[#D4AF37]/15 md:p-6">
        <div className="space-y-5">
          <SectionTitle
            number="04"
            title="Nomes candidatos"
            optional
            info="Se você informar nomes, eles entram no ranking. Se deixar vazio, o sistema gera variações próprias com menor descaracterização possível."
          />

          <textarea
            value={form.nomes_candidatos}
            onChange={e => set('nomes_candidatos', e.target.value)}
            placeholder="Ex: Mari, Maria Santos, Mariana Santos..."
            rows={4}
            className="input-dark w-full resize-none"
          />

          {candidatosCount > 0 ? (
            <p className="text-xs text-gray-500">{candidatosCount} nome(s) informado(s)</p>
          ) : (
            <p className="text-xs text-[#D4AF37]/80">Sem candidatos informados: o sistema gera sugestões.</p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/25">
          {error}
        </div>
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              Gerando análise...
            </span>
          ) : (
            'Gerar Harmonização'
          )}
        </button>
      </div>
    </form>
  );
}
